/**
 * Elimina un usuario de Auth (rollback).
 * Solo usar cuando el onboarding falla después de crear el usuario.
 */

import { getSupabaseAdminClient } from "@/lib/supabase-admin";

/**
 * Elimina un usuario de Supabase Auth.
 * Usar para limpiar usuarios huérfanos cuando falla el onboarding.
 */
export async function deleteAuthUser(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error("deleteAuthUser error:", error);
      return { ok: false, error: error?.message ?? "Error al eliminar usuario" };
    }
    return { ok: true };
  } catch (e) {
    console.error("deleteAuthUser:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al eliminar usuario",
    };
  }
}
