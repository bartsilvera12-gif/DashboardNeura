/**
 * Servicio CRUD de empresas para Super Admin.
 * Operaciones sobre la tabla companies y configuraciones relacionadas.
 */

import { getSupabaseClient } from "@/lib/supabase";
import type { Company } from "@/lib/types/database";

export interface CreateCompanyInput {
  name: string;
  slug: string;
  is_active?: boolean;
}

export interface UpdateCompanyInput {
  name?: string;
  slug?: string;
  is_active?: boolean;
}

/**
 * Crea una nueva empresa.
 * El Super Admin debe crear también los registros en company_modules,
 * company_dashboard_widgets, company_branding según la configuración deseada.
 */
export async function createCompany(input: CreateCompanyInput): Promise<Company | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("companies")
      .insert({
        name: input.name,
        slug: input.slug.toLowerCase().replace(/\s+/g, "-"),
        is_active: input.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("createCompany error:", error);
      return null;
    }
    return data;
  } catch (e) {
    console.error("createCompany:", e);
    return null;
  }
}

/**
 * Actualiza una empresa existente.
 */
export async function updateCompany(id: string, input: UpdateCompanyInput): Promise<Company | null> {
  try {
    const supabase = getSupabaseClient();
    const payload: Record<string, unknown> = {};
    if (input.name != null) payload.name = input.name;
    if (input.slug != null) payload.slug = input.slug.toLowerCase().replace(/\s+/g, "-");
    if (input.is_active != null) payload.is_active = input.is_active;

    const { data, error } = await supabase
      .from("companies")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("updateCompany error:", error);
      return null;
    }
    return data;
  } catch (e) {
    console.error("updateCompany:", e);
    return null;
  }
}

/**
 * Activa o desactiva una empresa.
 */
export async function setCompanyActive(id: string, isActive: boolean): Promise<boolean> {
  const result = await updateCompany(id, { is_active: isActive });
  return result != null;
}

/**
 * Obtiene una empresa por ID.
 */
export async function getCompanyById(id: string): Promise<Company | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("companies").select("*").eq("id", id).single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}
