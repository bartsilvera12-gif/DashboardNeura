/**
 * Constantes y tipos para pedidos.
 * Seguro para Client Components.
 */

export type PaymentStatus =
  | "pendiente"
  | "en_revision"
  | "validado"
  | "rechazado"
  | "reembolsado";

export type OrderStatus =
  | "pendiente_confirmacion"
  | "confirmado"
  | "en_preparacion"
  | "entregado_courier"
  | "en_camino"
  | "entregado"
  | "rechazado"
  | "cancelado";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  validado: "Validado",
  rechazado: "Rechazado",
  reembolsado: "Reembolsado",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente_confirmacion: "Pendiente confirmación",
  confirmado: "Confirmado",
  en_preparacion: "En preparación",
  entregado_courier: "Entregado al courier",
  en_camino: "En camino",
  entregado: "Entregado",
  rechazado: "Rechazado",
  cancelado: "Cancelado",
};

export const PAYMENT_STATUS_STYLES: Record<
  PaymentStatus,
  { bg: string; text: string }
> = {
  pendiente: { bg: "bg-amber-100", text: "text-amber-800" },
  en_revision: { bg: "bg-blue-100", text: "text-blue-800" },
  validado: { bg: "bg-emerald-100", text: "text-emerald-800" },
  rechazado: { bg: "bg-red-100", text: "text-red-800" },
  reembolsado: { bg: "bg-zinc-100", text: "text-zinc-700" },
};

export const ORDER_STATUS_STYLES: Record<
  OrderStatus,
  { bg: string; text: string }
> = {
  pendiente_confirmacion: { bg: "bg-amber-100", text: "text-amber-800" },
  confirmado: { bg: "bg-blue-100", text: "text-blue-800" },
  en_preparacion: { bg: "bg-violet-100", text: "text-violet-800" },
  entregado_courier: { bg: "bg-cyan-100", text: "text-cyan-800" },
  en_camino: { bg: "bg-sky-100", text: "text-sky-800" },
  entregado: { bg: "bg-emerald-100", text: "text-emerald-800" },
  rechazado: { bg: "bg-red-100", text: "text-red-800" },
  cancelado: { bg: "bg-zinc-100", text: "text-zinc-600" },
};

export type SourceChannel =
  | "web"
  | "manual"
  | "shopify"
  | "dropi"
  | "otro";

export const SOURCE_CHANNEL_LABELS: Record<string, string> = {
  web: "Web",
  manual: "Manual",
  shopify: "Shopify",
  dropi: "Dropi",
  otro: "Otro",
};

export type InventorySource = "propio" | "dropi" | "shopify" | "externo";

export const INVENTORY_SOURCE_LABELS: Record<InventorySource, string> = {
  propio: "Propio",
  dropi: "Dropi",
  shopify: "Shopify",
  externo: "Externo",
};

/** Solo items con inventory_source = propio afectan stock interno */
export const INVENTORY_SOURCE_PROPIO = "propio" as const;

/** Canales y plataformas para integraciones externas */
export type SourcePlatform = "pagopar" | "bancard" | "shopify" | "dropi" | "manual" | "otro";

export const SOURCE_PLATFORM_LABELS: Record<string, string> = {
  pagopar: "PagoPar",
  bancard: "Bancard",
  shopify: "Shopify",
  dropi: "Dropi",
  manual: "Manual",
  otro: "Otro",
};

/** Tipos de evento del historial del pedido */
export type OrderEventType =
  | "pedido_creado"
  | "pago_confirmado"
  | "pedido_rechazado"
  | "venta_cancelada"
  | "cambio_estado"
  | "stock_revertido";

export const ORDER_EVENT_LABELS: Record<OrderEventType, string> = {
  pedido_creado: "Pedido creado",
  pago_confirmado: "Pago confirmado",
  pedido_rechazado: "Pedido rechazado",
  venta_cancelada: "Venta cancelada",
  cambio_estado: "Cambio de estado",
  stock_revertido: "Stock revertido",
};

/** Estados del kanban (sin pendiente_confirmacion ni cancelado) */
export const KANBAN_COLUMNS: OrderStatus[] = [
  "confirmado",
  "en_preparacion",
  "entregado_courier",
  "en_camino",
  "entregado",
  "rechazado",
];
