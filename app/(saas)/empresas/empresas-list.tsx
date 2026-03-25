"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { Company, CompanyType } from "@/lib/types/database";
import { toggleCompanyActiveAction } from "./actions";
import { sr, srSticky, SaasStatusBadge } from "../_components/saas-report-table";

interface EmpresasListProps {
  companies: Company[];
}

const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  ecommerce: "E-commerce",
  inmobiliaria: "Inmobiliaria",
  servicios: "Servicios",
  personalizado: "Personalizado",
};

export function EmpresasList({ companies }: EmpresasListProps) {
  return (
    <div className="min-w-0 space-y-6">

      {companies.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
          <p className="text-zinc-500">
            No hay empresas. Usa &quot;Alta nuevo cliente&quot; para dar de alta el primer cliente.
          </p>
        </div>
      ) : (
        <div className={sr.shell}>
          <div className={sr.scroll}>
            <table className={`${sr.table} min-w-max`}>
              <thead>
                <tr className={sr.theadTr}>
                  <th className={`${sr.th} min-w-0 max-w-[16rem]`}>Empresa</th>
                  <th className={sr.th}>Tipo</th>
                  <th className={`${sr.th} max-w-[12rem]`}>Slug</th>
                  <th className={sr.th}>Estado</th>
                  <th className={`${sr.thRight} ${srSticky.thActions}`}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className={`group ${sr.tr}`}>
                    <td className={`${sr.td} min-w-0 max-w-[16rem]`}>
                      <div>
                        <span
                          className="block truncate font-semibold text-zinc-100"
                          title={company.name}
                        >
                          {company.name}
                        </span>
                        {company.description && (
                          <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                            {company.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className={sr.td}>
                      {COMPANY_TYPE_LABELS[(company as Company & { company_type?: CompanyType }).company_type ?? "personalizado"]}
                    </td>
                    <td className={`${sr.tdMono} max-w-[12rem] break-all`}>
                      {company.slug}
                    </td>
                    <td className={sr.td}>
                      <SaasStatusBadge variant={company.is_active ? "active" : "inactive"}>
                        {company.is_active ? "Activa" : "Inactiva"}
                      </SaasStatusBadge>
                    </td>
                    <td className={`${sr.actions} ${srSticky.tdActions}`}>
                      <div className={sr.actionsInner}>
                        <Link
                          href={`/empresas/${company.id}/configurar`}
                          className={sr.actionPrimary}
                        >
                          Configurar
                        </Link>
                        <form
                          action={toggleCompanyActiveAction.bind(
                            null,
                            company.id,
                            !company.is_active
                          )}
                          className="inline"
                        >
                          <ToggleButton isActive={company.is_active} />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleButton({ isActive }: { isActive: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={sr.actionMuted}
    >
      {pending ? "..." : isActive ? "Desactivar" : "Activar"}
    </button>
  );
}

