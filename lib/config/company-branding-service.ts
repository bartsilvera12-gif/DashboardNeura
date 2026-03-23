/**
 * Servicio para configurar branding por empresa.
 */

import { getSupabaseClient } from "@/lib/supabase";
import type { CompanyBranding } from "@/lib/types/database";

export interface CompanyBrandingInput {
  display_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
}

/**
 * Crea o actualiza el branding de una empresa.
 */
export async function upsertCompanyBranding(
  companyId: string,
  input: CompanyBrandingInput
): Promise<CompanyBranding | null> {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("company_branding")
      .upsert(
        {
          company_id: companyId,
          display_name: input.display_name ?? null,
          logo_url: input.logo_url ?? null,
          primary_color: input.primary_color ?? null,
        },
        { onConflict: "company_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("upsertCompanyBranding error:", error);
      return null;
    }
    return data;
  } catch (e) {
    console.error("upsertCompanyBranding:", e);
    return null;
  }
}
