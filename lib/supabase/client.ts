/**
 * Cliente Supabase para Client Components (navegador).
 * Usa cookies automáticamente para la sesión.
 */

import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/env/supabase";

export function createBrowserSupabaseClient() {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
