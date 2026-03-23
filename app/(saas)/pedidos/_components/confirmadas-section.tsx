"use client";

import { useState } from "react";
import type { Order } from "@/lib/types/order";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  SOURCE_CHANNEL_LABELS,
} from "@/lib/constants/orders";
import { OrderDetailDrawer } from "./order-detail-drawer";

interface ConfirmadasSectionProps {
  companyId: string;
  orders: Order[];
  onSwitchToKanban: () => void;
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

export function ConfirmadasSection({
  companyId,
  orders,
  onSwitchToKanban,
}: ConfirmadasSectionProps) {
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSwitchToKanban}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Ir al Kanban
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-500">
          No hay ventas confirmadas aún.
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
                  Total
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Estado
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Canal
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
              {orders.map((o) => {
                const style =
                  ORDER_STATUS_STYLES[o.order_status as keyof typeof ORDER_STATUS_STYLES];
                return (
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
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          style?.bg ?? "bg-zinc-100"
                        } ${style?.text ?? "text-zinc-700"}`}
                      >
                        {ORDER_STATUS_LABELS[
                          o.order_status as keyof typeof ORDER_STATUS_LABELS
                        ] ?? o.order_status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-600">
                      {SOURCE_CHANNEL_LABELS[o.source_channel ?? ""] ??
                        o.source_channel ??
                        "—"}
                    </td>
                    <td className="px-3 py-2 text-zinc-600">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setDetailOrder(o)}
                        className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                      >
                        Ver detalle
                      </button>
                      <button
                        type="button"
                        onClick={onSwitchToKanban}
                        className="ml-1 rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800"
                      >
                        Ir a Kanban
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <OrderDetailDrawer
        order={detailOrder}
        companyId={companyId}
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
      />
    </div>
  );
}
