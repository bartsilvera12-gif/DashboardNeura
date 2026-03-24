/**
 * Servicio de onboarding completo de cliente.
 * Orquesta: empresa, branding, módulos, secciones, widgets, admin.
 * Usa admin client para bypass RLS (solo invocable por super_admin vía action).
 */

import { dbFrom } from "@/lib/db/schema";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { createCompanyAdmin } from "@/lib/auth/create-company-admin";
import { notifyAdminCreated } from "@/lib/notifications/onboarding-notify";
import { seedDefaultProductColumnConfig } from "@/lib/config/product-column-config";
import type { CompanyType } from "@/lib/types/database";

export type OnboardingErrorCode =
  | "COMPANY_SLUG_EXISTS"
  | "COMPANY_FAILED"
  | "BRANDING_FAILED"
  | "MODULES_FAILED"
  | "SECTIONS_FAILED"
  | "WIDGETS_FAILED"
  | "ADMIN_FAILED"
  | "UNKNOWN";

export interface OnboardingCompanyData {
  name: string;
  slug: string;
  company_type: CompanyType;
  description?: string | null;
  is_active: boolean;
  contact_name: string;
  contact_phone: string;
}

export interface OnboardingAdminData {
  email: string;
  password: string;
  full_name: string;
}

export interface OnboardingModulesData {
  modules: Array<{ module_id: string; is_enabled: boolean; sort_order: number }>;
  sections: Array<{
    module_section_id: string;
    is_enabled: boolean;
    sort_order: number;
  }>;
}

export interface OnboardingWidgetsData {
  widgets: Array<{
    widget_id: string;
    is_enabled: boolean;
    sort_order: number;
  }>;
}

export interface OnboardingBrandingData {
  display_name: string | null;
  primary_color: string | null;
  logo_url: string | null;
}

export interface OnboardingInput {
  company: OnboardingCompanyData;
  admin: OnboardingAdminData;
  modules: OnboardingModulesData;
  widgets: OnboardingWidgetsData;
  branding: OnboardingBrandingData;
}

export interface OnboardingResult {
  ok: boolean;
  companyId?: string;
  error?: string;
  errorCode?: OnboardingErrorCode;
}

/**
 * Ejecuta el onboarding completo en orden.
 * Si falla en algún paso, intenta rollback de lo creado.
 */
export async function executeOnboarding(
  input: OnboardingInput
): Promise<OnboardingResult> {
  const { company, admin, modules, widgets, branding } = input;

  let companyId: string | null = null;

  try {
    const supabase = getSupabaseAdminClient();
    console.log("[ONBOARDING] Paso 0: Iniciando onboarding", { company: company.name, slug: company.slug });

    // 1. Crear empresa
    const slug = company.slug.toLowerCase().replace(/\s+/g, "-");
    console.log("[ONBOARDING] Paso 1: Creando empresa en DB", { name: company.name, slug });
    const companyRow: Record<string, unknown> = {
      name: company.name.trim(),
      slug,
      company_type: company.company_type,
      description: company.description?.trim() || null,
      is_active: company.is_active,
      contact_name: company.contact_name?.trim() || null,
      contact_phone: company.contact_phone?.trim() || null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result = await (dbFrom(supabase, "companies") as any).insert(companyRow).select("id").single();
    let companyError = result.error;

    // Fallback: si falla por columnas inexistentes o schema cache desactualizado, intentar con schema base
    const errMsgForFallback = companyError ? String((companyError as { message?: string }).message ?? "") : "";
    const isSchemaCacheOrMissingColumn =
      /column.*does not exist/i.test(errMsgForFallback) ||
      /schema cache/i.test(errMsgForFallback) ||
      /could not find.*company_type/i.test(errMsgForFallback);
    if (companyError && isSchemaCacheOrMissingColumn) {
      const baseRow = {
        name: company.name.trim(),
        slug,
        is_active: company.is_active,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result = await (dbFrom(supabase, "companies") as any).insert(baseRow).select("id").single();
      companyError = result.error;
    }

    if (companyError) {
      const errMsg = (companyError as { message?: string })?.message ?? String(companyError);
      const errCode = (companyError as { code?: string })?.code ?? "";
      console.error("[ONBOARDING ERROR] Paso 1 company:", JSON.stringify({ message: errMsg, code: errCode, details: (companyError as { details?: string })?.details }));
      if (errCode === "23505") {
        return {
          ok: false,
          error: "Ya existe una empresa con ese slug. Usa otro slug.",
          errorCode: "COMPANY_SLUG_EXISTS",
        };
      }
      const isSchemaRelated =
        /column.*does not exist/i.test(errMsg) ||
        /schema cache/i.test(errMsg) ||
        /could not find.*company_type/i.test(errMsg);
      const hint = isSchemaRelated
        ? " Falta aplicar migraciones o refrescar el schema cache. Ejecuta: supabase db push (o el SQL en Dashboard > SQL Editor). Luego refresca con: NOTIFY pgrst, 'reload schema';"
        : "";
      return {
        ok: false,
        error: (process.env.NODE_ENV === "development" ? `Error al crear la empresa: ${errMsg}` : "Error al crear la empresa") + hint,
        errorCode: "COMPANY_FAILED",
      };
    }

    companyId = result.data?.id ?? null;
    if (!companyId) {
      return { ok: false, error: "Error interno: no se obtuvo el ID de la empresa", errorCode: "COMPANY_FAILED" };
    }
    console.log("[ONBOARDING] Paso 1 OK: Empresa creada", { companyId });

    // 2. Crear branding
    const brandingPayload = {
      company_id: companyId,
      display_name: branding.display_name?.trim() || null,
      primary_color: branding.primary_color?.trim() || null,
      logo_url: branding.logo_url?.trim() || null,
    };
    console.log("[ONBOARDING] Paso 2: Insertando branding", { companyId, brandingPayload });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: brandingData, error: brandingError } = await (dbFrom(supabase, "company_branding") as any).insert(brandingPayload).select("id").single();

    if (brandingError) {
      console.error("[ONBOARDING ERROR] Paso 2 branding - error real:", JSON.stringify({ message: brandingError?.message, code: brandingError?.code, details: brandingError?.details }));
      if (companyId) await rollbackCompany(companyId);
      const errDetail = brandingError?.message ?? brandingError?.details ?? String(brandingError);
      return {
        ok: false,
        error: process.env.NODE_ENV === "development" ? `Error al configurar el branding: ${errDetail}` : "Error al configurar el branding de la empresa",
        errorCode: "BRANDING_FAILED",
      };
    }
    console.log("[ONBOARDING] Paso 2 OK: Branding creado", { brandingId: brandingData?.id });

    // 3. Configurar módulos
    if (modules.modules.length > 0) {
      const moduleRows = modules.modules.map((m) => ({
        company_id: companyId!,
        module_id: m.module_id,
        is_enabled: m.is_enabled,
        sort_order: m.sort_order,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: modError } = await (dbFrom(supabase, "company_modules") as any).insert(moduleRows);
      if (modError) {
        console.error("[ONBOARDING ERROR] Paso 3 módulos:", modError);
        if (companyId) await rollbackCompany(companyId);
        return {
          ok: false,
          error: "Error al configurar los módulos de la empresa",
          errorCode: "MODULES_FAILED",
        };
      }
    }

    // 4. Configurar secciones
    if (modules.sections.length > 0) {
      const sectionRows = modules.sections.map((s) => ({
        company_id: companyId!,
        module_section_id: s.module_section_id,
        is_enabled: s.is_enabled,
        sort_order: s.sort_order,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: secError } = await (dbFrom(supabase, "company_module_sections") as any).insert(sectionRows);
      if (secError) {
        console.error("[ONBOARDING ERROR] Paso 4 secciones:", secError);
        if (companyId) await rollbackCompany(companyId);
        return {
          ok: false,
          error: "Error al configurar las secciones de los módulos",
          errorCode: "SECTIONS_FAILED",
        };
      }
    }

    // 5. Configurar widgets
    if (widgets.widgets.length > 0) {
      const widgetRows = widgets.widgets.map((w) => ({
        company_id: companyId!,
        widget_id: w.widget_id,
        is_enabled: w.is_enabled,
        config: {},
        sort_order: w.sort_order,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: widError } = await (dbFrom(supabase, "company_dashboard_widgets") as any).insert(widgetRows);
      if (widError) {
        console.error("[ONBOARDING ERROR] Paso 5 widgets:", widError);
        if (companyId) await rollbackCompany(companyId);
        return {
          ok: false,
          error: "Error al configurar los widgets del dashboard",
          errorCode: "WIDGETS_FAILED",
        };
      }
    }

    // 5b. Siembra configuración por defecto de columnas de productos
    const seedResult = await seedDefaultProductColumnConfig(companyId!, supabase);
    if (!seedResult.ok) {
      console.warn("[ONBOARDING] Product column config no sembrado:", seedResult.error);
      // No falla el onboarding; se usarán defaults en código
    } else {
      console.log("[ONBOARDING] Paso 5b OK: Product column config sembrado");
    }

    // 6. Crear admin principal
    if (!companyId) {
      return { ok: false, error: "Error interno: empresa no creada", errorCode: "UNKNOWN" };
    }
    console.log("[ONBOARDING] Paso 6: Creando usuario admin", { email: admin.email });
    const adminResult = await createCompanyAdmin({
      email: admin.email,
      password: admin.password,
      fullName: admin.full_name,
      companyId,
    });

    if (!adminResult.ok) {
      console.error("[ONBOARDING ERROR] Paso 6 admin:", adminResult.error);
      if (companyId) await rollbackCompany(companyId);
      return {
        ok: false,
        error: adminResult.error ?? "Error al crear el administrador",
        errorCode: "ADMIN_FAILED",
      };
    }
    console.log("[ONBOARDING] Paso 6 OK: Admin creado y roles asignados");

    // Notificación futura (no bloquea el flujo)
    await notifyAdminCreated({
      adminEmail: admin.email,
      adminName: admin.full_name,
      companyName: company.name,
      companySlug: company.slug,
    }).catch((e) => console.warn("notifyAdminCreated:", e));

    console.log("[ONBOARDING] Completado OK", { companyId });
    return { ok: true, companyId };
  } catch (e) {
    console.error("[ONBOARDING ERROR] Excepción no controlada:", e);
    if (companyId) {
      await rollbackCompany(companyId);
    }
    const errMsg = e instanceof Error ? e.message : e != null ? String(e) : "Error inesperado en el onboarding";
    return {
      ok: false,
      error: errMsg,
      errorCode: "UNKNOWN",
    };
  }
}

async function rollbackCompany(companyId: string): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    // CASCADE elimina company_modules, company_module_sections, company_branding, etc.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (dbFrom(supabase, "companies") as any).delete().eq("id", companyId);
  } catch (e) {
    console.error("rollbackCompany:", e);
  }
}
