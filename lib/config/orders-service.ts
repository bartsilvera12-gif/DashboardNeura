/**
 * Servicio de pedidos.
 * Integración con stock via recordStockSalidaPorVenta / recordStockDevolucionPorCancelacion.
 * Solo items con inventory_source = "propio" afectan stock interno.
 */

import { getSupabaseClient } from "@/lib/supabase";
import { recordStockSalidaPorVenta, recordStockDevolucionPorCancelacion } from "@/lib/config/stock-movements-service";
import { productTypeUsesStock } from "@/lib/types/product";
import { INVENTORY_SOURCE_PROPIO } from "@/lib/constants/orders";
import type { Order, OrderItem, OrderWithItems } from "@/lib/types/order";
import type { OrderEventType } from "@/lib/constants/orders";

export type { Order, OrderItem, OrderWithItems } from "@/lib/types/order";

export interface CreateOrderInput {
  companyId: string;
  sourceChannel?: string;
  sourcePlatform?: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  notes?: string | null;
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  paymentReference?: string | null;
  paymentBank?: string | null;
  items: Array<{
    productId: string | null;
    productNameSnapshot: string;
    skuSnapshot?: string | null;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    inventorySource?: string;
  }>;
  subtotal?: number;
  discountTotal?: number;
  shippingTotal?: number;
  taxTotal?: number;
  createdBy?: string | null;
}

export interface CreateOrderResult {
  ok: boolean;
  error?: string;
  order?: Order;
}

/** Cliente Supabase (para API pública puede ser admin) */
type SupabaseClientLike = Awaited<ReturnType<typeof getSupabaseClient>>;

/**
 * Genera order_number único por empresa.
 */
async function generateOrderNumber(
  companyId: string,
  supabase?: SupabaseClientLike
): Promise<string> {
  const client = supabase ?? (await getSupabaseClient());
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const { count } = await client
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .gte("created_at", new Date().toISOString().slice(0, 10));
  const n = (count ?? 0) + 1;
  return `ORD-${date}-${String(n).padStart(5, "0")}`;
}

/**
 * Crea un pedido en estado pendiente_confirmacion.
 * NO modifica stock.
 * Opcional: pasar supabase para API pública (usa admin client).
 */
export async function createOrder(
  input: CreateOrderInput,
  supabaseOverride?: SupabaseClientLike
): Promise<CreateOrderResult> {
  const supabase = supabaseOverride ?? (await getSupabaseClient());
  const {
    companyId,
    sourceChannel = "manual",
    sourcePlatform = null,
    customerName = null,
    customerPhone = null,
    customerEmail = null,
    notes = null,
    paymentMethod = null,
    paymentProvider = null,
    paymentReference = null,
    paymentBank = null,
    items,
    subtotal = 0,
    discountTotal = 0,
    shippingTotal = 0,
    taxTotal = 0,
    createdBy = null,
  } = input;

  if (!items.length) {
    return { ok: false, error: "El pedido debe tener al menos un item" };
  }

  let totalSubtotal = 0;
  const orderItems: Array<{
    product_id: string | null;
    product_name_snapshot: string;
    sku_snapshot: string | null;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    line_total: number;
    inventory_source: string;
  }> = [];

  for (const item of items) {
    const qty = Math.max(1, Math.round(item.quantity));
    const unitPrice = Number(item.unitPrice) || 0;
    const discount = Number(item.discountAmount) || 0;
    const lineTotal = Math.max(0, qty * unitPrice - discount);
    totalSubtotal += lineTotal;
    orderItems.push({
      product_id: item.productId || null,
      product_name_snapshot: item.productNameSnapshot,
      sku_snapshot: item.skuSnapshot ?? null,
      quantity: qty,
      unit_price: unitPrice,
      discount_amount: discount,
      line_total: lineTotal,
      inventory_source: item.inventorySource ?? "propio",
    });
  }

  const computedSubtotal = totalSubtotal;
  const total =
    Number(subtotal) || computedSubtotal - Number(discountTotal) + Number(shippingTotal) + Number(taxTotal);

  const orderNumber = await generateOrderNumber(companyId, supabase);

  const orderRow = {
    company_id: companyId,
    order_number: orderNumber,
    source_channel: sourceChannel,
    source_platform: sourcePlatform,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    notes,
    payment_status: "pendiente",
    payment_method: paymentMethod,
    payment_provider: paymentProvider,
    payment_reference: paymentReference,
    payment_bank: paymentBank,
    order_status: "pendiente_confirmacion",
    subtotal: Number(subtotal) || computedSubtotal,
    discount_total: Number(discountTotal) || 0,
    shipping_total: Number(shippingTotal) || 0,
    tax_total: Number(taxTotal) || 0,
    total,
    created_by: createdBy,
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderRow)
    .select()
    .single();

  if (orderError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[createOrder]:", orderError);
    }
    return { ok: false, error: orderError.message };
  }

  const itemsToInsert = orderItems.map((o) => ({
    ...o,
    order_id: order.id,
    company_id: companyId,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(itemsToInsert);

  if (itemsError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[createOrder] items:", itemsError);
    }
    await supabase.from("orders").delete().eq("id", order.id);
    return { ok: false, error: itemsError.message };
  }

  await recordOrderEvent(supabase, order.id, "pedido_creado", null, "pendiente_confirmacion", createdBy, "Pedido creado");

  return { ok: true, order: order as Order };
}

/** Registra un evento en el historial del pedido */
async function recordOrderEvent(
  supabase: Awaited<ReturnType<typeof getSupabaseClient>>,
  orderId: string,
  eventType: OrderEventType,
  previousStatus: string | null,
  newStatus: string,
  changedBy?: string | null,
  notes?: string | null
): Promise<void> {
  await supabase.from("order_status_history").insert({
    order_id: orderId,
    event_type: eventType,
    previous_status: previousStatus,
    new_status: newStatus,
    changed_by: changedBy ?? null,
    notes: notes ?? null,
  });
}

/**
 * Obtiene pedidos por confirmar (payment_status pendiente/en_revision, order_status pendiente_confirmacion).
 */
export async function getOrdersPendingConfirmation(
  companyId: string,
  limit = 100
): Promise<Order[]> {
  const supabase = await getSupabaseClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("company_id", companyId)
    .eq("order_status", "pendiente_confirmacion")
    .in("payment_status", ["pendiente", "en_revision"])
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Order[];
}

/**
 * Obtiene ventas confirmadas (payment_status validado, order_status no rechazado ni cancelado).
 */
export async function getOrdersConfirmed(
  companyId: string,
  limit = 100
): Promise<Order[]> {
  const supabase = await getSupabaseClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("company_id", companyId)
    .eq("payment_status", "validado")
    .not("order_status", "in", "(rechazado,cancelado)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Order[];
}

/**
 * Obtiene pedidos rechazados.
 */
export async function getOrdersRejected(
  companyId: string,
  limit = 100
): Promise<Order[]> {
  const supabase = await getSupabaseClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("company_id", companyId)
    .eq("order_status", "rechazado")
    .eq("payment_status", "rechazado")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Order[];
}

/**
 * Obtiene pedidos para el kanban (confirmados, en preparación, etc.).
 */
export async function getOrdersForKanban(
  companyId: string,
  statuses?: string[]
): Promise<Order[]> {
  const supabase = await getSupabaseClient();
  let query = supabase
    .from("orders")
    .select("*")
    .eq("company_id", companyId)
    .eq("payment_status", "validado")
    .not("order_status", "in", '("cancelado")')
    .order("created_at", { ascending: false });

  if (statuses?.length) {
    query = query.in("order_status", statuses);
  }

  const { data } = await query;
  return (data ?? []) as Order[];
}

/**
 * Obtiene un pedido por ID con sus items.
 */
export async function getOrderById(
  orderId: string,
  companyId: string
): Promise<OrderWithItems | null> {
  const supabase = await getSupabaseClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("company_id", companyId)
    .single();

  if (!order) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .eq("company_id", companyId)
    .order("created_at");

  return {
    ...(order as Order),
    items: (items ?? []) as OrderItem[],
  };
}

/**
 * Obtiene items de un pedido.
 */
export async function getOrderItems(
  orderId: string,
  companyId: string
): Promise<OrderItem[]> {
  const supabase = await getSupabaseClient();
  const { data } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .eq("company_id", companyId)
    .order("created_at");
  return (data ?? []) as OrderItem[];
}

/**
 * Confirma el pago de un pedido.
 * 1. Actualiza payment_status → validado, order_status → confirmado
 * 2. Descuenta stock por cada item con producto e inventario propio
 */
export async function confirmOrderPayment(
  orderId: string,
  companyId: string,
  verifiedBy: string,
  paymentData?: {
    amountReceived?: number;
    receivedAt?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getSupabaseClient();
  const order = await getOrderById(orderId, companyId);
  if (!order) return { ok: false, error: "Pedido no encontrado" };
  if (order.company_id !== companyId) return { ok: false, error: "Pedido no pertenece a la empresa" };
  if (order.payment_status === "validado") return { ok: false, error: "El pago ya está confirmado" };
  if (order.order_status === "rechazado") return { ok: false, error: "El pedido está rechazado" };

  const items = order.items ?? (await getOrderItems(orderId, companyId));

  // Descontar stock SOLO para items con product_id e inventory_source = "propio"
  // Dropi, Shopify, externo NO afectan stock interno
  for (const item of items) {
    if (item.product_id && item.inventory_source === INVENTORY_SOURCE_PROPIO) {
      const { data: product } = await supabase
        .from("products")
        .select("track_stock, product_type")
        .eq("id", item.product_id)
        .single();

      if (product && productTypeUsesStock(product.product_type ?? "ecommerce", product.track_stock)) {
        const result = await recordStockSalidaPorVenta(
          item.product_id,
          companyId,
          item.quantity,
          orderId,
          verifiedBy,
          `Venta ${order.order_number}`
        );
        if (!result.ok) {
          return {
            ok: false,
            error: `Error al descontar stock (${item.product_name_snapshot}): ${result.error}`,
          };
        }
      }
    }
  }

  const updatePayload: Record<string, unknown> = {
    payment_status: "validado",
    order_status: "confirmado",
    payment_verified_by: verifiedBy,
    payment_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (paymentData?.amountReceived != null) {
    updatePayload.payment_amount_received = paymentData.amountReceived;
  }
  if (paymentData?.receivedAt) {
    updatePayload.payment_received_at = paymentData.receivedAt;
  }

  const { error } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", orderId)
    .eq("company_id", companyId);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[confirmOrderPayment]:", error);
    }
    return { ok: false, error: error.message };
  }

  await recordOrderEvent(supabase, orderId, "pago_confirmado", order.order_status, "confirmado", verifiedBy, "Pago confirmado - stock descontado para ítems propio");

  return { ok: true };
}

/**
 * Rechaza un pedido.
 * NO toca stock.
 */
export async function rejectOrder(
  orderId: string,
  companyId: string,
  reason?: string | null,
  notes?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const order = await getOrderById(orderId, companyId);
  if (!order) return { ok: false, error: "Pedido no encontrado" };
  if (order.company_id !== companyId) return { ok: false, error: "Pedido no pertenece a la empresa" };
  if (order.payment_status === "validado") return { ok: false, error: "No se puede rechazar un pedido con pago ya confirmado" };

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "rechazado",
      order_status: "rechazado",
      rejection_reason: reason ?? null,
      rejection_notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("company_id", companyId);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[rejectOrder]:", error);
    }
    return { ok: false, error: error.message };
  }

  await recordOrderEvent(supabase, orderId, "pedido_rechazado", order.order_status, "rechazado", null, reason ?? notes ?? "Pedido rechazado");

  return { ok: true };
}

/**
 * Cancela un pedido ya confirmado.
 * Revierte el stock.
 */
export async function cancelOrder(
  orderId: string,
  companyId: string,
  cancelledBy: string
): Promise<{ ok: boolean; error?: string }> {
  const order = await getOrderById(orderId, companyId);
  if (!order) return { ok: false, error: "Pedido no encontrado" };
  if (order.company_id !== companyId) return { ok: false, error: "Pedido no pertenece a la empresa" };
  if (order.payment_status !== "validado") {
    return { ok: false, error: "Solo se pueden cancelar pedidos con pago confirmado" };
  }
  if (order.order_status === "cancelado") return { ok: false, error: "El pedido ya está cancelado" };

  const supabase = await getSupabaseClient();
  const items = order.items ?? (await getOrderItems(orderId, companyId));

  // Revertir stock SOLO para items con inventory_source = "propio"
  for (const item of items) {
    if (item.product_id && item.inventory_source === INVENTORY_SOURCE_PROPIO) {
      const { data: product } = await supabase
        .from("products")
        .select("track_stock, product_type")
        .eq("id", item.product_id)
        .single();

      if (product && productTypeUsesStock(product.product_type ?? "ecommerce", product.track_stock)) {
        const result = await recordStockDevolucionPorCancelacion(
          item.product_id,
          companyId,
          item.quantity,
          orderId,
          cancelledBy,
          `Cancelación venta ${order.order_number}`
        );
        if (!result.ok) {
          return {
            ok: false,
            error: `Error al revertir stock (${item.product_name_snapshot}): ${result.error}`,
          };
        }
      }
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({
      order_status: "cancelado",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("company_id", companyId);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[cancelOrder]:", error);
    }
    return { ok: false, error: error.message };
  }

  await recordOrderEvent(supabase, orderId, "venta_cancelada", order.order_status, "cancelado", cancelledBy, "Venta cancelada - stock revertido para ítems propio");

  return { ok: true };
}

/**
 * Actualiza el estado del pedido (kanban).
 */
export async function updateOrderStatus(
  orderId: string,
  companyId: string,
  newStatus: string,
  changedBy?: string | null,
  notes?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const order = await getOrderById(orderId, companyId);
  if (!order) return { ok: false, error: "Pedido no encontrado" };
  if (order.company_id !== companyId) return { ok: false, error: "Pedido no pertenece a la empresa" };
  if (order.payment_status !== "validado") {
    return { ok: false, error: "Solo se puede cambiar estado de pedidos con pago confirmado" };
  }
  if (order.order_status === "cancelado") return { ok: false, error: "No se puede cambiar estado de un pedido cancelado" };

  const validStatuses = [
    "confirmado",
    "en_preparacion",
    "entregado_courier",
    "en_camino",
    "entregado",
    "rechazado",
  ];
  if (!validStatuses.includes(newStatus)) {
    return { ok: false, error: `Estado inválido: ${newStatus}` };
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from("orders")
    .update({
      order_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("company_id", companyId);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[updateOrderStatus]:", error);
    }
    return { ok: false, error: error.message };
  }

  await recordOrderEvent(supabase, orderId, "cambio_estado", order.order_status, newStatus, changedBy ?? null, notes ?? null);

  return { ok: true };
}

/** Historial de eventos de un pedido */
export interface OrderHistoryEvent {
  id: string;
  order_id: string;
  event_type: OrderEventType | null;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_by_email?: string | null;
  notes: string | null;
  created_at: string;
}

export async function getOrderHistory(
  orderId: string,
  companyId: string
): Promise<OrderHistoryEvent[]> {
  const supabase = await getSupabaseClient();
  const { data: events } = await supabase
    .from("order_status_history")
    .select("id, order_id, event_type, previous_status, new_status, changed_by, notes, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (!events?.length) return [];

  const creatorIds = [...new Set(events.map((e) => e.changed_by).filter(Boolean))] as string[];
  let creatorMap = new Map<string, string>();
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", creatorIds);
    creatorMap = new Map((profiles ?? []).map((p) => [p.id, p.email ?? ""]));
  }

  return events.map((e) => ({
    ...e,
    changed_by_email: e.changed_by ? creatorMap.get(e.changed_by) ?? null : null,
  })) as OrderHistoryEvent[];
}

/**
 * Estadísticas para mini dashboard.
 */
export async function getOrderStats(companyId: string) {
  const supabase = await getSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: pedidosHoy },
    { count: confirmadosHoy },
    { data: byStatus },
    { data: totalVendido },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .gte("created_at", today),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("payment_status", "validado")
      .gte("payment_verified_at", today),
    supabase
      .from("orders")
      .select("order_status")
      .eq("company_id", companyId)
      .eq("payment_status", "validado")
      .not("order_status", "eq", "cancelado"),
    supabase
      .from("orders")
      .select("total")
      .eq("company_id", companyId)
      .eq("payment_status", "validado")
      .not("order_status", "eq", "cancelado"),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const r of byStatus ?? []) {
    const s = (r as { order_status: string }).order_status;
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }

  const total = (totalVendido ?? []).reduce((sum, r) => sum + Number((r as { total: number }).total ?? 0), 0);

  return {
    pedidosHoy: pedidosHoy ?? 0,
    confirmadosHoy: confirmadosHoy ?? 0,
    enPreparacion: statusCounts["en_preparacion"] ?? 0,
    enCamino: statusCounts["en_camino"] ?? 0,
    entregados: statusCounts["entregado"] ?? 0,
    rechazados: (await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("order_status", "rechazado")).count ?? 0,
    totalVendido: total,
  };
}
