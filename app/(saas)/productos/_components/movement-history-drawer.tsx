"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/lib/types/product";
import type {
  StockMovementView,
  StockMovementOrigin,
} from "@/lib/constants/stock-movements";
import {
  STOCK_MOVEMENT_TYPE_LABELS,
  STOCK_ORIGIN_LABELS,
} from "@/lib/constants/stock-movements";
import { getStockMovementsAction } from "../actions";

interface MovementHistoryDrawerProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

function creatorLabel(m: StockMovementView): string {
  if (m.created_by_name) return m.created_by_name;
  if (m.created_by_email) return m.created_by_email;
  return "—";
}

function originLabel(origin?: StockMovementOrigin | null): string {
  if (!origin) return "—";
  return STOCK_ORIGIN_LABELS[origin] ?? origin;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MovementHistoryDrawer({
  product,
  open,
  onClose,
}: MovementHistoryDrawerProps) {
  const [movements, setMovements] = useState<StockMovementView[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && product?.id) {
      setLoading(true);
      getStockMovementsAction(
        product.id,
        50,
        product.company_id ?? undefined
      )
        .then((r) => setMovements(r.movements as unknown as StockMovementView[]))
        .finally(() => setLoading(false));
    }
  }, [open, product?.id, product?.company_id]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-zinc-900/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-white shadow-xl"
        role="dialog"
        aria-labelledby="history-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 id="history-title" className="text-lg font-semibold text-zinc-900">
            Movimientos
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

        <div className="flex-1 overflow-y-auto p-6">
          {product && (
            <div className="mb-4">
              <p className="text-xs font-medium text-zinc-500">Producto</p>
              <p className="font-medium text-zinc-900">
                {product.name}
                {product.sku && (
                  <span className="ml-2 text-sm text-zinc-500">
                    SKU: {product.sku}
                  </span>
                )}
              </p>
            </div>
          )}

          {loading ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Cargando movimientos…
            </p>
          ) : movements.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              No hay movimientos registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">
                      Fecha
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">
                      Tipo
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-zinc-600">
                      Cant.
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-zinc-600">
                      Anterior
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-zinc-600">
                      Nuevo
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">
                      Motivo
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">
                      Observación
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">
                      Usuario
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-600">
                      Origen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-zinc-100 hover:bg-zinc-50"
                    >
                      <td className="px-3 py-2 text-zinc-600">
                        {formatDate(m.created_at)}
                      </td>
                      <td className="px-3 py-2">
                        {STOCK_MOVEMENT_TYPE_LABELS[
                          m.movement_type as keyof typeof STOCK_MOVEMENT_TYPE_LABELS
                        ] ?? m.movement_type}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {m.movement_type === "salida" ? "-" : "+"}
                        {m.quantity}
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-600">
                        {m.previous_stock}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {m.new_stock}
                      </td>
                      <td className="px-3 py-2 text-zinc-600">
                        {m.reason ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-600 max-w-[120px] truncate" title={m.notes ?? undefined}>
                        {m.notes ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-600">
                        {creatorLabel(m)}
                      </td>
                      <td className="px-3 py-2 text-zinc-600">
                        {originLabel(m.origin)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
