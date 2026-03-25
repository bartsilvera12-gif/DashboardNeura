"use client";

import { useState } from "react";
import type { Order } from "@/lib/types/order";
import { OrderDetailDrawer } from "./order-detail-drawer";
import { sr, srSticky } from "../../_components/saas-report-table";

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
    <div className="min-w-0">
      {orders.length === 0 ? (
        <div className={sr.emptyBox}>No hay pedidos rechazados.</div>
      ) : (
        <div className={sr.shell}>
          <div className={sr.scroll}>
            <table className={`${sr.table} min-w-max`}>
              <thead>
                <tr className={sr.theadTr}>
                  <th className={sr.th}>Nº pedido</th>
                  <th className={`${sr.th} min-w-0 max-w-[12rem]`}>Cliente</th>
                  <th className={`${sr.th} min-w-0 max-w-[14rem]`}>Motivo</th>
                  <th className={sr.thRight}>Monto</th>
                  <th className={sr.th}>Fecha</th>
                  <th className={`${sr.thRight} ${srSticky.thActions}`}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
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
                      <td className={`${sr.td} max-w-[14rem] truncate`}>
                        {o.rejection_reason || o.rejection_notes || "—"}
                      </td>
                      <td className={sr.tdRightStrong}>
                        {formatMoney(Number(o.total) || 0)}
                      </td>
                      <td className={sr.td}>{formatDate(o.created_at)}</td>
                      <td className={`${sr.actions} ${srSticky.tdActions}`}>
                        <button
                          type="button"
                          onClick={() => setDetailOrder(o)}
                          className={`${sr.actionPrimary} text-xs`}
                        >
                          Ver detalle
                        </button>
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
