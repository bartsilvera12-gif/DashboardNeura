"use client";

import { useState } from "react";
import type { Order } from "@/lib/types/order";
import type { Product } from "@/lib/types/product";
import { PAYMENT_STATUS_LABELS, SOURCE_CHANNEL_LABELS } from "@/lib/constants/orders";
import { confirmOrderPaymentAction, rejectOrderAction } from "../actions";
import { OrderDetailDrawer } from "./order-detail-drawer";
import { CreateOrderDrawer } from "./create-order-drawer";
import { RejectOrderDrawer } from "./reject-order-drawer";

interface PorConfirmarSectionProps {
  companyId: string;
  orders: Order[];
  products: Product[];
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

export function PorConfirmarSection({
  companyId,
  orders,
  products,
}: PorConfirmarSectionProps) {
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [rejectOrder, setRejectOrder] = useState<Order | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleConfirm = async (order: Order) => {
    setConfirmingId(order.id);
    const result = await confirmOrderPaymentAction(order.id, companyId);
    setConfirmingId(null);
    if (result.ok) {
      setDetailOrder(null);
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Nuevo pedido manual
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-500">
          No hay pedidos pendientes de confirmación.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Nº pedido
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Cliente
                </th>
                <th className="px-3 py-2 text-right font-medium text-zinc-600">
                  Monto
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Método pago
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Estado pago
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Fecha
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-zinc-100 hover:bg-zinc-50"
                >
                  <td className="px-3 py-2 font-medium text-zinc-900">
                    {o.order_number}
                  </td>
                  <td className="px-3 py-2 text-zinc-700">
                    {o.customer_name || o.customer_email || "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatMoney(Number(o.total) || 0)}
                  </td>
                  <td className="px-3 py-2 text-zinc-600">
                    {o.payment_method || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
                      {PAYMENT_STATUS_LABELS[o.payment_status as keyof typeof PAYMENT_STATUS_LABELS] ?? o.payment_status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-zinc-600">
                    {formatDate(o.created_at)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailOrder(o)}
                        className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                      >
                        Ver detalle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirm(o)}
                        disabled={confirmingId === o.id}
                        className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {confirmingId === o.id ? "Confirmando…" : "Confirmar pago"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectOrder(o)}
                        className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                      >
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <OrderDetailDrawer
        order={detailOrder}
        companyId={companyId}
        open={!!detailOrder && !rejectOrder}
        onClose={() => setDetailOrder(null)}
        onConfirm={() => detailOrder && handleConfirm(detailOrder)}
        onReject={() => detailOrder && setRejectOrder(detailOrder)}
      />

      <RejectOrderDrawer
        order={rejectOrder}
        companyId={companyId}
        open={!!rejectOrder}
        onClose={() => setRejectOrder(null)}
      />

      <CreateOrderDrawer
        companyId={companyId}
        products={products}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
