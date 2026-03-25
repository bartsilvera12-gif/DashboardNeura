"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CatalogoSection } from "./catalogo-section";
import { StockSection } from "./stock-section";
import { CategoriesSection } from "./categories-section";
import type { ResolvedProductColumn } from "@/lib/config/product-column-types";
import type { Product } from "@/lib/types/product";
import type { CompanyCategory } from "@/lib/config/company-categories-service";
import type { StockMovementView } from "@/lib/constants/stock-movements";

interface ProductosTabsProps {
  companyId: string;
  products: Product[];
  catalogoColumns: ResolvedProductColumn[];
  stockColumns: ResolvedProductColumn[];
  categories: CompanyCategory[];
  lastMovementByProduct?: Record<string, StockMovementView>;
}

export function ProductosTabs({
  companyId,
  products,
  catalogoColumns,
  stockColumns,
  categories,
  lastMovementByProduct = {},
}: ProductosTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const openFormParam = searchParams.get("openForm") === "1";
  const [tab, setTab] = useState<"catalogo" | "stock" | "categorias">("catalogo");
  const [openForm, setOpenForm] = useState(false);
  const [fromProducto, setFromProducto] = useState(false);

  useEffect(() => {
    if (tabParam === "categorias" || tabParam === "catalogo" || tabParam === "stock") {
      setTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (openFormParam) setOpenForm(true);
  }, [openFormParam]);

  const handleSwitchToCategories = () => {
    setFromProducto(true);
    setTab("categorias");
  };

  const handleReturnToProductForm = () => {
    setFromProducto(false);
    setTab("catalogo");
    setOpenForm(true);
  };

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap gap-1 border-b border-zinc-200 sm:mb-4 sm:gap-2">
        <button
          type="button"
          onClick={() => setTab("catalogo")}
          className={`border-b-2 px-3 py-1.5 text-sm font-medium sm:px-4 sm:py-2 ${
            tab === "catalogo"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Catálogo
        </button>
        <button
          type="button"
          onClick={() => setTab("stock")}
          className={`border-b-2 px-3 py-1.5 text-sm font-medium sm:px-4 sm:py-2 ${
            tab === "stock"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Stock
        </button>
        <button
          type="button"
          onClick={() => setTab("categorias")}
          className={`border-b-2 px-3 py-1.5 text-sm font-medium sm:px-4 sm:py-2 ${
            tab === "categorias"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Categorías
        </button>
      </div>

      {tab === "catalogo" && (
        <CatalogoSection
          companyId={companyId}
          products={products}
          columns={catalogoColumns}
          stockColumns={stockColumns}
          categories={categories}
          openFormOnMount={openForm}
          onOpenFormChange={setOpenForm}
          onSwitchToCategories={handleSwitchToCategories}
        />
      )}
      {tab === "stock" && (
        <StockSection
          companyId={companyId}
          products={products}
          columns={stockColumns}
          lastMovementByProduct={lastMovementByProduct}
        />
      )}
      {tab === "categorias" && (
        <CategoriesSection
          companyId={companyId}
          categories={categories}
          fromProducto={fromProducto}
          onReturnToProductForm={handleReturnToProductForm}
        />
      )}
    </div>
  );
}
