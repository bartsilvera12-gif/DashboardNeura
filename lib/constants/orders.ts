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

/** Píldoras de estado de pedido en tablas oscuras. */
export const ORDER_STATUS_STYLES_DARK: Record<OrderStatus, string> = {
  pendiente_confirmacion:
    "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
  confirmado: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",
  en_preparacion: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25",
  entregado_courier: "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/25",
  en_camino: "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/20",
  entregado: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
  rechazado: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
  cancelado: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/25",
};

export const PAYMENT_STATUS_STYLES_DARK: Record<PaymentStatus, string> = {
  pendiente: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
  en_revision: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",
  validado: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
  rechazado: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
  reembolsado: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/25",
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
