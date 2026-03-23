/**
 * Mapeo de errores de Supabase a mensajes útiles en español.
 */

export interface SupabaseError {
  message?: string;
  code?: string;
  details?: string;
}

/** Traduce errores de Supabase a mensajes claros en español */
export function translateSupabaseError(err: unknown): string {
  const e = err as SupabaseError;
  const msg = e?.message ?? "";
  const code = e?.code ?? "";

  if (code === "23503") {
    if (msg.includes("company_id")) return "La empresa no existe o no tienes acceso.";
    if (msg.includes("category_id")) return "La categoría seleccionada no es válida.";
    return "Referencia inválida. Verifica los datos.";
  }
  if (code === "23502") {
    if (msg.includes("description")) return "La descripción es obligatoria.";
    if (msg.includes("company_id")) return "Falta asociar el producto a una empresa.";
    if (msg.includes("name")) return "El nombre es obligatorio.";
    return "Falta completar un campo obligatorio.";
  }
  if (code === "23505") return "Ya existe un registro con esos datos (duplicado).";
  if (code === "23514") return "El valor no cumple con las restricciones de la base de datos.";
  if (code === "42501") return "No tienes permisos para realizar esta acción.";
  if (code === "PGRST301" || msg.includes("Row level security")) {
    return "No tienes permisos para crear productos en esta empresa.";
  }
  if (msg.includes("JWT") || msg.includes("session")) {
    return "Sesión expirada o inválida. Inicia sesión de nuevo.";
  }
  if (msg.includes("connection") || msg.includes("network")) {
    return "Error de conexión. Intenta de nuevo.";
  }

  return msg || "Error al guardar. Intenta de nuevo.";
}
