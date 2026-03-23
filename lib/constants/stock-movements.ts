/**
 * Constantes y tipos de movimientos de stock.
 * Seguro para importar en Client Components (no usa Supabase).
 */

export type StockMovementType =
  | "stock_inicial"
  | "entrada"
  | "salida"
  | "ajuste"
  | "devolucion";

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  stock_inicial: "Stock inicial",
  entrada: "Entrada",
  salida: "Salida",
  ajuste: "Ajuste",
  devolucion: "Devolución",
};

export type StockMovementOrigin =
  | "manual"
  | "stock_inicial"
  | "venta"
  | "devolucion"
  | "ajuste_admin";

export const STOCK_ORIGIN_LABELS: Record<StockMovementOrigin, string> = {
  manual: "Manual",
  stock_inicial: "Stock inicial",
  venta: "Venta",
  devolucion: "Devolución",
  ajuste_admin: "Ajuste admin",
};

export interface StockMovementView {
  id: string;
  product_id: string;
  movement_type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  notes?: string | null;
  created_at: string;
  created_by?: string | null;
  created_by_email?: string | null;
  created_by_name?: string | null;
  origin?: StockMovementOrigin | null;
}
