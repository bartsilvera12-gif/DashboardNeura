"use server";

import { revalidatePath } from "next/cache";
import {
  setCompanyModules,
  setCompanyModuleSections,
} from "@/lib/config/company-modules-service";
import { upsertCompanyBranding } from "@/lib/config/company-branding-service";
import { setCompanyDashboardWidgets } from "@/lib/config/company-dashboard-service";
import { setCompanyFormFields } from "@/lib/config/company-forms-service";
import {
  setCompanyProductColumnConfig,
  type ProductColumnConfigInput,
} from "@/lib/config/product-column-config";

export interface SaveModulesInput {
  modules: Array<{ module_id: string; is_enabled: boolean; sort_order: number }>;
  sections: Array<{
    module_section_id: string;
    is_enabled: boolean;
    sort_order: number;
  }>;
}

export async function saveModulesConfigAction(
  companyId: string,
  input: SaveModulesInput
): Promise<{ ok: boolean; error?: string }> {
  if (!companyId) {
    return { ok: false, error: "ID de empresa requerido" };
  }

  const modulesOk = await setCompanyModules(companyId, input.modules);
  const sectionsOk = await setCompanyModuleSections(companyId, input.sections);

  if (!modulesOk || !sectionsOk) {
    return { ok: false, error: "No se pudo guardar la configuración" };
  }

  revalidatePath("/empresas");
  revalidatePath(`/empresas/${companyId}/configurar`);
  revalidatePath("/"); // layout usa getCompanyModules
  return { ok: true };
}

export interface SaveWidgetsInput {
  widgets: Array<{
    widget_id: string;
    is_enabled: boolean;
    sort_order: number;
  }>;
}

export async function saveWidgetsConfigAction(
  companyId: string,
  input: SaveWidgetsInput
): Promise<{ ok: boolean; error?: string }> {
  if (!companyId) {
    return { ok: false, error: "ID de empresa requerido" };
  }

  const rows = input.widgets.map((w) => ({
    widget_id: w.widget_id,
    is_enabled: w.is_enabled,
    config: {},
    sort_order: w.sort_order,
  }));
  const ok = await setCompanyDashboardWidgets(companyId, rows);
  if (!ok) return { ok: false, error: "No se pudo guardar la configuración de widgets" };

  revalidatePath(`/empresas/${companyId}/configurar`);
  revalidatePath("/");
  return { ok: true };
}

export interface SaveFormFieldsInput {
  fields: Array<{
    form_field_id: string;
    is_visible: boolean;
    is_required: boolean;
    is_editable: boolean;
    sort_order: number;
  }>;
}

export async function saveFormFieldsConfigAction(
  companyId: string,
  input: SaveFormFieldsInput
): Promise<{ ok: boolean; error?: string }> {
  if (!companyId) {
    return { ok: false, error: "ID de empresa requerido" };
  }

  const ok = await setCompanyFormFields(companyId, input.fields);
  if (!ok) return { ok: false, error: "No se pudo guardar la configuración de campos" };

  revalidatePath(`/empresas/${companyId}/configurar`);
  return { ok: true };
}

export interface SaveBrandingInput {
  display_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
}

export async function saveBrandingConfigAction(
  companyId: string,
  input: SaveBrandingInput
): Promise<{ ok: boolean; error?: string }> {
  if (!companyId) {
    return { ok: false, error: "ID de empresa requerido" };
  }

  const primaryColor = input.primary_color?.trim();
  if (primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
    return { ok: false, error: "Color debe ser un hex válido (ej: #18181b)" };
  }

  const result = await upsertCompanyBranding(companyId, {
    display_name: input.display_name?.trim() || null,
    logo_url: input.logo_url?.trim() || null,
    primary_color: primaryColor || null,
  });

  if (!result) {
    return { ok: false, error: "No se pudo guardar el branding" };
  }

  revalidatePath(`/empresas/${companyId}/configurar`);
  revalidatePath("/");
  return { ok: true };
}

export interface SaveProductColumnsInput {
  columns: ProductColumnConfigInput[];
}

export async function saveProductColumnsConfigAction(
  companyId: string,
  input: SaveProductColumnsInput
): Promise<{ ok: boolean; error?: string }> {
  if (!companyId) {
    return { ok: false, error: "ID de empresa requerido" };
  }
  const result = await setCompanyProductColumnConfig(companyId, input.columns);
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath(`/empresas/${companyId}/configurar`);
  revalidatePath("/productos");
  revalidatePath("/dashboard");
  return { ok: true };
}
