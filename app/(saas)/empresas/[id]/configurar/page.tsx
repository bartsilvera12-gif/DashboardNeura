import { notFound } from "next/navigation";
import Link from "next/link";
import { getCompanyById } from "@/lib/config/companies-service";
import { getAllModules, getModuleSections } from "@/lib/config/company-modules-service";
import { getCompanyBranding } from "@/lib/config/company-config";
import { CompanyConfigPanel } from "./company-config-panel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConfigurarEmpresaPage({ params }: PageProps) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const [modules, branding] = await Promise.all([
    getAllModules(),
    getCompanyBranding(id),
  ]);

  const sectionsByModule: Record<string, Awaited<ReturnType<typeof getModuleSections>>> = {};
  for (const m of modules) {
    sectionsByModule[m.id] = await getModuleSections(m.id);
  }

  return (
    <main>
      <div className="mb-6">
        <Link
          href="/empresas"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Volver a Empresas
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900">
        Configurar: {company.name}
      </h1>
      <p className="mt-2 text-zinc-600">
        Define módulos, secciones, dashboard, campos de formularios y branding
        para esta empresa.
      </p>

      <div className="mt-8">
        <CompanyConfigPanel
          companyId={id}
          companyName={company.name}
          modules={modules}
          sectionsByModule={sectionsByModule}
          branding={branding}
        />
      </div>
    </main>
  );
}
