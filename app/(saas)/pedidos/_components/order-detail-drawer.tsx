"use client";

import { useState, useEffect } from "react";
import type { Order, OrderWithItems } from "@/lib/types/order";
import type { OrderHistoryEvent } from "@/lib/config/orders-service";
import {
  PAYMENT_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
  ORDER_STATUS_STYLES,
  SOURCE_CHANNEL_LABELS,
  SOURCE_PLATFORM_LABELS,
  INVENTORY_SOURCE_LABELS,
  KANBAN_COLUMNS,
  ORDER_EVENT_LABELS,
} from "@/lib/constants/orders";
import {
  getOrderByIdAction,
  getOrderHistoryAction,
  updateOrderStatusAction,
  cancelOrderAction,
} from "../actions";

interface OrderDetailDrawerProps {
  order: Order | null;
  companyId: string;
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onReject?: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
  }).format(n);
}

export function OrderDetailDrawer({
  order,
  companyId,
  open,
  onClose,
  onConfirm,
  onReject,
}: OrderDetailDrawerProps) {
  const [fullOrder, setFullOrder] = useState<OrderWithItems | null>(null);
  const [history, setHistory] = useState<OrderHistoryEvent[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (open && order?.id) {
      getOrderByIdAction(order.id, companyId).then(setFullOrder);
      getOrderHistoryAction(order.id, companyId).then(setHistory);
    } else {
      setFullOrder(null);
      setHistory([]);
    }
  }, [open, order?.id, companyId]);

  if (!open) return null;

  const o = fullOrder ?? order;
  if (!o) return null;

  const paymentStyle = PAYMENT_STATUS_STYLES[o.payment_status as keyof typeof PAYMENT_STATUS_STYLES];
  const orderStyle = ORDER_STATUS_STYLES[o.order_status as keyof typeof ORDER_STATUS_STYLES];

  // Validaciones de transiciones
  const canConfirm =
    o.payment_status !== "validado" &&
    o.order_status !== "rechazado" &&
    o.order_status !== "cancelado";
  const canReject =
    o.payment_status !== "validado" &&
    o.order_status !== "rechazado" &&
    o.order_status !== "cancelado";
  const canCancel =
    o.payment_status === "validado" && o.order_status !== "cancelado";
  const canChangeStatus =
    o.payment_status === "validado" &&
    o.order_status !== "cancelado" &&
    o.order_status !== "rechazado";

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === o.order_status) return;
    setUpdatingStatus(true);
    const result = await updateOrderStatusAction(o.id, companyId, newStatus);
    setUpdatingStatus(false);
    if (result.ok) {
      getOrderByIdAction(o.id, companyId).then(setFullOrder);
      getOrderHistoryAction(o.id, companyId).then(setHistory);
    } else {
      alert(result.error);
    }
  };

  const handleCancel = async () => {
    if (!confirm("¿Cancelar esta venta? Se revertirá el stock de ítems propio."))
      return;
    setUpdatingStatus(true);
    const result = await cancelOrderAction(o.id, companyId);
    setUpdatingStatus(false);
    if (result.ok) {
      onClose();
    } else {
      alert(result.error);
    }
  };

  const items = "items" in o && Array.isArray(o.items) ? o.items : [];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-zinc-900/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-xl"
        role="dialog"
        aria-labelledby="order-detail-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 id="order-detail-title" className="text-lg font-semibold text-zinc-900">
            {o.order_number}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cliente */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Cliente
            </h4>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
              <p className="font-medium text-zinc-900">
                {o.customer_name || o.customer_email || "—"}
              </p>
              {o.customer_phone && (
                <p className="mt-1 text-sm text-zinc-600">{o.customer_phone}</p>
              )}
              {o.customer_email && o.customer_name && (
                <p className="text-sm text-zinc-600">{o.customer_email}</p>
              )}
            </div>
          </section>

          {/* Productos */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Productos
            </h4>
            <ul className="space-y-2">
              {items.length === 0 ? (
                <li className="rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-center text-sm text-zinc-500">
                  Cargando…
                </li>
              ) : (
                items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-zinc-900">
                        {item.product_name_snapshot} × {item.quantity}
                      </span>
                      {item.inventory_source && (
                        <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600">
                          {INVENTORY_SOURCE_LABELS[item.inventory_source as keyof typeof INVENTORY_SOURCE_LABELS] ?? item.inventory_source}
                        </span>
                      )}
                    </div>
                    <span className="ml-2 font-medium">
                      {formatMoney(Number(item.line_total) || 0)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Totales */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Totales
            </h4>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600">Subtotal</span>
                <span>{formatMoney(Number(o.subtotal) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Descuento</span>
                <span>{formatMoney(Number(o.discount_total) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Envío</span>
                <span>{formatMoney(Number(o.shipping_total) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Impuestos</span>
                <span>{formatMoney(Number(o.tax_total) || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 font-semibold text-zinc-900">
                <span>Total</span>
                <span>{formatMoney(Number(o.total) || 0)}</span>
              </div>
            </div>
          </section>

          {/* Auditoría de pago */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Auditoría de pago
            </h4>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-zinc-600">Estado</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    paymentStyle?.bg ?? "bg-zinc-100"
                  } ${paymentStyle?.text ?? "text-zinc-700"}`}
                >
                  {PAYMENT_STATUS_LABELS[o.payment_status as keyof typeof PAYMENT_STATUS_LABELS] ?? o.payment_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Método</span>
                <span>{o.payment_method || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Proveedor</span>
                <span>{SOURCE_PLATFORM_LABELS[o.payment_provider ?? ""] ?? o.payment_provider ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Referencia</span>
                <span className="truncate max-w-[200px] ml-2" title={o.payment_reference ?? undefined}>
                  {o.payment_reference || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Banco</span>
                <span>{o.payment_bank || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Monto recibido</span>
                <span>
                  {o.payment_amount_received != null
                    ? formatMoney(Number(o.payment_amount_received))
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Fecha recepción</span>
                <span>{formatDate(o.payment_received_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Verificado por</span>
                <span>{o.payment_verified_by ? "Usuario" : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Fecha verificación</span>
                <span>{formatDate(o.payment_verified_at)}</span>
              </div>
            </div>
          </section>

          {/* Estado actual */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Estado del pedido
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  orderStyle?.bg ?? "bg-zinc-100"
                } ${orderStyle?.text ?? "text-zinc-700"}`}
              >
                {ORDER_STATUS_LABELS[o.order_status as keyof typeof ORDER_STATUS_LABELS] ?? o.order_status}
              </span>
              <span className="text-xs text-zinc-500">
                Canal: {SOURCE_CHANNEL_LABELS[o.source_channel ?? ""] ?? o.source_channel ?? "—"}
              </span>
              {o.source_platform && (
                <span className="text-xs text-zinc-500">
                  Plataforma: {SOURCE_PLATFORM_LABELS[o.source_platform] ?? o.source_platform}
                </span>
              )}
            </div>

            {canChangeStatus && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Cambiar estado operativo
                </label>
                <select
                  value={o.order_status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  {KANBAN_COLUMNS.filter((s) => s !== "rechazado").map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* Historial */}
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Historial de eventos
            </h4>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/30 max-h-48 overflow-y-auto">
              {history.length === 0 ? (
                <p className="p-4 text-center text-sm text-zinc-500">
                  Sin eventos registrados
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {[...history].reverse().map((ev) => (
                    <li
                      key={ev.id}
                      className="flex flex-col gap-0.5 px-4 py-2.5 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-800">
                          {ORDER_EVENT_LABELS[ev.event_type as keyof typeof ORDER_EVENT_LABELS] ?? ev.event_type ?? "Evento"}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatDate(ev.created_at)}
                        </span>
                      </div>
                      {ev.previous_status && ev.new_status && (
                        <span className="text-xs text-zinc-600">
                          {ORDER_STATUS_LABELS[ev.previous_status as keyof typeof ORDER_STATUS_LABELS] ?? ev.previous_status} →{" "}
                          {ORDER_STATUS_LABELS[ev.new_status as keyof typeof ORDER_STATUS_LABELS] ?? ev.new_status}
                        </span>
                      )}
                      {ev.notes && (
                        <span className="text-xs text-zinc-500">{ev.notes}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {o.notes && (
            <section>
              <h4 className="mb-1 text-xs font-semibold uppercase text-zinc-500">
                Notas
              </h4>
              <p className="text-sm text-zinc-700">{o.notes}</p>
            </section>
          )}
        </div>

        {/* Acciones según estado */}
        <div className="border-t border-zinc-200 bg-zinc-50/50 p-4 flex flex-wrap gap-2">
          {canConfirm && onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Confirmar pago
            </button>
          )}
          {canReject && onReject && (
            <button
              type="button"
              onClick={onReject}
              className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Rechazar
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={updatingStatus}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
            >
              Cancelar venta (revertir stock)
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}
