/**
 * Alta / edición / baja de productos vía API pública (admin client + API key).
 * Para frontends externos (ej. Lovable) que no usan sesión Neura.
 */

import { dbFrom } from "@/lib/db/schema";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { ProductType } from "@/lib/types/product";

const MUTABLE_KEYS = [
  "name",
  "description",
  "price",
  "cost_price",
  "sku",
  "barcode",
  "category",
  "brand",
  "stock",
  "min_stock",
  "max_stock",
  "reorder_point",
  "track_stock",
  "allow_backorder",
  "product_type",
  "status",
  "featured",
  "unit_type",
  "is_active",
] as const;

function toNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toBool(v: unknown): boolean | undefined {
  if (v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "1" || v === 1) return true;
  if (v === "false" || v === "0" || v === 0) return false;
  return undefined;
}

function applyImages(
  row: Record<string, unknown>,
  raw: Record<string, unknown>
): void {
  if (Array.isArray(raw.images)) {
    const urls = raw.images.map((x) => String(x).trim()).filter(Boolean);
    row.images = urls;
    row.image = urls[0] ?? null;
    return;
  }
  if (raw.image !== undefined) {
    const s = String(raw.image ?? "").trim();
    if (s) {
      row.image = s;
      row.images = [s];
    } else {
      row.image = null;
      row.images = [];
    }
  }
}

function pickFields(
  raw: Record<string, unknown>,
  options: { partial: boolean }
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of MUTABLE_KEYS) {
    if (raw[k] === undefined) continue;
    if (!options.partial && k === "name") continue; // name handled separately for create
    if (
      k === "price" ||
      k === "cost_price" ||
      k === "stock" ||
      k === "min_stock" ||
      k === "max_stock" ||
      k === "reorder_point"
    ) {
      const n = toNum(raw[k]);
      if (n !== null || raw[k] === null) out[k] = n;
    } else if (k === "featured" || k === "track_stock" || k === "allow_backorder" || k === "is_active") {
      const b = toBool(raw[k]);
      if (b !== undefined) out[k] = b;
    } else {
      const v = raw[k];
      out[k] = v === null ? null : String(v).trim() || null;
    }
  }
  applyImages(out, raw);
  return out;
}

export async function createProductPublic(
  companyId: string,
  body: Record<string, unknown>
): Promise<
  | { ok: true; product: Record<string, unknown> }
  | { ok: false; error: string; status: number }
> {
  const name = body.name;
  if (name == null || String(name).trim() === "") {
    return { ok: false, error: "name es obligatorio", status: 400 };
  }

  const productType = (body.product_type as ProductType) ?? "ecommerce";
  const picked = pickFields(body, { partial: true });
  picked.name = String(name).trim();

  const row: Record<string, unknown> = {
    ...picked,
    company_id: companyId,
    product_type: productType,
    description: String(picked.description ?? body.description ?? ""),
    created_at: new Date().toISOString(),
  };

  if (productType === "servicios" && row.track_stock === undefined) {
    row.track_stock = false;
  }

  if (!row.images && body.images === undefined && body.image === undefined) {
    row.images = [];
    row.image = null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await dbFrom(supabase, "products")
    .insert(row as Record<string, unknown>)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message || "Error al crear", status: 400 };
  }
  return { ok: true, product: data as Record<string, unknown> };
}

export async function updateProductPublic(
  companyId: string,
  productId: string,
  body: Record<string, unknown>
): Promise<
  | { ok: true; product: Record<string, unknown> }
  | { ok: false; error: string; status: number }
> {
  const supabase = getSupabaseAdminClient();

  const { data: existing, error: fetchErr } = await dbFrom(supabase, "products")
    .select("id")
    .eq("id", productId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchErr || !existing) {
    return { ok: false, error: "Producto no encontrado", status: 404 };
  }

  const picked = pickFields(body, { partial: true });
  if (body.name !== undefined) {
    const n = String(body.name ?? "").trim();
    if (!n) return { ok: false, error: "name no puede estar vacío", status: 400 };
    picked.name = n;
  }

  const productType = body.product_type as ProductType | undefined;
  if (productType !== undefined) {
    picked.product_type = productType;
  }

  if (Object.keys(picked).length === 0) {
    return { ok: false, error: "Sin campos para actualizar", status: 400 };
  }

  picked.updated_at = new Date().toISOString();

  const { data, error } = await dbFrom(supabase, "products")
    .update(picked as Record<string, unknown>)
    .eq("id", productId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message || "Error al actualizar", status: 400 };
  }
  return { ok: true, product: data as Record<string, unknown> };
}

export async function deleteProductPublic(
  companyId: string,
  productId: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await dbFrom(supabase, "products")
    .update({
      deleted_at: now,
      is_active: false,
      updated_at: now,
    })
    .eq("id", productId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message || "Error al eliminar", status: 400 };
  }
  if (!data) {
    return { ok: false, error: "Producto no encontrado", status: 404 };
  }
  return { ok: true };
}
