"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { ApiKeyRow } from "@/lib/config/api-keys-service";
import type { Company } from "@/lib/types/database";
import {
  createApiKeyAction,
  toggleApiKeyAction,
  deleteApiKeyAction,
} from "./actions";
import { CopyButton } from "./_components/copy-button";

interface ApiKeysSectionProps {
  apiKeys: ApiKeyRow[];
  companies: Company[];
  baseUrl: string;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ApiKeysSection({ apiKeys, companies, baseUrl }: ApiKeysSectionProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<{
    key: string;
    prefix: string;
    companyName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setError(null);
    setCreatedKey(null);
    const result = await createApiKeyAction(formData);
    if (result.ok) {
      setCreatedKey({
        key: result.key,
        prefix: result.prefix,
        companyName: result.companyName,
      });
    } else {
      setError(result.error);
    }
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
    setCreatedKey(null);
    setError(null);
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">API Keys</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Gestiona las claves de acceso a la API pública. La clave completa solo
            se muestra al crearla.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Nueva API key
        </button>
      </div>

      {apiKeys.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
          No hay API keys. Crea una para conectar frontends externos.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Empresa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Prefijo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Último uso
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Creada
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {apiKeys.map((key) => (
                <tr key={key.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 text-sm text-zinc-900">
                    {key.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-700">
                    {key.company_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-zinc-600">
                    {key.key_prefix}...
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        key.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {key.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {formatDate(key.last_used_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {formatDate(key.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <form
                        action={toggleApiKeyAction.bind(null, key.id, !key.is_active)}
                        className="inline"
                      >
                        <ToggleButton
                          isActive={key.is_active}
                          label={key.is_active ? "Desactivar" : "Reactivar"}
                        />
                      </form>
                      <form
                        action={deleteApiKeyAction.bind(null, key.id)}
                        className="inline"
                        onSubmit={(e) => {
                          if (!confirm("¿Revocar esta API key? No se podrá recuperar.")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <DeleteButton />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {createModalOpen && (
        <CreateApiKeyModal
          baseUrl={baseUrl}
          companies={companies}
          createdKey={createdKey}
          error={error}
          onClose={closeCreateModal}
          onSubmit={handleCreate}
        />
      )}
    </section>
  );
}

function ToggleButton({
  isActive,
  label,
}: {
  isActive: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
    >
      {pending ? "..." : label}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      {pending ? "..." : "Revocar"}
    </button>
  );
}

interface CreateApiKeyModalProps {
  baseUrl: string;
  companies: Company[];
  createdKey: { key: string; prefix: string; companyName: string } | null;
  error: string | null;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

function CreateApiKeyModal({
  baseUrl,
  companies,
  createdKey,
  error,
  onClose,
  onSubmit,
}: CreateApiKeyModalProps) {
  if (createdKey) {
    const exampleFetch = `fetch("${baseUrl}/api/public/products", {
  headers: { "x-api-key": "${createdKey.key}" }
}).then(r => r.json())`;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-zinc-900">
            API key creada correctamente
          </h3>
          <p className="mt-2 text-sm text-amber-800">
            Guarda esta clave ahora. No volverá a mostrarse.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg bg-zinc-100 p-3 font-mono text-sm">
              {createdKey.key}
            </code>
            <CopyButton text={createdKey.key} className="shrink-0" />
          </div>
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-medium text-zinc-600">Ejemplo de uso:</p>
            <pre className="mt-1 overflow-x-auto text-xs text-zinc-700">
              {exampleFetch}
            </pre>
            <CopyButton
              text={exampleFetch}
              label="Copiar ejemplo"
              className="mt-2"
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-zinc-900">Nueva API key</h3>
        <form
          className="mt-4 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            await onSubmit(new FormData(form));
          }}
        >
          <div>
            <label
              htmlFor="company_id"
              className="block text-sm font-medium text-zinc-700"
            >
              Empresa
            </label>
            <select
              id="company_id"
              name="company_id"
              required
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            >
              <option value="">Selecciona una empresa</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-700"
            >
              Nombre (opcional)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Ej: Lovable producción"
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex gap-3 pt-2">
            <CreateSubmitButton />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? "Creando..." : "Crear API key"}
    </button>
  );
}
