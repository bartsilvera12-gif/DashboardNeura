import { dbFrom } from "@/lib/db/schema";
/**
 * Productos para la API pública.
 * Solo productos activos y visibles.
 */

import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export interface PublicProduct {
  id: string;
  name: string | null;
  price: number | null;
  stock: number | null;
  image: string | null;
  sku: string | null;
  description: string | null;
  category: string | null;
}

export async function getPublicProducts(
  companyId: string,
  limit = 500
): Promise<PublicProduct[]> {
  const supabase = getSupabaseAdminClient();

  const { data } = await dbFrom(supabase, "products")
    .select("id, name, price, stock, image, sku, description, category")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("name")
    .limit(limit);

  const rows = (data ?? []) as Array<{ id: string; name: string; price: number; stock: number; image: string; sku: string; description: string; category: string }>;
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price != null ? Number(p.price) : null,
    stock: p.stock != null ? Number(p.stock) : null,
    image: p.image,
    sku: p.sku,
    description: p.description ?? null,
    category: p.category,
  }));
}
