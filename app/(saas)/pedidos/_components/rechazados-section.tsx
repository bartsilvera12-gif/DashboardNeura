"use client";

import { useState } from "react";
import type { Order } from "@/lib/types/order";
import { OrderDetailDrawer } from "./order-detail-drawer";

interface RechazadosSectionProps {
  companyId: string;
  orders: Order[];
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

export function RechazadosSection({
  companyId,
  orders,
}: RechazadosSectionProps) {
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  return (
    <div>
      {orders.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-500">
          No hay pedidos rechazados.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Nº pedido
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Cliente
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-600">
                  Motivo
                </th>
                <th className="px-3 py-2 text-right font-medium text-zinc-600">
                  Monto
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
                  <td className="px-3 py-2 text-zinc-600 max-w-[200px] truncate">
                    {o.rejection_reason || o.rejection_notes || "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatMoney(Number(o.total) || 0)}
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
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
      />
    </div>
  );
}
