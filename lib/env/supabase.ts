/**
 * Lectura validada de variables Supabase (self-hosted).
 * Mensajes explícitos para fallos de despliegue (env faltante).
 */

export function getSupabaseProjectUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL (URL pública de la API, p. ej. https://api.neura.com.py)."
    );
  }
  return url.replace(/\/+$/, "");
}

export function getPublicSupabaseEnv(): { url: string; anonKey: string } {
  const url = getSupabaseProjectUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!anonKey) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_ANON_KEY (JWT anon de tu instancia Supabase)."
    );
  }
  return { url, anonKey };
}

/**
 * Solo servidor: service role. No importar desde Client Components.
 */
export function getServiceRoleEnv(): { url: string; serviceRoleKey: string } {
  const url = getSupabaseProjectUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY (solo variables de servidor / panel de hosting)."
    );
  }
  return { url, serviceRoleKey };
}
