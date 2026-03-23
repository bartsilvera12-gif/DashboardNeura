"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ResolvedProductColumn } from "@/lib/config/product-column-types";
import type { Product } from "@/lib/types/product";
import type { StockMovementView } from "@/lib/constants/stock-movements";
import { productTypeUsesStock } from "@/lib/types/product";
import {
  getStockStatus,
  STOCK_STATUS_LABELS,
  STOCK_STATUS_STYLES,
} from "@/lib/utils/stock-status";
import { STOCK_MOVEMENT_TYPE_LABELS } from "@/lib/constants/stock-movements";
import { RegisterMovementDrawer } from "./register-movement-drawer";
import { MovementHistoryDrawer } from "./movement-history-drawer";
import { ProductDetailDrawer } from "./product-detail-drawer";

interface StockSectionProps {
  companyId: string;
  products: Product[];
  columns: ResolvedProductColumn[];
  lastMovementByProduct?: Record<string, StockMovementView>;
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

export function StockSection({
  companyId,
  products,
  columns,
  lastMovementByProduct = {},
}: StockSectionProps) {
  const router = useRouter();
  const [registerProduct, setRegisterProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const withStock = products.filter((p) =>
    productTypeUsesStock(p.product_type ?? "ecommerce", p.track_stock)
  );
  const sinStock = withStock.filter((p) => (p.stock ?? 0) <= 0);
  const stockBajo = withStock.filter(
    (p) =>
      (p.min_stock ?? 0) > 0 &&
      (p.stock ?? 0) > 0 &&
      (p.stock ?? 0) <= (p.min_stock ?? 0)
  );
  const enPuntoPedido = withStock.filter(
    (p) =>
      (p.reorder_point ?? 0) > 0 &&
      (p.stock ?? 0) > 0 &&
      (p.stock ?? 0) <= (p.reorder_point ?? 0) &&
      ((p.min_stock ?? 0) <= 0 || (p.stock ?? 0) > (p.min_stock ?? 0))
  );
  const stockNormal = withStock.filter(
    (p) => getStockStatus(p) === "stock_normal"
  );
  const sobrestock = withStock.filter(
    (p) => getStockStatus(p) === "sobrestock"
  );

  const handleMovementSuccess = () => {
    router.refresh();
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-medium text-zinc-900">Stock</h2>
      <p className="mb-6 text-sm text-zinc-600">
        Inventario integrado en Productos. Registra movimientos para mantener la
        trazabilidad. Todo cambio de stock debe hacerse mediante movimientos.
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">
            Con control
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">
            {withStock.length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">
            Sin stock
          </p>
          <p className="mt-1 text-2xl font-semibold text-red-600">
            {sinStock.length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">
            Stock bajo
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">
            {stockBajo.length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">
            En punto de pedido
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-500">
            {enPuntoPedido.length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">Normal</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {stockNormal.length}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="px-3 py-2 text-left font-medium text-zinc-600">
                Producto
              </th>
              <th className="px-3 py-2 text-left font-medium text-zinc-600">
                SKU
              </th>
              <th className="px-3 py-2 text-right font-medium text-zinc-600">
                Stock actual
              </th>
              <th className="px-3 py-2 text-right font-medium text-zinc-600">
                Mínimo
              </th>
              <th className="px-3 py-2 text-right font-medium text-zinc-600">
                Punto pedido
              </th>
              <th className="px-3 py-2 text-left font-medium text-zinc-600">
                Estado
              </th>
              <th className="px-3 py-2 text-left font-medium text-zinc-600">
                Último movimiento
              </th>
              <th className="px-3 py-2 text-left font-medium text-zinc-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-zinc-500"
                >
                  No hay productos. Añádelos desde Catálogo.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const status = getStockStatus(p);
                const statusStyle = STOCK_STATUS_STYLES[status];
                const usesStock = productTypeUsesStock(
                  p.product_type ?? "ecommerce",
                  p.track_stock
                );
                const lastMov = lastMovementByProduct[p.id];

                return (
                  <tr
                    key={p.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50"
                  >
                    <td className="px-3 py-2 font-medium text-zinc-900">
                      {p.name ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-zinc-600">{p.sku ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      {usesStock ? (p.stock ?? 0) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {usesStock ? (p.min_stock ?? "—") : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {usesStock ? (p.reorder_point ?? "—") : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        {STOCK_STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-600">
                      {lastMov ? (
                        <span className="text-xs">
                          {STOCK_MOVEMENT_TYPE_LABELS[lastMov.movement_type as keyof typeof STOCK_MOVEMENT_TYPE_LABELS] ??
                            lastMov.movement_type}{" "}
                          · {formatDate(lastMov.created_at)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailProduct(p)}
                          className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                        >
                          Ver detalle
                        </button>
                        {usesStock && (
                          <>
                            <button
                              type="button"
                              onClick={() => setRegisterProduct(p)}
                              className="rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800"
                            >
                              Registrar movimiento
                            </button>
                            <button
                              type="button"
                              onClick={() => setHistoryProduct(p)}
                              className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                            >
                              Ver movimientos
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <RegisterMovementDrawer
        product={registerProduct}
        companyId={companyId}
        open={!!registerProduct}
        onClose={() => setRegisterProduct(null)}
        onSuccess={handleMovementSuccess}
      />

      <MovementHistoryDrawer
        product={historyProduct}
        open={!!historyProduct}
        onClose={() => setHistoryProduct(null)}
      />

      <ProductDetailDrawer
        product={detailProduct}
        open={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        onRegisterMovement={(p) => {
          setDetailProduct(null);
          setRegisterProduct(p);
        }}
        onViewHistory={(p) => {
          setDetailProduct(null);
          setHistoryProduct(p);
        }}
      />
    </section>
  );
}
