import { dbFrom } from "@/lib/db/schema";
/**
 * Servicio de configuración por empresa.
 * Obtiene módulos, secciones, widgets, branding y campos de formulario
 * según la empresa activa.
 */

import { getSupabaseClient } from "@/lib/supabase";
import type {
  Company,
  CompanyBranding,
  CompanyFormField,
  CompanyModuleSection,
  DashboardWidget,
  Module,
  ModuleSection,
  ResolvedFormField,
} from "@/lib/types/database";

export interface CompanyModulesConfig {
  modules: Array<Module & { is_enabled: boolean; sort_order: number }>;
  sectionsByModule: Record<string, Array<ModuleSection & { is_enabled: boolean }>>;
}

export interface CompanyDashboardConfig {
  widgets: Array<DashboardWidget & { is_enabled: boolean; config: Record<string, unknown>; sort_order: number }>;
}

export interface CompanyFormFieldsConfig {
  fields: ResolvedFormField[];
}

/**
 * Obtiene los módulos habilitados para una empresa.
 * Si no hay configuración en company_modules, devuelve todos los módulos activos.
 */
export async function getCompanyModules(companyId: string | null): Promise<CompanyModulesConfig> {
  try {
    const supabase = await getSupabaseClient();

    const { data: modules } = await dbFrom(supabase, "modules").select("*").eq("is_active", true).order("sort_order");

    if (!modules?.length) {
      return { modules: [], sectionsByModule: {} };
    }

    if (!companyId) {
      return {
        modules: modules.map((m) => ({ ...m, is_enabled: true, sort_order: m.sort_order })),
        sectionsByModule: {},
      };
    }

    const { data: companyModules } = await dbFrom(supabase, "company_modules")
      .select("module_id, is_enabled, sort_order")
      .eq("company_id", companyId);

    const cmMap = new Map(companyModules?.map((cm) => [cm.module_id, cm]) ?? []);

    const enabledModules = modules
      .filter((m) => {
        const cm = cmMap.get(m.id);
        return cm ? cm.is_enabled : true;
      })
      .map((m) => {
        const cm = cmMap.get(m.id);
        return {
          ...m,
          is_enabled: true,
          sort_order: cm?.sort_order ?? m.sort_order,
        };
      })
      .sort((a, b) => a.sort_order - b.sort_order);

    const { data: sections } = await dbFrom(supabase, "module_sections")
      .select("*")
      .in("module_id", modules.map((m) => m.id))
      .order("sort_order");

    const { data: companySections } = await dbFrom(supabase, "company_module_sections")
      .select("module_section_id, is_enabled")
      .eq("company_id", companyId);

    const csMap = new Map(companySections?.map((cs) => [cs.module_section_id, cs]) ?? []);

    const sectionsByModule: Record<string, Array<ModuleSection & { is_enabled: boolean }>> = {};
    for (const s of sections ?? []) {
      const key = s.module_id;
      if (!sectionsByModule[key]) sectionsByModule[key] = [];
      const cs = csMap.get(s.id);
      const is_enabled = cs ? cs.is_enabled : true;
      sectionsByModule[key].push({ ...s, is_enabled });
    }

    for (const key of Object.keys(sectionsByModule)) {
      sectionsByModule[key].sort((a, b) => a.sort_order - b.sort_order);
    }

    return {
      modules: enabledModules,
      sectionsByModule,
    };
  } catch {
    return getDefaultModulesConfig();
  }
}

/**
 * Obtiene los widgets del dashboard para una empresa.
 */
export async function getCompanyDashboardWidgets(companyId: string | null): Promise<CompanyDashboardConfig> {
  try {
    const supabase = await getSupabaseClient();

    const { data: widgets } = await dbFrom(supabase, "dashboard_widgets")
      .select("*")
      .order("sort_order");

    if (!widgets?.length) {
      return { widgets: [] };
    }

    if (!companyId) {
      return {
        widgets: widgets.map((w) => ({
          ...w,
          is_enabled: true,
          config: (w.default_config as Record<string, unknown>) ?? {},
          sort_order: w.sort_order,
        })),
      };
    }

    const { data: companyWidgets } = await dbFrom(supabase, "company_dashboard_widgets")
      .select("widget_id, is_enabled, config, sort_order")
      .eq("company_id", companyId);

    const cwMap = new Map(companyWidgets?.map((cw) => [cw.widget_id, cw]) ?? []);

    const result = widgets
      .map((w) => {
        const cw = cwMap.get(w.id);
        const is_enabled = cw ? cw.is_enabled : true;
        if (!is_enabled) return null;
        return {
          ...w,
          is_enabled,
          config: (cw?.config as Record<string, unknown>) ?? (w.default_config as Record<string, unknown>) ?? {},
          sort_order: cw?.sort_order ?? w.sort_order,
        };
      })
      .filter((w): w is NonNullable<typeof w> => w !== null)
      .sort((a, b) => a.sort_order - b.sort_order);

    return { widgets: result };
  } catch {
    return { widgets: [] };
  }
}

/**
 * Obtiene los campos de un formulario resueltos para una empresa.
 * Aplica overrides de company_form_fields.
 */
export async function getCompanyFormFields(
  companyId: string | null,
  moduleCode: string,
  entityCode: string,
  formCode: string
): Promise<CompanyFormFieldsConfig> {
  try {
    const supabase = await getSupabaseClient();

    const { data: moduleRow } = await dbFrom(supabase, "modules").select("id").eq("code", moduleCode).single();
    if (!moduleRow) return { fields: [] };

    const { data: formDef } = await dbFrom(supabase, "form_definitions")
      .select("id")
      .eq("module_id", moduleRow.id)
      .eq("entity_code", entityCode)
      .eq("form_code", formCode)
      .single();

    if (!formDef) {
      return { fields: [] };
    }

    const { data: formFields } = await dbFrom(supabase, "form_fields")
      .select("*")
      .eq("form_definition_id", formDef.id)
      .order("default_sort_order");

    if (!formFields?.length) {
      return { fields: [] };
    }

    let companyOverrides: CompanyFormField[] = [];
    if (companyId) {
      const { data } = await dbFrom(supabase, "company_form_fields")
        .select("*")
        .eq("company_id", companyId)
        .in("form_field_id", formFields.map((f) => f.id));
      companyOverrides = data ?? [];
    }

    const overrideMap = new Map(companyOverrides.map((o) => [o.form_field_id, o]));

    const resolved: ResolvedFormField[] = formFields.map((f) => {
      const o = overrideMap.get(f.id);
      return {
        id: f.id,
        code: f.code,
        name: f.name,
        type: f.type,
        is_visible: o?.is_visible ?? f.default_visible,
        is_required: o?.is_required ?? f.default_required,
        is_editable: o?.is_editable ?? f.default_editable,
        sort_order: o?.sort_order ?? f.default_sort_order,
        options: f.options ?? {},
      };
    });

    resolved.sort((a, b) => a.sort_order - b.sort_order);

    return { fields: resolved };
  } catch {
    return { fields: [] };
  }
}

/**
 * Obtiene el branding de una empresa.
 */
export async function getCompanyBranding(companyId: string | null): Promise<CompanyBranding | null> {
  if (!companyId) return null;
  try {
    const supabase = await getSupabaseClient();
    const { data } = await dbFrom(supabase, "company_branding").select("*").eq("company_id", companyId).single();
    return data;
  } catch {
    return null;
  }
}

/**
 * Obtiene todas las empresas (para Super Admin).
 */
export async function getCompanies(): Promise<Company[]> {
  try {
    const supabase = await getSupabaseClient();
    const { data } = await dbFrom(supabase, "companies").select("*").order("name");
    return data ?? [];
  } catch {
    return [];
  }
}

function getDefaultModulesConfig(): CompanyModulesConfig {
  return {
    modules: [
      { id: "1", code: "dashboard", name: "Dashboard", path: "/dashboard", sort_order: 10, is_active: true, created_at: "", is_enabled: true },
      { id: "2", code: "productos", name: "Productos", path: "/productos", sort_order: 20, is_active: true, created_at: "", is_enabled: true },
      { id: "5", code: "pedidos", name: "Gestión de pedidos", path: "/pedidos", sort_order: 25, is_active: true, created_at: "", is_enabled: true },
      { id: "3", code: "usuarios", name: "Usuarios", path: "/usuarios", sort_order: 30, is_active: true, created_at: "", is_enabled: true },
      { id: "4", code: "empresas", name: "Empresas", path: "/empresas", sort_order: 40, is_active: true, created_at: "", is_enabled: true },
    ],
    sectionsByModule: {},
  };
}
