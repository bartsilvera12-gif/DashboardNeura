"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Company } from "@/lib/types/database";
import { createCompanyAction, toggleCompanyActiveAction } from "./actions";

interface EmpresasListProps {
  companies: Company[];
}

export function EmpresasList({ companies }: EmpresasListProps) {
  return (
    <div className="space-y-4">
      <CreateCompanyForm />

      {companies.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
          No hay empresas. Crea la primera para comenzar.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-zinc-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                    {company.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {company.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        company.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {company.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
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
                        <button
                          type="submit"
                          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
                        >
                          {company.is_active ? "Desactivar" : "Activar"}
                        </button>
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

function CreateCompanyForm() {
  const [state, formAction] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, formData: FormData) => {
      const result = await createCompanyAction(formData);
      return result;
    },
    null
  );

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-4 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Mi Empresa"
          className="mt-1 block w-48 rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-zinc-700">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          placeholder="mi-empresa"
          className="mt-1 block w-48 rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Crear empresa
      </button>
      {state?.ok === false && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
