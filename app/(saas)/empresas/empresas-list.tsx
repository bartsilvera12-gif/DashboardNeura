"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { Company, CompanyType } from "@/lib/types/database";
import { toggleCompanyActiveAction } from "./actions";
import { sr, SaasStatusBadge } from "../_components/saas-report-table";

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
    <div className="space-y-6">

      {companies.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
          <p className="text-zinc-500">
            No hay empresas. Usa &quot;Alta nuevo cliente&quot; para dar de alta el primer cliente.
          </p>
        </div>
      ) : (
        <div className={`overflow-hidden ${sr.shell}`}>
          <div className={sr.scroll}>
            <table className={sr.table}>
              <thead>
                <tr className={sr.theadTr}>
                  <th className={sr.th}>Empresa</th>
                  <th className={sr.th}>Tipo</th>
                  <th className={sr.th}>Slug</th>
                  <th className={sr.th}>Estado</th>
                  <th className={sr.thRight}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className={sr.tr}>
                    <td className={sr.td}>
                      <div>
                        <span className="font-semibold text-zinc-100">
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
                    <td className={sr.tdMono}>{company.slug}</td>
                    <td className={sr.td}>
                      <SaasStatusBadge variant={company.is_active ? "active" : "inactive"}>
                        {company.is_active ? "Activa" : "Inactiva"}
                      </SaasStatusBadge>
                    </td>
                    <td className={sr.actions}>
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

