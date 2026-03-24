/**
 * Cliente Supabase para Server Components, Server Actions y Route Handlers.
 * Usa cookies para leer/escribir la sesión del usuario.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "@/lib/env/supabase";

export async function createServerSupabaseClient() {
  const { url, anonKey } = getPublicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignorar si se llama desde Server Component (no puede escribir cookies)
        }
      },
    },
  });
}
