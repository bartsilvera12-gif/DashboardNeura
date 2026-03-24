import { dbFrom } from "@/lib/db/schema";
/**
 * Servicio para configurar campos de formulario por empresa.
 */

import { getSupabaseClient } from "@/lib/supabase";
import type { FormDefinition, FormField } from "@/lib/types/database";

export interface FormDefinitionWithFields extends FormDefinition {
  fields: FormField[];
}

export async function getAllFormDefinitionsWithFields(): Promise<FormDefinitionWithFields[]> {
  try {
    const supabase = await getSupabaseClient();
    const { data: defs } = await dbFrom(supabase, "form_definitions")
      .select("*")
      .order("module_id");

    if (!defs?.length) return [];

    const result: FormDefinitionWithFields[] = [];
    for (const d of defs) {
      const { data: fields } = await dbFrom(supabase, "form_fields")
        .select("*")
        .eq("form_definition_id", d.id)
        .order("default_sort_order");
      result.push({
        ...d,
        fields: fields ?? [],
      });
    }
    return result;
  } catch {
    return [];
  }
}

export async function getCompanyFormFieldsConfig(companyId: string): Promise<
  Map<string, { is_visible: boolean; is_required: boolean; is_editable: boolean; sort_order: number }>
> {
  try {
    const supabase = await getSupabaseClient();
    const { data } = await dbFrom(supabase, "company_form_fields")
      .select("form_field_id, is_visible, is_required, is_editable, sort_order")
      .eq("company_id", companyId);

    const map = new Map<string, { is_visible: boolean; is_required: boolean; is_editable: boolean; sort_order: number }>();
    for (const row of data ?? []) {
      map.set(row.form_field_id, {
        is_visible: row.is_visible ?? true,
        is_required: row.is_required ?? false,
        is_editable: row.is_editable ?? true,
        sort_order: row.sort_order ?? 0,
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

export interface CompanyFormFieldConfig {
  form_field_id: string;
  is_visible: boolean;
  is_required: boolean;
  is_editable: boolean;
  sort_order: number;
}

export async function setCompanyFormFields(
  companyId: string,
  configs: CompanyFormFieldConfig[]
): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient();
    await dbFrom(supabase, "company_form_fields").delete().eq("company_id", companyId);

    if (configs.length > 0) {
      const rows = configs.map((c) => ({
        company_id: companyId,
        form_field_id: c.form_field_id,
        is_visible: c.is_visible,
        is_required: c.is_required,
        is_editable: c.is_editable,
        sort_order: c.sort_order,
      }));
      const { error } = await dbFrom(supabase, "company_form_fields").insert(rows);
      if (error) {
        console.error("setCompanyFormFields error:", error);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.error("setCompanyFormFields:", e);
    return false;
  }
}
