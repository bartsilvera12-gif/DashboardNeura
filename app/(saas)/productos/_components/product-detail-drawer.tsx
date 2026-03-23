"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/lib/types/product";
import { productTypeUsesStock } from "@/lib/types/product";
import {
  getStockStatus,
  STOCK_STATUS_LABELS,
  STOCK_STATUS_STYLES,
} from "@/lib/utils/stock-status";
import type { StockMovementView } from "@/lib/constants/stock-movements";
import { STOCK_MOVEMENT_TYPE_LABELS } from "@/lib/constants/stock-movements";
import { getStockMovementsAction } from "../actions";

interface ProductDetailDrawerProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onRegisterMovement: (product: Product) => void;
  onViewHistory?: (product: Product) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProductDetailDrawer({
  product,
  open,
  onClose,
  onRegisterMovement,
  onViewHistory,
}: ProductDetailDrawerProps) {
  const [recentMovements, setRecentMovements] = useState<StockMovementView[]>([]);

  useEffect(() => {
    if (open && product?.id) {
      getStockMovementsAction(product.id, 5, product.company_id ?? undefined).then((r) =>
        setRecentMovements(r.movements as unknown as StockMovementView[])
      );
    }
  }, [open, product?.id, product?.company_id]);

  if (!open) return null;

  const usesStock = product
    ? productTypeUsesStock(product.product_type ?? "ecommerce", product.track_stock)
    : false;
  const status = product ? getStockStatus(product) : null;
  const statusStyle = status ? STOCK_STATUS_STYLES[status] : null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-zinc-900/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        role="dialog"
        aria-labelledby="detail-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 id="detail-title" className="text-lg font-semibold text-zinc-900">
            Detalle del producto
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
          {!product ? (
            <p className="text-sm text-zinc-500">Selecciona un producto.</p>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-zinc-900">
                  {product.name}
                </h3>
                {product.sku && (
                  <p className="mt-0.5 text-sm text-zinc-500">SKU: {product.sku}</p>
                )}
              </div>

              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase text-zinc-500">
                  Centro de control — Inventario
                </h4>
                <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Controla stock</span>
                    <span>{usesStock ? "Sí" : "No"}</span>
                  </div>
                  {usesStock && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600">Stock actual</span>
                        <span className="text-lg font-semibold text-zinc-900">
                          {product.stock ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600">Stock mínimo</span>
                        <span>{product.min_stock ?? "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600">Stock máximo</span>
                        <span>{product.max_stock ?? "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600">Punto de pedido</span>
                        <span>{product.reorder_point ?? "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600">Permite backorder</span>
                        <span>{product.allow_backorder ? "Sí" : "No"}</span>
                      </div>
                      {status && statusStyle && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-600">Estado</span>
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {STOCK_STATUS_LABELS[status]}
                          </span>
                        </div>
                      )}
                      {recentMovements[0] && (
                        <div className="border-t border-zinc-200 pt-2 mt-2">
                          <p className="text-xs font-medium text-zinc-500 uppercase mb-1">
                            Último movimiento
                          </p>
                          <p className="text-sm text-zinc-700">
                            {STOCK_MOVEMENT_TYPE_LABELS[
                              recentMovements[0].movement_type as keyof typeof STOCK_MOVEMENT_TYPE_LABELS
                            ] ?? recentMovements[0].movement_type}{" "}
                            {recentMovements[0].movement_type === "salida"
                              ? "-"
                              : "+"}
                            {recentMovements[0].quantity} ·{" "}
                            {formatDate(recentMovements[0].created_at)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {usesStock && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onRegisterMovement(product)}
                      className="flex-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      Registrar movimiento
                    </button>
                    {onViewHistory && (
                      <button
                        type="button"
                        onClick={() => onViewHistory(product)}
                        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        Ver historial
                      </button>
                    )}
                  </div>
                )}
              </div>

              {usesStock && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase text-zinc-500">
                    Últimos movimientos
                  </h4>
                  {recentMovements.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      No hay movimientos registrados.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {recentMovements.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between rounded border border-zinc-100 px-3 py-2 text-sm"
                        >
                          <span className="text-zinc-600">
                            {STOCK_MOVEMENT_TYPE_LABELS[m.movement_type] ??
                              m.movement_type}{" "}
                            {m.movement_type === "salida" ? "-" : "+"}
                            {m.quantity}
                          </span>
                          <span className="text-zinc-400">
                            {formatDate(m.created_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
