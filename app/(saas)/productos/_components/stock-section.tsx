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
  STOCK_STATUS_STYLES_DARK,
} from "@/lib/utils/stock-status";
import { sr, srSticky } from "../../_components/saas-report-table";
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
    <section className="min-w-0 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
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

      <div className={sr.shell}>
        <div className={sr.scroll}>
          <table className={`${sr.table} min-w-max`}>
            <thead>
              <tr className={sr.theadTr}>
                <th className={`${sr.th} min-w-0 max-w-[14rem] sm:max-w-[18rem]`}>
                  Producto
                </th>
                <th className={`${sr.th} max-w-[10rem]`}>SKU</th>
                <th className={sr.thRight}>Stock actual</th>
                <th className={sr.thRight}>Mínimo</th>
                <th className={sr.thRight}>Punto pedido</th>
                <th className={sr.th}>Estado</th>
                <th className={`${sr.th} min-w-0 max-w-[14rem]`}>
                  Último movimiento
                </th>
                <th className={`${sr.thRight} ${srSticky.thActions}`}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className={sr.empty}>
                  No hay productos. Añádelos desde Catálogo.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const status = getStockStatus(p);
                const statusDark = STOCK_STATUS_STYLES_DARK[status];
                const usesStock = productTypeUsesStock(
                  p.product_type ?? "ecommerce",
                  p.track_stock
                );
                const lastMov = lastMovementByProduct[p.id];

                return (
                  <tr key={p.id} className={`group ${sr.tr}`}>
                    <td className={`${sr.tdLead} min-w-0 max-w-[14rem] sm:max-w-[18rem]`}>
                      <span
                        className="block truncate"
                        title={p.name ?? undefined}
                      >
                        {p.name ?? "—"}
                      </span>
                    </td>
                    <td className={`${sr.tdMono} max-w-[10rem] break-all`}>
                      {p.sku ?? "—"}
                    </td>
                    <td className={sr.tdRight}>
                      {usesStock ? (p.stock ?? 0) : "—"}
                    </td>
                    <td className={sr.tdRight}>
                      {usesStock ? (p.min_stock ?? "—") : "—"}
                    </td>
                    <td className={sr.tdRight}>
                      {usesStock ? (p.reorder_point ?? "—") : "—"}
                    </td>
                    <td className={sr.td}>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusDark}`}
                      >
                        {STOCK_STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className={`${sr.td} min-w-0 max-w-[14rem]`}>
                      {lastMov ? (
                        <span className="block text-xs leading-snug text-zinc-500">
                          {STOCK_MOVEMENT_TYPE_LABELS[lastMov.movement_type as keyof typeof STOCK_MOVEMENT_TYPE_LABELS] ??
                            lastMov.movement_type}{" "}
                          · {formatDate(lastMov.created_at)}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className={`${sr.actions} ${srSticky.tdActions}`}>
                      <div className={`${sr.actionsInner} gap-x-3`}>
                        <button
                          type="button"
                          onClick={() => setDetailProduct(p)}
                          className={`${sr.actionPrimary} text-xs`}
                        >
                          Ver detalle
                        </button>
                        {usesStock && (
                          <>
                            <button
                              type="button"
                              onClick={() => setRegisterProduct(p)}
                              className={`${sr.actionSuccess} text-xs`}
                            >
                              Registrar movimiento
                            </button>
                            <button
                              type="button"
                              onClick={() => setHistoryProduct(p)}
                              className={`${sr.actionMuted} text-xs`}
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
