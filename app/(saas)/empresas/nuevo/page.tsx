import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAllModules, getModuleSections } from "@/lib/config/company-modules-service";
import { getAllDashboardWidgets } from "@/lib/config/company-dashboard-service";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function NuevoClientePage() {
  const session = await getSession();
  if (!session.profile?.is_super_admin) {
    redirect("/empresas");
  }
  const [modules, widgets] = await Promise.all([
    getAllModules(),
    getAllDashboardWidgets(),
  ]);

  const sectionsByModule: Record<string, Awaited<ReturnType<typeof getModuleSections>>> = {};
  for (const m of modules) {
    sectionsByModule[m.id] = await getModuleSections(m.id);
  }

  return (
    <main className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link
          href="/empresas"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Volver a Empresas
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">
          Alta de nuevo cliente
        </h1>
        <p className="mt-2 text-zinc-600">
          Configura el ERP completo del cliente y crea su administrador principal.
        </p>
      </div>

      <OnboardingWizard
        modules={modules}
        sectionsByModule={sectionsByModule}
        widgets={widgets}
      />
    </main>
  );
}
