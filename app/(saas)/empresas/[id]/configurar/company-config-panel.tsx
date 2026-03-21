"use client";

import { useState } from "react";
import type { CompanyBranding, Module, ModuleSection } from "@/lib/types/database";

interface CompanyConfigPanelProps {
  companyId: string;
  companyName: string;
  modules: Module[];
  sectionsByModule: Record<string, ModuleSection[]>;
  branding: CompanyBranding | null;
}

type TabId = "modulos" | "branding";

export function CompanyConfigPanel({
  companyId,
  companyName,
  modules,
  sectionsByModule,
  branding,
}: CompanyConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("modulos");

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("modulos")}
            className={`border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "modulos"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
            }`}
          >
            Módulos y secciones
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("branding")}
            className={`border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "branding"
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
            }`}
          >
            Branding
          </button>
        </nav>
      </div>

      {activeTab === "modulos" && (
        <ModulosSection
          companyId={companyId}
          modules={modules}
          sectionsByModule={sectionsByModule}
        />
      )}

      {activeTab === "branding" && (
        <BrandingSection companyId={companyId} branding={branding} />
      )}
    </div>
  );
}

function ModulosSection({
  companyId,
  modules,
  sectionsByModule,
}: {
  companyId: string;
  modules: Module[];
  sectionsByModule: Record<string, ModuleSection[]>;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-medium text-zinc-900">
        Módulos visibles para la empresa
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Activa o desactiva los módulos que esta empresa verá en el menú. Para
        cada módulo puedes configurar qué secciones internas están habilitadas.
      </p>
      <div className="mt-6 space-y-4">
        {modules.map((module) => {
          const sections = sectionsByModule[module.id] ?? [];
          return (
            <div
              key={module.id}
              className="rounded-md border border-zinc-200 p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-zinc-900">{module.name}</h3>
                <span className="text-sm text-zinc-500">{module.path}</span>
              </div>
              {sections.length > 0 && (
                <div className="mt-3 space-y-2 pl-4 border-l-2 border-zinc-200">
                  {sections.map((s) => (
                    <div
                      key={s.id}
                      className="text-sm text-zinc-600"
                    >
                      {s.name} ({s.code})
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-zinc-400">
                La configuración por empresa se guardará al implementar las
                acciones de guardado (próxima etapa).
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BrandingSection({
  companyId,
  branding,
}: {
  companyId: string;
  branding: CompanyBranding | null;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-medium text-zinc-900">Identidad visual</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Nombre comercial, logo y color principal que verá esta empresa al usar el
        sistema.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Nombre comercial
          </label>
          <input
            type="text"
            defaultValue={branding?.display_name ?? ""}
            placeholder="Nombre que verá el cliente"
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Color principal (hex)
          </label>
          <input
            type="text"
            defaultValue={branding?.primary_color ?? "#18181b"}
            placeholder="#18181b"
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700">
            URL del logo
          </label>
          <input
            type="text"
            defaultValue={branding?.logo_url ?? ""}
            placeholder="https://..."
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <p className="mt-4 text-xs text-zinc-400">
        El guardado de branding se implementará en la siguiente etapa con Server
        Actions.
      </p>
    </div>
  );
}
