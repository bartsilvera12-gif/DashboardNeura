import type { ApiLogRow } from "@/lib/config/api-logs-service";
import { sr, SaasStatusBadge } from "../_components/saas-report-table";

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
        <div className={`mt-4 ${sr.emptyBox}`}>
          No hay logs aún. Las llamadas a la API se registrarán aquí.
        </div>
      ) : (
        <div className={`mt-4 ${sr.shell}`}>
          <div className={sr.scroll}>
            <table className={sr.table}>
              <thead>
                <tr className={sr.theadTr}>
                  <th className={sr.th}>Empresa</th>
                  <th className={sr.th}>Endpoint</th>
                  <th className={sr.th}>Fecha</th>
                  <th className={sr.th}>Resultado</th>
                  <th className={sr.th}>Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className={sr.tr}>
                    <td className={sr.tdLead}>{log.company_name ?? "—"}</td>
                    <td className={sr.td}>
                      <span className="font-mono text-xs text-zinc-500">
                        {log.method} {log.endpoint}
                      </span>
                    </td>
                    <td className={sr.td}>{formatDate(log.created_at)}</td>
                    <td className={sr.td}>
                      <SaasStatusBadge variant={log.success ? "success" : "error"}>
                        {log.success ? "OK" : "Error"} ({log.status_code})
                      </SaasStatusBadge>
                    </td>
                    <td
                      className={`${sr.td} max-w-[200px] truncate text-xs text-zinc-500`}
                    >
                      {log.error_message ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
