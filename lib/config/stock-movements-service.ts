/**
 * Servicio de movimientos de stock.
 * Registra stock_inicial, entrada, salida, ajuste, devolucion.
 * Mantiene products.stock como valor actual.
 */

import { getSupabaseClient } from "@/lib/supabase";
import { productTypeUsesStock } from "@/lib/types/product";
import {
  STOCK_MOVEMENT_TYPE_LABELS,
  type StockMovementType,
} from "@/lib/constants/stock-movements";

export type { StockMovementType } from "@/lib/constants/stock-movements";
export { STOCK_MOVEMENT_TYPE_LABELS };

/** Origen del movimiento: manual, stock_inicial, venta, devolucion, ajuste_admin */
export type StockMovementOrigin =
  | "manual"
  | "stock_inicial"
  | "venta"
  | "devolucion"
  | "ajuste_admin";

/** Coincide con stock_movements en Supabase */
export interface StockMovement {
  id: string;
  product_id: string;
  company_id: string;
  movement_type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  notes: string | null;
  reference_type: string | null;
  reference_id: string | null;
  origin: StockMovementOrigin | null;
  created_at: string;
  created_by: string | null;
}

export interface RecordStockMovementParams {
  productId: string;
  companyId: string;
  movementType: StockMovementType;
  quantity: number;
  reason?: string | null;
  notes?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdBy?: string | null;
  /** Origen: manual, stock_inicial, venta, devolucion, ajuste_admin */
  origin?: StockMovementOrigin | null;
  /** Para stock_inicial: no actualiza products.stock (ya fue establecido al crear) */
  skipProductUpdate?: boolean;
}

/**
 * Registra un movimiento de stock y actualiza products.stock (salvo stock_inicial).
 * Valida allow_backorder en salidas.
 */
export async function recordStockMovement(
  params: RecordStockMovementParams
): Promise<{ ok: boolean; error?: string; movement?: StockMovement }> {
  const {
    productId,
    companyId,
    movementType,
    quantity,
    reason = null,
    notes = null,
    referenceType = null,
    referenceId = null,
    createdBy = null,
    origin = "manual",
    skipProductUpdate = false,
  } = params;

  const supabase = await getSupabaseClient();
  const qty = Math.round(quantity);

  const { data: product } = await supabase
    .from("products")
    .select("stock, track_stock, product_type, allow_backorder, company_id")
    .eq("id", productId)
    .single();

  if (!product) {
    return { ok: false, error: "Producto no encontrado" };
  }
  if (product.company_id !== companyId) {
    return { ok: false, error: "El producto no pertenece a la empresa indicada" };
  }
  if (
    !productTypeUsesStock(product.product_type ?? "ecommerce", product.track_stock)
  ) {
    return { ok: false, error: "Este producto no controla stock" };
  }

  const stockBefore = product.stock ?? 0;
  let quantityDelta: number;
  let absQuantity: number;

  if (movementType === "stock_inicial") {
    if (qty < 0) {
      return { ok: false, error: "El stock inicial no puede ser negativo" };
    }
    if (skipProductUpdate) {
      quantityDelta = qty;
      absQuantity = qty;
    } else {
      quantityDelta = qty - stockBefore;
      absQuantity = Math.abs(quantityDelta);
    }
  } else if (movementType === "entrada" || movementType === "devolucion") {
    if (qty <= 0) {
      return { ok: false, error: "La cantidad debe ser positiva" };
    }
    quantityDelta = qty;
    absQuantity = qty;
  } else if (movementType === "salida") {
    if (qty <= 0) {
      return { ok: false, error: "La cantidad debe ser positiva" };
    }
    const newStock = stockBefore - qty;
    if (
      newStock < 0 &&
      !(product.allow_backorder === true || product.allow_backorder === "true")
    ) {
      return {
        ok: false,
        error: `Stock insuficiente. Actual: ${stockBefore}, solicitado: ${qty}. Permite backorder para realizar la salida.`,
      };
    }
    quantityDelta = -qty;
    absQuantity = qty;
  } else {
    if (qty === 0) {
      return { ok: false, error: "Cantidad inválida" };
    }
    quantityDelta = qty;
    absQuantity = Math.abs(qty);
  }

  const stockAfter = Math.max(
    0,
    movementType === "stock_inicial" && skipProductUpdate ? qty : stockBefore + quantityDelta
  );

  const prevStock =
    movementType === "stock_inicial" && skipProductUpdate ? 0 : stockBefore;
  const insertPayload: Record<string, unknown> = {
    product_id: productId,
    company_id: companyId,
    movement_type: movementType,
    quantity: absQuantity,
    previous_stock: prevStock,
    new_stock: stockAfter,
    reason: reason || null,
    notes: notes || null,
    reference_type: referenceType || null,
    reference_id: referenceId || null,
    created_by: createdBy || null,
    origin: origin || null,
  };

  const { data: movement, error: movError } = await supabase
    .from("stock_movements")
    .insert(insertPayload)
    .select()
    .single();

  if (movError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[recordStockMovement]:", movError);
    }
    return { ok: false, error: movError.message };
  }

  if (!skipProductUpdate) {
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock: stockAfter, updated_at: new Date().toISOString() })
      .eq("id", productId);

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[recordStockMovement] update:", updateError);
      }
      return { ok: false, error: updateError.message, movement };
    }
  }

  return { ok: true, movement };
}

/**
 * Registra una salida de stock por venta.
 * Uso desde módulo de ventas: descontar stock al confirmar una venta.
 */
export async function recordStockSalidaPorVenta(
  productId: string,
  companyId: string,
  quantity: number,
  ventaId: string,
  createdBy?: string | null,
  reason?: string | null
): Promise<{ ok: boolean; error?: string; movement?: StockMovement }> {
  return recordStockMovement({
    productId,
    companyId,
    movementType: "salida",
    quantity,
    reason: reason ?? "Venta",
    referenceType: "venta",
    referenceId: ventaId,
    createdBy,
    origin: "venta",
  });
}

/**
 * Revierte stock por cancelación de venta.
 * Uso cuando se cancela un pedido ya confirmado.
 */
export async function recordStockDevolucionPorCancelacion(
  productId: string,
  companyId: string,
  quantity: number,
  orderId: string,
  createdBy?: string | null,
  reason?: string | null
): Promise<{ ok: boolean; error?: string; movement?: StockMovement }> {
  return recordStockMovement({
    productId,
    companyId,
    movementType: "devolucion",
    quantity,
    reason: reason ?? "Venta cancelada",
    referenceType: "venta_cancelada",
    referenceId: orderId,
    createdBy,
    origin: "devolucion",
  });
}

/**
 * Registra stock inicial tras crear un producto.
 * No actualiza products.stock (ya fue establecido en el create).
 */
export async function recordStockInicial(
  productId: string,
  companyId: string,
  initialStock: number,
  createdBy?: string | null
): Promise<{ ok: boolean; error?: string }> {
  if (initialStock <= 0) return { ok: true };
  const result = await recordStockMovement({
    productId,
    companyId,
    movementType: "stock_inicial",
    quantity: initialStock,
    reason: "Stock inicial al crear producto",
    createdBy,
    origin: "stock_inicial",
    skipProductUpdate: true,
  });
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

/** Movimiento enriquecido con datos del creador (para UI) */
export interface StockMovementWithCreator extends StockMovement {
  created_by_email?: string | null;
  created_by_name?: string | null;
}

/**
 * Obtiene movimientos de un producto.
 * Si productCompanyId se pasa, valida que el producto pertenezca a esa empresa.
 */
export async function getStockMovements(
  productId: string,
  limit = 50,
  productCompanyId?: string
): Promise<StockMovement[]> {
  const supabase = await getSupabaseClient();
  let query = supabase
    .from("stock_movements")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (productCompanyId) {
    query = query.eq("company_id", productCompanyId);
  }
  const { data } = await query;
  return (data ?? []) as StockMovement[];
}

/**
 * Obtiene movimientos con datos del creador (email/nombre desde profiles).
 */
export async function getStockMovementsWithCreators(
  productId: string,
  limit = 50,
  productCompanyId?: string
): Promise<StockMovementWithCreator[]> {
  const movements = await getStockMovements(productId, limit, productCompanyId);
  const creatorIds = [...new Set(movements.map((m) => m.created_by).filter(Boolean))] as string[];
  if (creatorIds.length === 0) {
    return movements.map((m) => ({ ...m, created_by_email: null, created_by_name: null }));
  }
  const supabase = await getSupabaseClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", creatorIds);
  const creatorMap = new Map(
    (profiles ?? []).map((p) => [p.id, { email: p.email ?? null, full_name: p.full_name ?? null }])
  );
  return movements.map((m) => ({
    ...m,
    created_by_email: m.created_by ? creatorMap.get(m.created_by)?.email ?? null : null,
    created_by_name: m.created_by ? creatorMap.get(m.created_by)?.full_name ?? null : null,
  }));
}

/**
 * Obtiene el último movimiento de un producto.
 */
export async function getLastStockMovement(
  productId: string
): Promise<StockMovement | null> {
  const movements = await getStockMovements(productId, 1);
  return movements[0] ?? null;
}

/**
 * Obtiene movimientos de una empresa.
 */
export async function getStockMovementsByCompany(
  companyId: string,
  limit = 100
): Promise<StockMovement[]> {
  const supabase = await getSupabaseClient();
  const { data } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as StockMovement[];
}
