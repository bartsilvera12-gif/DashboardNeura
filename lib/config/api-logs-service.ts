/**
 * Servicio de logs de la API pública.
 * - logApiRequest: usa admin client (desde API routes, sin sesión).
 * - listApiLogs: usa getSupabaseClient (RLS, solo super admin puede leer).
 */

import { dbFrom } from "@/lib/db/schema";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getSupabaseClient } from "@/lib/supabase";

export interface ApiLogRow {
  id: string;
  company_id: string | null;
  endpoint: string;
  method: string;
  status_code: number;
  success: boolean;
  error_message: string | null;
  created_at: string;
  company_name?: string;
}

/**
 * Registra un uso de la API (desde route handlers).
 * Falla silenciosamente si api_logs no existe: no bloquea la respuesta.
 */
export async function logApiRequest(params: {
  companyId: string | null;
  endpoint: string;
  method: string;
  statusCode: number;
  success: boolean;
  errorMessage?: string | null;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    await dbFrom(supabase as any, "api_logs").insert({
      company_id: params.companyId,
      endpoint: params.endpoint,
      method: params.method,
      status_code: params.statusCode,
      success: params.success,
      error_message: params.errorMessage ?? null,
    });
  } catch {
    // Silenciar: api_logs puede no existir si la migración no se aplicó
  }
}

/**
 * Lista logs recientes (solo super admin, RLS).
 * Falla de forma segura: si la tabla no existe o hay error, devuelve [].
 */
export async function listApiLogs(limit = 50): Promise<ApiLogRow[]> {
  try {
    const supabase = await getSupabaseClient();

    const { data: logs, error } = await dbFrom(supabase as any, "api_logs")
      .select("id, company_id, endpoint, method, status_code, success, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      // Caso esperado: api_logs puede no existir. Silencioso.
      return [];
    }

    const rows = (logs ?? []) as Array<{
      id: string;
      company_id: string | null;
      endpoint: string;
      method: string;
      status_code: number;
      success: boolean;
      error_message: string | null;
      created_at: string;
    }>;

    if (rows.length === 0) return [];

    const companyIds = [...new Set(rows.map((r) => r.company_id).filter(Boolean))] as string[];
    if (companyIds.length === 0) {
      return rows.map((row) => ({ ...row, company_name: undefined }));
    }

    const { data: companies } = await dbFrom(supabase, "companies")
      .select("id, name")
      .in("id", companyIds);
    const companyMap = new Map((companies ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));

    return rows.map((row) => ({
      ...row,
      company_name: row.company_id ? companyMap.get(row.company_id) : undefined,
    }));
  } catch {
    // Caso esperado: tabla inexistente o error de consulta. Silencioso.
    return [];
  }
}
