/**
 * Cliente Supabase - reexporta desde server para compatibilidad.
 * @deprecated Usar createServerSupabaseClient desde lib/supabase/server
 */
import { createServerSupabaseClient } from "./supabase/server";

export function getSupabaseClient() {
  return createServerSupabaseClient();
}
