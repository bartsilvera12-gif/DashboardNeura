"use client";

import { useState } from "react";
import type { Order } from "@/lib/types/order";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES_DARK,
  SOURCE_CHANNEL_LABELS,
} from "@/lib/constants/orders";
import type { OrderStatus } from "@/lib/constants/orders";
import { sr } from "../../_components/saas-report-table";
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
        <div className={sr.emptyBox}>
          No hay ventas confirmadas aún.
        </div>
      ) : (
        <div className={sr.shell}>
          <div className={sr.scroll}>
            <table className={`${sr.table} min-w-[700px]`}>
              <thead>
                <tr className={sr.theadTr}>
                  <th className={sr.th}>Nº pedido</th>
                  <th className={sr.th}>Cliente</th>
                  <th className={sr.thRight}>Total</th>
                  <th className={sr.th}>Estado</th>
                  <th className={sr.th}>Canal</th>
                  <th className={sr.th}>Fecha</th>
                  <th className={sr.thRight}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const st = o.order_status as OrderStatus;
                  const pill =
                    ORDER_STATUS_STYLES_DARK[st] ??
                    "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/25";
                  return (
                    <tr key={o.id} className={sr.tr}>
                      <td className={sr.tdLead}>{o.order_number}</td>
                      <td className={sr.td}>
                        {o.customer_name || o.customer_email || "—"}
                      </td>
                      <td className={sr.tdRightStrong}>
                        {formatMoney(Number(o.total) || 0)}
                      </td>
                      <td className={sr.td}>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${pill}`}
                        >
                          {ORDER_STATUS_LABELS[st] ?? o.order_status}
                        </span>
                      </td>
                      <td className={sr.td}>
                        {SOURCE_CHANNEL_LABELS[o.source_channel ?? ""] ??
                          o.source_channel ??
                          "—"}
                      </td>
                      <td className={sr.td}>{formatDate(o.created_at)}</td>
                      <td className={sr.actions}>
                        <div className={sr.actionsInner}>
                          <button
                            type="button"
                            onClick={() => setDetailOrder(o)}
                            className={`${sr.actionPrimary} text-xs`}
                          >
                            Ver detalle
                          </button>
                          <button
                            type="button"
                            onClick={onSwitchToKanban}
                            className={`${sr.actionMuted} text-xs`}
                          >
                            Ir a Kanban
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
