import { dbFrom } from "@/lib/db/schema";
/**
 * Categorías por empresa. Server-only.
 */

import { getSupabaseClient } from "@/lib/supabase";

export interface CompanyCategory {
  id: string;
  company_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export async function getCompanyCategories(companyId: string): Promise<CompanyCategory[]> {
  const supabase = await getSupabaseClient();
  const { data } = await dbFrom(supabase, "company_categories")
    .select("*")
    .eq("company_id", companyId)
    .order("sort_order")
    .order("name");
  return data ?? [];
}

export async function createCompanyCategory(companyId: string, name: string): Promise<CompanyCategory | null> {
  const supabase = await getSupabaseClient();
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data, error } = await dbFrom(supabase, "company_categories")
    .insert({ company_id: companyId, name: trimmed })
    .select()
    .single();
  if (error) throw error;
  return data;
}
