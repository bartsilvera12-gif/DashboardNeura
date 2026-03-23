import { getApiBaseUrl } from "@/lib/constants/api";
import { CopyButton } from "./_components/copy-button";

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
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
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

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Método
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                URL
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Descripción
              </th>
              <th className="w-20 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                Copiar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {ENDPOINTS.map((ep) => {
              const fullUrl = baseUrl + ep.path.replace(":id", ":orderId");
              return (
                <tr key={ep.path} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                        ep.method === "GET"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {ep.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-zinc-700">
                    {fullUrl}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {ep.description}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CopyButton text={fullUrl} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
