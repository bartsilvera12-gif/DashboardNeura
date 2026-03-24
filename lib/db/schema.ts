/**
 * Schema activo para datos de negocio y perfiles (incluye `profiles`).
 * Todo el acceso tabular de la app usa `ACTIVE_BUSINESS_SCHEMA` (por defecto `tradexpar`).
 * No se usa el schema `public` para tablas de aplicación.
 *
 * Configuración: NEXT_PUBLIC_BUSINESS_SCHEMA (por defecto `tradexpar`).
 * En Supabase: Settings → API → Exposed schemas debe incluir el schema de negocio.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const ACTIVE_BUSINESS_SCHEMA =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BUSINESS_SCHEMA) || "tradexpar";

/** Alias para configuración por schema activo (mismo valor que ACTIVE_BUSINESS_SCHEMA). */
export const ACTIVE_DB_SCHEMA = ACTIVE_BUSINESS_SCHEMA;

/**
 * Acceso unificado: todas las tablas (incluido `profiles`) en el schema de negocio.
 */
export function dbFrom(client: SupabaseClient, table: string) {
  return client.schema(ACTIVE_BUSINESS_SCHEMA).from(table);
}
