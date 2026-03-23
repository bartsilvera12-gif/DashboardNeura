import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import {
  getOrdersPendingConfirmation,
  getOrdersConfirmed,
  getOrdersRejected,
  getOrdersForKanban,
  getOrderStats,
} from "@/lib/config/orders-service";
import { getProductsForCompany } from "@/lib/config/products-service";
import { PedidosTabs } from "./_components/pedidos-tabs";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const session = await getSession();
  const companyId =
    session.activeCompanyId ??
    (session.companies.length === 1 ? session.companies[0].id : null);

  if (!companyId) {
    return (
      <main>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Gestión de pedidos
        </h1>
        <p className="mt-2 text-zinc-600">
          Selecciona una empresa para gestionar pedidos.
        </p>
      </main>
    );
  }

  const [
    pendingOrders,
    confirmedOrders,
    rejectedOrders,
    kanbanOrders,
    stats,
    products,
  ] = await Promise.all([
    getOrdersPendingConfirmation(companyId),
    getOrdersConfirmed(companyId),
    getOrdersRejected(companyId),
    getOrdersForKanban(companyId),
    getOrderStats(companyId),
    getProductsForCompany(companyId),
  ]);

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">
        Gestión de pedidos
      </h1>
      <p className="mt-2 text-zinc-600">
        Pedidos pendientes de confirmación, ventas confirmadas y seguimiento
        operativo. El stock solo se descuenta al confirmar el pago.
      </p>

      <div className="mt-8">
        <Suspense
          fallback={
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-500">
              Cargando…
            </div>
          }
        >
          <PedidosTabs
            companyId={companyId}
            pendingOrders={pendingOrders}
            confirmedOrders={confirmedOrders}
            rejectedOrders={rejectedOrders}
            kanbanOrders={kanbanOrders}
            stats={stats}
            products={products}
          />
        </Suspense>
      </div>
    </main>
  );
}
