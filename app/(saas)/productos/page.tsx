import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { getProductsForCompany } from "@/lib/config/products-service";
import { getCompanyProductColumnConfig } from "@/lib/config/product-column-config";
import { getCompanyCategories } from "@/lib/config/company-categories-service";
import { getStockMovementsByCompany } from "@/lib/config/stock-movements-service";
import { ProductosTabs } from "./_components/productos-tabs";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const session = await getSession();
  const companyId =
    session.activeCompanyId ??
    (session.companies.length === 1 ? session.companies[0].id : null);

  if (!companyId) {
    return (
      <main className="min-w-0">
        <h1 className="text-2xl font-semibold text-zinc-900">Productos</h1>
        <p className="mt-2 text-zinc-600">
          Selecciona una empresa para gestionar productos.
        </p>
      </main>
    );
  }

  const [products, catalogoColumns, stockColumns, categories, movements] =
    await Promise.all([
      getProductsForCompany(companyId),
      getCompanyProductColumnConfig(companyId, "catalogo"),
      getCompanyProductColumnConfig(companyId, "stock"),
      getCompanyCategories(companyId),
      getStockMovementsByCompany(companyId, 200),
    ]);

  const lastMovementByProduct = new Map<string, (typeof movements)[0]>();
  for (const m of movements) {
    if (!lastMovementByProduct.has(m.product_id)) {
      lastMovementByProduct.set(m.product_id, m);
    }
  }

  return (
    <main className="min-w-0">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
        Productos
      </h1>
      <p className="mt-1 max-w-3xl text-sm leading-snug text-zinc-600 sm:mt-1.5 sm:text-base">
        Área principal de administración operativa. Centraliza la gestión de
        productos e inventario en un solo lugar.
      </p>

      <div className="mt-4 sm:mt-5">
        <Suspense fallback={<div className=" rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-500">Cargando…</div>}>
          <ProductosTabs
            companyId={companyId}
            products={products}
            catalogoColumns={catalogoColumns}
            stockColumns={stockColumns}
            categories={categories}
            lastMovementByProduct={Object.fromEntries(lastMovementByProduct)}
          />
        </Suspense>
      </div>
    </main>
  );
}
