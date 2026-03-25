import Link from "next/link";
import { getCompanies } from "@/lib/config/company-config";
import { EmpresasList } from "./empresas-list";

export default async function EmpresasPage() {
  const companies = await getCompanies();

  return (
    <main className="min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Empresas</h1>
          <p className="mt-2 text-zinc-600">
            Centro de alta y configuración de clientes. Panel Super Admin.
          </p>
        </div>
        <Link
          href="/empresas/nuevo"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Alta nuevo cliente
        </Link>
      </div>

      <div className="mt-8">
        <EmpresasList companies={companies} />
      </div>
    </main>
  );
}
