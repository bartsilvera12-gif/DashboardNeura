import Link from "next/link";
import { getCompanies } from "@/lib/config/company-config";
import { EmpresasList } from "./empresas-list";

export default async function EmpresasPage() {
  const companies = await getCompanies();

  return (
    <main>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Empresas</h1>
          <p className="mt-2 text-zinc-600">
            Crea empresas y define qué módulos, secciones, widgets y campos
            pueden visualizar. Panel Super Admin.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <EmpresasList companies={companies} />
      </div>
    </main>
  );
}
