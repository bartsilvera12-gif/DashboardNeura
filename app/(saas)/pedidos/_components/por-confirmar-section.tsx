"use client";

import { useState } from "react";
import type { Order } from "@/lib/types/order";
import type { Product } from "@/lib/types/product";
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_STYLES_DARK,
  SOURCE_CHANNEL_LABELS,
} from "@/lib/constants/orders";
import type { PaymentStatus } from "@/lib/constants/orders";
import { sr, srSticky } from "../../_components/saas-report-table";
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
    <div className="min-w-0 space-y-6">
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
        <div className={sr.emptyBox}>
          No hay pedidos pendientes de confirmación.
        </div>
      ) : (
        <div className={sr.shell}>
          <div className={sr.scroll}>
            <table className={`${sr.table} min-w-max`}>
              <thead>
                <tr className={sr.theadTr}>
                  <th className={sr.th}>Nº pedido</th>
                  <th className={`${sr.th} min-w-0 max-w-[12rem]`}>Cliente</th>
                  <th className={sr.thRight}>Monto</th>
                  <th className={sr.th}>Método pago</th>
                  <th className={sr.th}>Estado pago</th>
                  <th className={sr.th}>Fecha</th>
                  <th className={`${sr.thRight} ${srSticky.thActions}`}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const payKey = o.payment_status as PaymentStatus;
                  const payPill =
                    PAYMENT_STATUS_STYLES_DARK[payKey] ??
                    "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/25";
                  const clientLabel =
                        o.customer_name || o.customer_email || "—";
                  return (
                    <tr key={o.id} className={`group ${sr.tr}`}>
                      <td className={sr.tdLead}>{o.order_number}</td>
                      <td className={`${sr.td} min-w-0 max-w-[12rem]`}>
                        <span
                          className="block truncate"
                          title={clientLabel}
                        >
                          {clientLabel}
                        </span>
                      </td>
                      <td className={sr.tdRightStrong}>
                        {formatMoney(Number(o.total) || 0)}
                      </td>
                      <td className={sr.td}>{o.payment_method || "—"}</td>
                      <td className={sr.td}>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${payPill}`}
                        >
                          {PAYMENT_STATUS_LABELS[payKey] ?? o.payment_status}
                        </span>
                      </td>
                      <td className={sr.td}>{formatDate(o.created_at)}</td>
                      <td className={`${sr.actions} ${srSticky.tdActions}`}>
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
                            onClick={() => handleConfirm(o)}
                            disabled={confirmingId === o.id}
                            className={`${sr.actionSuccess} text-xs`}
                          >
                            {confirmingId === o.id
                              ? "Confirmando…"
                              : "Confirmar pago"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectOrder(o)}
                            className={`${sr.actionDanger} text-xs`}
                          >
                            Rechazar
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
