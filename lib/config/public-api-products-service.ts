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
  /** Primera imagen; mismo valor que `images[0]` si existe. */
  image: string | null;
  /** Todas las URLs de galería (puede estar vacío). */
  images: string[];
  sku: string | null;
  description: string | null;
  category: string | null;
}

function parseImagesColumn(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  if (raw && typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>)
      .map((x) => String(x).trim())
      .filter(Boolean);
  }
  return [];
}

export async function getPublicProducts(
  companyId: string,
  limit = 500
): Promise<PublicProduct[]> {
  const supabase = getSupabaseAdminClient();

  const { data } = await dbFrom(supabase, "products")
    .select("id, name, price, stock, image, images, sku, description, category")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("name")
    .limit(limit);

  const rows = (data ?? []) as Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    image: string | null;
    images: unknown;
    sku: string;
    description: string;
    category: string;
  }>;
  return rows.map((p) => {
    let imgs = parseImagesColumn(p.images);
    if (imgs.length === 0 && p.image != null && String(p.image).trim() !== "") {
      imgs = [String(p.image).trim()];
    }
    const first = imgs[0] ?? (p.image != null ? String(p.image).trim() : null);
    return {
      id: p.id,
      name: p.name,
      price: p.price != null ? Number(p.price) : null,
      stock: p.stock != null ? Number(p.stock) : null,
      image: first,
      images: imgs,
      sku: p.sku,
      description: p.description ?? null,
      category: p.category,
    };
  });
}
