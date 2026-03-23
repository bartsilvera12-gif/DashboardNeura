import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getDashboardProductStats } from "@/lib/config/dashboard-products-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const companyId =
    session.activeCompanyId ??
    (session.companies.length === 1 ? session.companies[0].id : null);

  const stats = companyId ? await getDashboardProductStats(companyId) : null;

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
      <p className="mt-2 text-zinc-600">
        Vista general del negocio: métricas, alertas y actividad reciente.
      </p>

      {stats && (stats.total > 0 || stats.activos > 0) && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-medium text-zinc-900">Productos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-zinc-500">Total productos</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{stats.total}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-zinc-500">Productos activos</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{stats.activos}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-zinc-500">Sin stock</p>
              <p className="mt-1 text-2xl font-semibold text-amber-600">{stats.sinStock}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase text-zinc-500">Stock bajo</p>
              <p className="mt-1 text-2xl font-semibold text-amber-500">{stats.stockBajo}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            {stats.destacados > 0 && (
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-2">
                <span className="text-sm text-zinc-600">Destacados: </span>
                <span className="font-medium">{stats.destacados}</span>
              </div>
            )}
            {stats.valorInventario != null && stats.valorInventario > 0 && (
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-2">
                <span className="text-sm text-zinc-600">Valor inventario: </span>
                <span className="font-medium">
                  {new Intl.NumberFormat("es-ES", {
                    style: "currency",
                    currency: "EUR",
                  }).format(stats.valorInventario)}
                </span>
              </div>
            )}
            {stats.categoriasTop.length > 0 && (
              <div className="rounded-lg border border-zinc-200 bg-white px-4 py-2">
                <span className="text-sm text-zinc-600">Categorías: </span>
                <span className="font-medium">
                  {stats.categoriasTop.map((c) => c.categoria).join(", ")}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Link
              href="/productos"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Ver módulo Productos →
            </Link>
          </div>
        </section>
      )}

      {(!stats || (stats.total === 0 && stats.activos === 0)) && companyId && (
        <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-medium text-zinc-900">Empezar</h2>
          <p className="mt-2 text-sm text-zinc-600">
            No hay datos de productos aún. Crea productos desde el módulo Catálogo
            para que aparezcan aquí.
          </p>
          <Link
            href="/productos"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Ir a Productos
          </Link>
        </section>
      )}
    </main>
  );
}
