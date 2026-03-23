"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { Company, CompanyType } from "@/lib/types/database";
import { toggleCompanyActiveAction } from "./actions";

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
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-zinc-900">{company.name}</span>
                      {company.description && (
                        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                          {company.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {COMPANY_TYPE_LABELS[(company as Company & { company_type?: CompanyType }).company_type ?? "personalizado"]}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-zinc-600">{company.slug}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        company.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {company.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/empresas/${company.id}/configurar`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
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
      className="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
    >
      {pending ? "..." : isActive ? "Desactivar" : "Activar"}
    </button>
  );
}

