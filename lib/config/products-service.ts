import { dbFrom } from "@/lib/db/schema";
/**
 * Servicio de productos (SERVER ONLY - usa getSupabaseClient/next/headers).
 * Usa SOLO company_id para multiempresa. store_id se mantiene solo como legacy.
 */

import { getSupabaseClient } from "@/lib/supabase";
import type { Product, ProductType } from "@/lib/types/product";

export type { Product, ProductType } from "@/lib/types/product";

/**
 * Obtiene productos de una empresa.
 * Usa ÚNICAMENTE company_id. store_id no se usa en queries (legacy).
 */
export async function getProductsForCompany(companyId: string): Promise<Product[]> {
  const supabase = await getSupabaseClient();
  const { data } = await dbFrom(supabase, "products")
    .select("*")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("name");
  return data ?? [];
}

/**
 * Crea un producto para una empresa.
 * product_type servicios → track_stock=false por defecto.
 * Lanza el error de Supabase en caso de fallo (para propagar mensaje real).
 */
export async function createProduct(companyId: string, input: Record<string, unknown>): Promise<Product> {
  const supabase = await getSupabaseClient();
  const productType = (input.product_type as ProductType) ?? "ecommerce";
  const row: Record<string, unknown> = {
    ...input,
    company_id: companyId,
    product_type: productType,
    description: (input.description as string) || "",
    created_at: new Date().toISOString(),
  };
  if (productType === "servicios" && row.track_stock === undefined) {
    row.track_stock = false;
  }
  const { data, error } = await dbFrom(supabase, "products").insert(row as Record<string, unknown>).select().single();
  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[createProduct] Supabase error:", JSON.stringify({ message: error.message, code: error.code, details: error.details }));
    }
    throw error;
  }
  return data;
}

/**
 * Actualiza un producto.
 */
export async function updateProduct(id: string, input: Record<string, unknown>): Promise<Product | null> {
  const supabase = await getSupabaseClient();
  const { data, error } = await dbFrom(supabase, "products")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    if (process.env.NODE_ENV === "development") console.error("[updateProduct]:", error);
    throw error;
  }
  return data;
}

/**
 * Baja lógica: no borra la fila (pedidos / FKs siguen válidos).
 */
export async function softDeleteProduct(
  productId: string,
  companyId: string
): Promise<void> {
  const supabase = await getSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await dbFrom(supabase, "products")
    .update({
      deleted_at: now,
      is_active: false,
      updated_at: now,
    })
    .eq("id", productId)
    .eq("company_id", companyId);
  if (error) throw error;
}
