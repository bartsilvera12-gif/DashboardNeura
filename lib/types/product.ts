/**
 * Tipos y utilidades de producto para uso en cliente y servidor.
 * NO importar Supabase ni next/headers aquí.
 */

export type ProductType = "ecommerce" | "servicios" | "inmobiliaria";

export interface Product {
  id: string;
  company_id: string | null;
  store_id: string | null;
  product_type: ProductType | null;
  name: string | null;
  description: string;
  price: number | null;
  cost_price: number | null;
  image: string | null;
  /** URLs de galería (JSON en BD). La primera suele coincidir con `image`. */
  images?: string[] | null;
  category: string | null;
  stock: number | null;
  sku: string | null;
  status: string | null;
  barcode: string | null;
  brand: string | null;
  min_stock: number | null;
  max_stock: number | null;
  reorder_point: number | null;
  track_stock: boolean | null;
  featured: boolean | null;
  is_active: boolean | null;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  [key: string]: unknown;
}

const PRODUCT_TYPES_WITH_STOCK: ProductType[] = ["ecommerce"];

/** Indica si el tipo de producto usa control de stock */
export function productTypeUsesStock(
  productType: ProductType | null,
  trackStock: boolean | null
): boolean {
  const type = productType ?? "ecommerce";
  if (!PRODUCT_TYPES_WITH_STOCK.includes(type)) return false;
  return trackStock ?? true;
}
