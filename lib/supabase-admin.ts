/**
 * Cliente Supabase con Service Role Key.
 * SOLO usar en Server Actions / API Routes para operaciones administrativas.
 * Permite crear usuarios, bypass RLS, etc.
 *
 * Requiere SUPABASE_SERVICE_ROLE_KEY (solo servidor; no exponer al cliente).
 */
import { createClient } from "@supabase/supabase-js";
import { getServiceRoleEnv } from "@/lib/env/supabase";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  const { url, serviceRoleKey } = getServiceRoleEnv();

  if (!adminClient) {
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
