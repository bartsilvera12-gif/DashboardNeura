/**
 * Cliente Supabase para servidor (con sesión de cookies).
 * Usar en Server Components, Server Actions y Route Handlers.
 */
import { createServerSupabaseClient } from "./supabase/server";

export async function getSupabaseClient() {
  return createServerSupabaseClient();
}
