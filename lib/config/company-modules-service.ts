/**
 * Servicio para configurar módulos y secciones por empresa.
 * Usado por el Super Admin en el panel de configuración de empresas.
 */

import { getSupabaseClient } from "@/lib/supabase";
import type { Module, ModuleSection } from "@/lib/types/database";

export interface CompanyModuleConfig {
  module_id: string;
  is_enabled: boolean;
  sort_order: number;
}

export interface CompanyModuleSectionConfig {
  module_section_id: string;
  is_enabled: boolean;
  sort_order: number;
}

/**
 * Obtiene todos los módulos del sistema.
 */
export async function getAllModules(): Promise<Module[]> {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from("modules").select("*").eq("is_active", true).order("sort_order");
    return data ?? [];
  } catch {
    return [];
  }
}

/**
 * Obtiene las secciones de un módulo.
 */
export async function getModuleSections(moduleId: string): Promise<ModuleSection[]> {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("module_sections")
      .select("*")
      .eq("module_id", moduleId)
      .order("sort_order");
    return data ?? [];
  } catch {
    return [];
  }
}

/**
 * Configura los módulos visibles para una empresa.
 * Reemplaza la configuración existente.
 */
export async function setCompanyModules(
  companyId: string,
  configs: CompanyModuleConfig[]
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    await supabase.from("company_modules").delete().eq("company_id", companyId);

    if (configs.length > 0) {
      const rows = configs.map((c) => ({
        company_id: companyId,
        module_id: c.module_id,
        is_enabled: c.is_enabled,
        sort_order: c.sort_order,
      }));
      const { error } = await supabase.from("company_modules").insert(rows);
      if (error) {
        console.error("setCompanyModules error:", error);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.error("setCompanyModules:", e);
    return false;
  }
}

/**
 * Configura las secciones visibles para una empresa.
 */
export async function setCompanyModuleSections(
  companyId: string,
  configs: CompanyModuleSectionConfig[]
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    await supabase.from("company_module_sections").delete().eq("company_id", companyId);

    if (configs.length > 0) {
      const rows = configs.map((c) => ({
        company_id: companyId,
        module_section_id: c.module_section_id,
        is_enabled: c.is_enabled,
        sort_order: c.sort_order,
      }));
      const { error } = await supabase.from("company_module_sections").insert(rows);
      if (error) {
        console.error("setCompanyModuleSections error:", error);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.error("setCompanyModuleSections:", e);
    return false;
  }
}
