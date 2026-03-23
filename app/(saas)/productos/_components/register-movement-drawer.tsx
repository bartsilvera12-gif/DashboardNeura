"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/lib/types/product";
import { productTypeUsesStock } from "@/lib/types/product";
import { STOCK_MOVEMENT_TYPE_LABELS } from "@/lib/constants/stock-movements";
import type { StockMovementType } from "../actions";
import { recordStockMovementAction } from "../actions";

interface RegisterMovementDrawerProps {
  product: Product | null;
  companyId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MOVEMENT_TYPES: StockMovementType[] = [
  "stock_inicial",
  "entrada",
  "salida",
  "ajuste",
  "devolucion",
];

export function RegisterMovementDrawer({
  product,
  companyId,
  open,
  onClose,
  onSuccess,
}: RegisterMovementDrawerProps) {
  const [movementType, setMovementType] = useState<StockMovementType>("entrada");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStock = product?.stock ?? 0;
  const qtyNum = parseInt(quantity, 10) || 0;
  const isAjuste = movementType === "ajuste";
  const isSalida = movementType === "salida";
  const isEntrada =
    movementType === "entrada" ||
    movementType === "devolucion" ||
    movementType === "stock_inicial";

  let previewNewStock = currentStock;
  if (isEntrada) previewNewStock = currentStock + (isNaN(qtyNum) ? 0 : qtyNum);
  else if (isSalida) previewNewStock = Math.max(0, currentStock - (isNaN(qtyNum) ? 0 : qtyNum));
  else if (isAjuste) previewNewStock = Math.max(0, currentStock + qtyNum);

  useEffect(() => {
    if (open) {
      setMovementType("entrada");
      setQuantity("");
      setReason("");
      setNotes("");
      setError(null);
    }
  }, [open, product?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setError(null);
    setLoading(true);
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || (movementType !== "ajuste" && qty <= 0)) {
      setError("Cantidad inválida");
      setLoading(false);
      return;
    }
    const effectiveQty = movementType === "ajuste" ? qty : Math.abs(qty);
    const result = await recordStockMovementAction({
      productId: product.id,
      companyId,
      movementType,
      quantity: effectiveQty,
      reason: reason.trim() || null,
      notes: notes.trim() || null,
    });
    setLoading(false);
    if (result.ok) {
      onSuccess?.();
      onClose();
    } else {
      setError(result.error ?? "Error al registrar el movimiento");
    }
  };

  if (!open) return null;

  const usesStock = product
    ? productTypeUsesStock(product.product_type ?? "ecommerce", product.track_stock)
    : false;

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
        aria-labelledby="drawer-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 id="drawer-title" className="text-lg font-semibold text-zinc-900">
            Registrar movimiento
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
          ) : !usesStock ? (
            <p className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
              Este producto no controla stock. No se pueden registrar movimientos.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-xs font-medium text-zinc-500">Producto</p>
                <p className="mt-0.5 font-medium text-zinc-900">
                  {product.name}
                  {product.sku && (
                    <span className="ml-2 text-sm text-zinc-500">
                      SKU: {product.sku}
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Tipo de movimiento *
                </label>
                <select
                  value={movementType}
                  onChange={(e) =>
                    setMovementType(e.target.value as StockMovementType)
                  }
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  required
                >
                  {MOVEMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {STOCK_MOVEMENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Cantidad *
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min={movementType === "ajuste" ? undefined : 1}
                  step="1"
                  placeholder={movementType === "ajuste" ? "Ej: 5 o -3" : "0"}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  required
                />
                {movementType === "ajuste" && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Usa números positivos para sumar, negativos para restar.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Motivo
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Reposición, Ajuste por inventario"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Observación
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Detalle opcional"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-medium text-zinc-500">
                  Vista previa de stock
                </p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-600">Stock anterior:</span>
                  <span className="font-medium">{currentStock}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-zinc-600">Stock nuevo:</span>
                  <span className="font-semibold text-zinc-900">
                    {previewNewStock}
                  </span>
                </div>
              </div>

              {error && (
                <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {loading ? "Guardando…" : "Confirmar"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
