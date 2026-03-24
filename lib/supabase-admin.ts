/**
 * Cliente Supabase con Service Role Key.
 * SOLO usar en Server Actions / API Routes para operaciones administrativas.
 * Permite crear usuarios, bypass RLS, etc.
 *
 * Requiere SUPABASE_SERVICE_ROLE_KEY (solo servidor; no exponer al cliente).
 */
import { createClient } from "@supabase/supabase-js";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. " +
        "Configúralas en .env.local / variables del host (claves API de tu instancia Supabase)."
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
