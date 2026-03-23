/**
 * Cliente Supabase con Service Role Key.
 * SOLO usar en Server Actions / API Routes para operaciones administrativas.
 * Permite crear usuarios, bypass RLS, etc.
 *
 * Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local
 */
import { createClient } from "@supabase/supabase-js";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. " +
        "Añade SUPABASE_SERVICE_ROLE_KEY a .env.local (Supabase Dashboard > Settings > API)"
    );
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
