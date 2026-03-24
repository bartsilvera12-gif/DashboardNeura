/**
 * Estados calculados de stock para badges y reportes.
 * Considera track_stock, stock, min_stock, reorder_point, max_stock.
 */

import type { Product } from "@/lib/types/product";
import { productTypeUsesStock } from "@/lib/types/product";

export type StockStatus =
  | "sin_control"
  | "sin_stock"
  | "bajo_stock"
  | "en_punto_pedido"
  | "stock_normal"
  | "sobrestock";

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  sin_control: "Sin control",
  sin_stock: "Sin stock",
  bajo_stock: "Bajo stock",
  en_punto_pedido: "En punto de pedido",
  stock_normal: "Stock normal",
  sobrestock: "Sobrestock",
};

export const STOCK_STATUS_STYLES: Record<
  StockStatus,
  { bg: string; text: string }
> = {
  sin_control: { bg: "bg-zinc-100", text: "text-zinc-500" },
  sin_stock: { bg: "bg-red-100", text: "text-red-800" },
  bajo_stock: { bg: "bg-amber-100", text: "text-amber-800" },
  en_punto_pedido: { bg: "bg-amber-50", text: "text-amber-700" },
  stock_normal: { bg: "bg-emerald-50", text: "text-emerald-700" },
  sobrestock: { bg: "bg-sky-50", text: "text-sky-700" },
};

/** Píldoras para tablas oscuras (reporte SaaS). */
export const STOCK_STATUS_STYLES_DARK: Record<StockStatus, string> = {
  sin_control: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/25",
  sin_stock: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
  bajo_stock: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
  en_punto_pedido: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/20",
  stock_normal: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
  sobrestock: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25",
};

/**
 * Calcula el estado de stock de un producto.
 */
export function getStockStatus(p: Product): StockStatus {
  const usesStock = productTypeUsesStock(
    p.product_type ?? "ecommerce",
    p.track_stock
  );
  if (!usesStock) return "sin_control";

  const stock = p.stock ?? 0;
  const minStock = p.min_stock ?? 0;
  const reorderPoint = p.reorder_point ?? 0;
  const maxStock = p.max_stock ?? null;

  if (stock <= 0) return "sin_stock";

  // Bajo stock (más crítico): stock <= min_stock
  if (minStock > 0 && stock <= minStock) return "bajo_stock";

  // En punto de pedido: min < stock <= reorder_point
  if (reorderPoint > 0 && stock <= reorderPoint) return "en_punto_pedido";

  // Sobrestock: stock > max_stock (si max_stock está definido)
  if (maxStock != null && maxStock > 0 && stock > maxStock) return "sobrestock";

  return "stock_normal";
}
