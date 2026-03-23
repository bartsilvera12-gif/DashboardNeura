import type { ApiLogRow } from "@/lib/config/api-logs-service";

interface LogsSectionProps {
  logs: ApiLogRow[];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LogsSection({ logs }: LogsSectionProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Logs de uso</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Registro reciente de llamadas a la API pública.
      </p>

      {!logs?.length ? (
        <div className="mt-4 rounded-lg border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
          No hay logs aún. Las llamadas a la API se registrarán aquí.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Endpoint
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Resultado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 text-sm text-zinc-700">
                    {log.company_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-zinc-600">
                      {log.method} {log.endpoint}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        log.success
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {log.success ? "OK" : "Error"} ({log.status_code})
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-xs text-zinc-500">
                    {log.error_message ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
