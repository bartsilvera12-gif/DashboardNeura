import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getApiBaseUrl } from "@/lib/constants/api";
import { listApiKeys } from "@/lib/config/api-keys-service";
import { listApiLogs } from "@/lib/config/api-logs-service";
import { getCompanies } from "@/lib/config/company-config";
import { ApiDocumentationSection } from "./api-documentation-section";
import { ApiKeysSection } from "./api-keys-section";
import { EndpointsSection } from "./endpoints-section";
import { IntegrationsSection } from "./integrations-section";
import { LogsSection } from "./logs-section";

export const dynamic = "force-dynamic";

export default async function ApiIntegracionesPage() {
  const session = await getSession();

  if (!session.profile?.is_super_admin) {
    redirect("/dashboard");
  }

  const [apiKeys, companies, logs] = await Promise.all([
    listApiKeys(),
    getCompanies(),
    listApiLogs(100).catch(() => []),
  ]);

  const baseUrl = getApiBaseUrl();

  return (
    <main className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          API e Integraciones
        </h1>
        <p className="mt-2 text-zinc-600">
          Gestiona la API pública del ERP, claves de acceso y monitorea el uso.
        </p>
      </div>

      <ApiKeysSection
        apiKeys={apiKeys}
        companies={companies}
        baseUrl={baseUrl}
      />

      <ApiDocumentationSection />

      <EndpointsSection />

      <IntegrationsSection />

      <LogsSection logs={logs ?? []} />
    </main>
  );
}
