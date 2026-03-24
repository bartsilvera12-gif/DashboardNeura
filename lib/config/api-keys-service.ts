/**
 * Servicio de API Keys para la API pública.
 * - validateApiKey, createApiKey: usan admin client (API routes / creación).
 * - listApiKeys, toggleApiKey, deleteApiKey: usan getSupabaseClient (RLS, solo super admin).
 */

import { createHash, randomBytes } from "crypto";
import { dbFrom } from "@/lib/db/schema";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getSupabaseClient } from "@/lib/supabase";

export interface ApiKeyRow {
  id: string;
  company_id: string;
  key_prefix: string;
  name: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  company_name?: string;
}

const KEY_PREFIX = "neura_";
const KEY_PREFIX_LENGTH = 8;
const HASH_ALGORITHM = "sha256";

function hashKey(key: string): string {
  return createHash(HASH_ALGORITHM).update(key).digest("hex");
}

function getKeyPrefix(key: string): string {
  return key.slice(0, KEY_PREFIX_LENGTH);
}

/**
 * Valida API key y devuelve company_id si es válida.
 */
export async function validateApiKey(
  apiKey: string | null
): Promise<{ ok: true; companyId: string } | { ok: false; error: string }> {
  if (!apiKey || typeof apiKey !== "string") {
    return { ok: false, error: "API key requerida" };
  }

  const trimmed = apiKey.trim();
  if (!trimmed.startsWith(KEY_PREFIX) || trimmed.length < 20) {
    return { ok: false, error: "API key inválida" };
  }

  const keyHash = hashKey(trimmed);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await dbFrom(supabase, "api_keys")
    .select("company_id, is_active")
    .eq("key_hash", keyHash)
    .maybeSingle();

  const row = data as { company_id: string; is_active: boolean } | null;
  if (error || !row) {
    return { ok: false, error: "API key inválida o no encontrada" };
  }

  if (row.is_active !== true) {
    return { ok: false, error: "API key desactivada" };
  }

  // Actualizar last_used_at (fire and forget).
  dbFrom(supabase, "api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_hash", keyHash)
    .then(() => {});

  return { ok: true, companyId: row.company_id };
}

/**
 * Genera una nueva API key para una empresa.
 * IMPORTANTE: La clave plana solo se devuelve una vez.
 */
export async function createApiKey(
  companyId: string,
  name?: string | null
): Promise<
  | { ok: true; key: string; prefix: string }
  | { ok: false; error: string }
> {
  const rawKey =
    KEY_PREFIX + randomBytes(24).toString("base64url");
  const keyHash = hashKey(rawKey);
  const keyPrefix = getKeyPrefix(rawKey);

  const supabase = getSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await dbFrom(supabase as any, "api_keys").insert({
    company_id: companyId,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name: name ?? null,
    is_active: true,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[createApiKey]:", error);
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, key: rawKey, prefix: keyPrefix };
}

/**
 * Lista API keys con nombre de empresa (para super admin).
 * RLS filtra por usuario_tiene_acceso_empresa; super admin ve todas.
 */
export async function listApiKeys(): Promise<ApiKeyRow[]> {
  const supabase = await getSupabaseClient();

  const { data: keys, error } = await dbFrom(supabase as any, "api_keys")
    .select("id, company_id, key_prefix, name, is_active, last_used_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[listApiKeys]:", error);
    }
    return [];
  }

  const rows = (keys ?? []) as Array<{
    id: string;
    company_id: string;
    key_prefix: string;
    name: string | null;
    is_active: boolean;
    last_used_at: string | null;
    created_at: string;
  }>;

  if (rows.length === 0) return [];

  const companyIds = [...new Set(rows.map((r) => r.company_id))];
  const { data: companies } = await dbFrom(supabase, "companies")
    .select("id, name")
    .in("id", companyIds);
  const companyMap = new Map((companies ?? []).map((c) => [c.id, c.name]));

  return rows.map((row) => ({
    ...row,
    company_name: companyMap.get(row.company_id),
  }));
}

/**
 * Activa o desactiva una API key. RLS aplica.
 */
export async function toggleApiKey(
  id: string,
  isActive: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await getSupabaseClient();

  const { error } = await dbFrom(supabase as any, "api_keys")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Elimina (revoca) una API key. RLS aplica.
 */
export async function deleteApiKey(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await getSupabaseClient();

  const { error } = await dbFrom(supabase as any, "api_keys").delete().eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
