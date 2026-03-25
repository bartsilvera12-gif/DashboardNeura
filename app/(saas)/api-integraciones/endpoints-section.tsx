import { getApiBaseUrl } from "@/lib/constants/api";
import { CopyButton } from "./_components/copy-button";
import { sr, srSticky, SaasMethodBadge } from "../_components/saas-report-table";

const ENDPOINTS = [
  { method: "GET", path: "/api/public/products", description: "Productos activos" },
  { method: "POST", path: "/api/public/orders", description: "Crear pedido" },
  {
    method: "POST",
    path: "/api/public/orders/:id/create-payment",
    description: "Crear intento de pago",
  },
  {
    method: "GET",
    path: "/api/public/orders/:id/payment-status",
    description: "Estado del pago (query: ?ref=PAY-xxx)",
  },
] as const;

export function EndpointsSection() {
  const baseUrl = getApiBaseUrl();

  return (
    <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">
        Endpoints públicos
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        URLs base para integrar con la API. Autenticación: header{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">
          x-api-key
        </code>{" "}
        o{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">
          Authorization: Bearer &lt;key&gt;
        </code>
      </p>

      <div className={`mt-4 ${sr.shell}`}>
        <div className={sr.scroll}>
            <table className={`${sr.table} min-w-max`}>
              <thead>
                <tr className={sr.theadTr}>
                  <th className={sr.th}>Método</th>
                  <th className={`${sr.th} min-w-0 max-w-[min(28rem,70vw)]`}>
                    URL
                  </th>
                  <th className={sr.th}>Descripción</th>
                  <th className={`${sr.thRight} w-24 ${srSticky.thActions}`}>
                    Copiar
                  </th>
                </tr>
              </thead>
              <tbody>
              {ENDPOINTS.map((ep) => {
                const fullUrl = baseUrl + ep.path.replace(":id", ":orderId");
                return (
                  <tr key={ep.path} className={`group ${sr.tr}`}>
                    <td className={sr.td}>
                      <SaasMethodBadge method={ep.method} />
                    </td>
                    <td className={`${sr.tdMono} min-w-0 max-w-[min(28rem,70vw)] break-all`}>
                      {fullUrl}
                    </td>
                    <td className={sr.td}>{ep.description}</td>
                    <td className={`${sr.actions} ${srSticky.tdActions}`}>
                      <CopyButton
                        text={fullUrl}
                        className="rounded border border-zinc-700 px-2 py-1 text-xs font-medium text-cyan-400 hover:bg-zinc-800"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
