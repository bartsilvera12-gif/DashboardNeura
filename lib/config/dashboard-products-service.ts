/**
 * Servicio de métricas de productos para el Dashboard.
 * Todas las métricas dependen de company_product_column_config (affects_dashboard).
 * product_type servicios no cuenta en métricas de stock.
 */

import { getProductsForCompany } from "./products-service";
import { productTypeUsesStock } from "@/lib/types/product";
import { getCompanyProductColumnConfig } from "./product-column-config";
import type { Product } from "./products-service";

export interface DashboardProductStats {
  total: number;
  activos: number;
  sinStock: number;
  stockBajo: number;
  destacados: number;
  valorInventario: number | null;
  categoriasTop: Array<{ categoria: string; count: number }>;
}

export async function getDashboardProductStats(
  companyId: string | null
): Promise<DashboardProductStats> {
  if (!companyId) {
    return {
      total: 0,
      activos: 0,
      sinStock: 0,
      stockBajo: 0,
      destacados: 0,
      valorInventario: null,
      categoriasTop: [],
    };
  }

  const [products, config] = await Promise.all([
    getProductsForCompany(companyId),
    getCompanyProductColumnConfig(companyId),
  ]);

  const hasStock = config.some((c) => c.key === "stock" && c.affects_dashboard);
  const hasCostPrice = config.some((c) => c.key === "cost_price" && c.affects_dashboard);
  const hasFeatured = config.some((c) => c.key === "featured" && c.affects_dashboard);
  const hasCategory = config.some((c) => c.key === "category" && c.affects_dashboard);
  const hasMinStock = config.some((c) => c.key === "min_stock" && c.affects_dashboard);

  let sinStock = 0;
  let stockBajo = 0;
  let valorInventario: number | null = null;
  const catCount = new Map<string, number>();

  for (const p of products) {
    const usesStock = productTypeUsesStock(p.product_type ?? "ecommerce", p.track_stock);
    const stock = p.stock ?? 0;
    const minStock = p.min_stock ?? 0;

    if (hasStock && usesStock && stock <= 0) sinStock++;
    if (hasMinStock && hasStock && usesStock && minStock > 0 && stock <= minStock) stockBajo++;

    if (hasCostPrice && usesStock && p.cost_price != null && stock > 0) {
      valorInventario = (valorInventario ?? 0) + Number(p.cost_price) * stock;
    }

    if (hasCategory && p.category) {
      const cat = String(p.category).trim();
      if (cat) catCount.set(cat, (catCount.get(cat) ?? 0) + 1);
    }
  }

  const isActive = (p: Product) => (p.is_active ?? true) && (p.deleted_at == null);
  const activos = products.filter(isActive).length;
  const destacados = hasFeatured ? products.filter((p) => p.featured === true).length : 0;

  const categoriasTop = Array.from(catCount.entries())
    .map(([categoria, count]) => ({ categoria, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total: products.length,
    activos,
    sinStock,
    stockBajo,
    destacados,
    valorInventario,
    categoriasTop,
  };
}
