"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type {
  CompanyBranding,
  DashboardWidget,
  Module,
  ModuleSection,
} from "@/lib/types/database";
import type { FormDefinitionWithFields } from "@/lib/config/company-forms-service";
import {
  saveModulesConfigAction,
  saveWidgetsConfigAction,
  saveFormFieldsConfigAction,
  saveBrandingConfigAction,
  saveProductColumnsConfigAction,
  type SaveModulesInput,
  type SaveWidgetsInput,
  type SaveFormFieldsInput,
  type SaveProductColumnsInput,
} from "./actions";
import type { ProductColumnConfigInput } from "@/lib/config/product-column-types";

interface CompanyConfigPanelProps {
  companyId: string;
  companyName: string;
  modules: Module[];
  sectionsByModule: Record<string, ModuleSection[]>;
  widgets: DashboardWidget[];
  formDefinitions: FormDefinitionWithFields[];
  branding: CompanyBranding | null;
  currentConfig: {
    modules: Record<string, { is_enabled: boolean; sort_order: number }>;
    sections: Record<string, { is_enabled: boolean; sort_order: number }>;
    widgets: Record<
      string,
      { is_enabled: boolean; config: Record<string, unknown>; sort_order: number }
    >;
    formFields: Record<
      string,
      { is_visible: boolean; is_required: boolean; is_editable: boolean; sort_order: number }
    >;
  };
  productColumns: Array<ProductColumnConfigInput & { key: string }>;
}

type TabId = "modulos" | "dashboard" | "formularios" | "productos" | "branding";

function SaveButton({ label, savingLabel = "Guardando..." }: { label: string; savingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
    >
      {pending ? savingLabel : label}
    </button>
  );
}

export function CompanyConfigPanel({
  companyId,
  modules,
  sectionsByModule,
  widgets,
  formDefinitions,
  branding,
  currentConfig,
  productColumns,
}: CompanyConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("modulos");

  const tabs: { id: TabId; label: string }[] = [
    { id: "modulos", label: "Módulos" },
    { id: "dashboard", label: "Dashboard" },
    { id: "formularios", label: "Formularios" },
    { id: "productos", label: "Productos" },
    { id: "branding", label: "Branding" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex flex-wrap gap-1 sm:gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "modulos" && (
        <ModulosSection
          companyId={companyId}
          modules={modules}
          sectionsByModule={sectionsByModule}
          currentConfig={currentConfig}
        />
      )}

      {activeTab === "dashboard" && (
        <DashboardSection
          companyId={companyId}
          widgets={widgets}
          currentConfig={currentConfig}
        />
      )}

      {activeTab === "formularios" && (
        <FormulariosSection
          companyId={companyId}
          formDefinitions={formDefinitions}
          currentConfig={currentConfig}
        />
      )}

      {activeTab === "productos" && (
        <ProductosSection
          companyId={companyId}
          productColumns={productColumns}
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
  currentConfig,
}: {
  companyId: string;
  modules: Module[];
  sectionsByModule: Record<string, ModuleSection[]>;
  currentConfig: CompanyConfigPanelProps["currentConfig"];
}) {
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    for (const m of modules) {
      state[m.id] = currentConfig.modules[m.id]?.is_enabled ?? true;
    }
    return state;
  });

  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    for (const m of modules) {
      for (const s of sectionsByModule[m.id] ?? []) {
        state[s.id] = currentConfig.sections[s.id]?.is_enabled ?? true;
      }
    }
    return state;
  });

  const [state, formAction] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, formData: FormData) => {
      const json = formData.get("config") as string;
      if (!json) return { ok: false, error: "Datos inválidos" };
      try {
        const input = JSON.parse(json) as SaveModulesInput;
        return await saveModulesConfigAction(companyId, input);
      } catch {
        return { ok: false, error: "Datos inválidos" };
      }
    },
    null
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const input: SaveModulesInput = {
      modules: modules.map((m, i) => ({
        module_id: m.id,
        is_enabled: moduleStates[m.id] ?? true,
        sort_order: i,
      })),
      sections: modules.flatMap((m) => {
        const sections = sectionsByModule[m.id] ?? [];
        const moduleEnabled = moduleStates[m.id] ?? true;
        return sections.map((s, i) => ({
          module_section_id: s.id,
          is_enabled: moduleEnabled && (sectionStates[s.id] ?? true),
          sort_order: i,
        }));
      }),
    };
    const form = e.currentTarget;
    const inputEl = form.querySelector('input[name="config"]') as HTMLInputElement;
    if (inputEl) inputEl.value = JSON.stringify(input);
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-zinc-900">Módulos y secciones</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Activa o desactiva los módulos y secciones que esta empresa verá en el menú.
      </p>

      <form action={formAction} onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input type="hidden" name="config" value="" />
        {modules.map((module) => {
          const sections = sectionsByModule[module.id] ?? [];
          return (
            <div
              key={module.id}
              className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50/50"
            >
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={moduleStates[module.id] ?? true}
                    onChange={(e) =>
                      setModuleStates((prev) => ({ ...prev, [module.id]: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <h3 className="font-medium text-zinc-900">{module.name}</h3>
                </div>
                <span className="text-sm text-zinc-500">{module.path}</span>
              </label>
              {sections.length > 0 && (
                <div className="mt-3 space-y-2 pl-7">
                  {sections.map((s) => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          (moduleStates[module.id] ?? true) && (sectionStates[s.id] ?? true)
                        }
                        onChange={(e) =>
                          setSectionStates((prev) => ({ ...prev, [s.id]: e.target.checked }))
                        }
                        disabled={!(moduleStates[module.id] ?? true)}
                        className="h-3.5 w-3.5 rounded border-zinc-300 disabled:opacity-50"
                      />
                      <span className="text-sm text-zinc-600">
                        {s.name} ({s.code})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="flex items-center gap-4 border-t border-zinc-200 pt-4">
          <SaveButton label="Guardar módulos y secciones" />
          {state?.ok === true && (
            <span className="text-sm text-emerald-600">Guardado correctamente</span>
          )}
          {state?.ok === false && (
            <span className="text-sm text-red-600">{state.error}</span>
          )}
        </div>
      </form>
    </div>
  );
}

function DashboardSection({
  companyId,
  widgets,
  currentConfig,
}: {
  companyId: string;
  widgets: DashboardWidget[];
  currentConfig: CompanyConfigPanelProps["currentConfig"];
}) {
  const [widgetStates, setWidgetStates] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    for (const w of widgets) {
      state[w.id] = currentConfig.widgets[w.id]?.is_enabled ?? true;
    }
    return state;
  });

  const [state, formAction] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, formData: FormData) => {
      const json = formData.get("config") as string;
      if (!json) return { ok: false, error: "Datos inválidos" };
      try {
        const input = JSON.parse(json) as SaveWidgetsInput;
        return await saveWidgetsConfigAction(companyId, input);
      } catch {
        return { ok: false, error: "Datos inválidos" };
      }
    },
    null
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const input: SaveWidgetsInput = {
      widgets: widgets.map((w, i) => ({
        widget_id: w.id,
        is_enabled: widgetStates[w.id] ?? true,
        sort_order: i,
      })),
    };
    const form = e.currentTarget;
    const inputEl = form.querySelector('input[name="config"]') as HTMLInputElement;
    if (inputEl) inputEl.value = JSON.stringify(input);
  };

  if (widgets.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <p className="text-zinc-500">No hay widgets configurados en el sistema.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-zinc-900">Widgets del dashboard</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Activa o desactiva los widgets que esta empresa verá en el dashboard.
      </p>

      <form action={formAction} onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input type="hidden" name="config" value="" />
        {widgets.map((w) => (
          <label
            key={w.id}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50/50"
          >
            <div>
              <span className="font-medium text-zinc-900">{w.name}</span>
              {w.description && (
                <p className="mt-0.5 text-sm text-zinc-500">{w.description}</p>
              )}
            </div>
            <input
              type="checkbox"
              checked={widgetStates[w.id] ?? true}
              onChange={(e) =>
                setWidgetStates((prev) => ({ ...prev, [w.id]: e.target.checked }))
              }
              className="h-4 w-4 rounded border-zinc-300"
            />
          </label>
        ))}

        <div className="flex items-center gap-4 border-t border-zinc-200 pt-4">
          <SaveButton label="Guardar widgets" />
          {state?.ok === true && (
            <span className="text-sm text-emerald-600">Guardado correctamente</span>
          )}
          {state?.ok === false && (
            <span className="text-sm text-red-600">{state.error}</span>
          )}
        </div>
      </form>
    </div>
  );
}

function FormulariosSection({
  companyId,
  formDefinitions,
  currentConfig,
}: {
  companyId: string;
  formDefinitions: FormDefinitionWithFields[];
  currentConfig: CompanyConfigPanelProps["currentConfig"];
}) {
  const allFields = formDefinitions.flatMap((fd) =>
    fd.fields.map((f) => ({ ...f, formDef: fd }))
  );

  const [fieldStates, setFieldStates] = useState<
    Record<string, { is_visible: boolean; is_required: boolean; is_editable: boolean }>
  >(() => {
    const state: Record<string, { is_visible: boolean; is_required: boolean; is_editable: boolean }> =
      {};
    for (const f of allFields) {
      const cfg = currentConfig.formFields[f.id];
      state[f.id] = {
        is_visible: cfg?.is_visible ?? f.default_visible,
        is_required: cfg?.is_required ?? f.default_required,
        is_editable: cfg?.is_editable ?? f.default_editable,
      };
    }
    return state;
  });

  const [state, formAction] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, formData: FormData) => {
      const json = formData.get("config") as string;
      if (!json) return { ok: false, error: "Datos inválidos" };
      try {
        const input = JSON.parse(json) as SaveFormFieldsInput;
        return await saveFormFieldsConfigAction(companyId, input);
      } catch {
        return { ok: false, error: "Datos inválidos" };
      }
    },
    null
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const input: SaveFormFieldsInput = {
      fields: allFields.map((f, i) => ({
        form_field_id: f.id,
        is_visible: fieldStates[f.id]?.is_visible ?? true,
        is_required: fieldStates[f.id]?.is_required ?? false,
        is_editable: fieldStates[f.id]?.is_editable ?? true,
        sort_order: i,
      })),
    };
    const form = e.currentTarget;
    const inputEl = form.querySelector('input[name="config"]') as HTMLInputElement;
    if (inputEl) inputEl.value = JSON.stringify(input);
  };

  if (formDefinitions.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <p className="text-zinc-500">No hay formularios definidos en el sistema.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-zinc-900">Campos de formularios</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Configura la visibilidad y requisitos de los campos por módulo.
      </p>

      <form action={formAction} onSubmit={handleSubmit} className="mt-6 space-y-6">
        <input type="hidden" name="config" value="" />
        {formDefinitions.map((fd) => (
          <div key={fd.id} className="rounded-lg border border-zinc-200 p-4">
            <h3 className="font-medium text-zinc-900">{fd.name}</h3>
            <p className="text-xs text-zinc-500">
              {fd.entity_code} / {fd.form_code}
            </p>
            <div className="mt-3 space-y-2">
              {fd.fields.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-100 bg-zinc-50/50 px-3 py-2"
                >
                  <span className="text-sm font-medium text-zinc-700">
                    {f.name} ({f.code})
                  </span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={fieldStates[f.id]?.is_visible ?? true}
                        onChange={(e) =>
                          setFieldStates((prev) => ({
                            ...prev,
                            [f.id]: { ...prev[f.id], is_visible: e.target.checked },
                          }))
                        }
                        className="h-3 w-3 rounded"
                      />
                      Visible
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={fieldStates[f.id]?.is_required ?? false}
                        onChange={(e) =>
                          setFieldStates((prev) => ({
                            ...prev,
                            [f.id]: { ...prev[f.id], is_required: e.target.checked },
                          }))
                        }
                        className="h-3 w-3 rounded"
                      />
                      Requerido
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-4 border-t border-zinc-200 pt-4">
          <SaveButton label="Guardar campos" />
          {state?.ok === true && (
            <span className="text-sm text-emerald-600">Guardado correctamente</span>
          )}
          {state?.ok === false && (
            <span className="text-sm text-red-600">{state.error}</span>
          )}
        </div>
      </form>
    </div>
  );
}

function ProductosSection({
  companyId,
  productColumns,
}: {
  companyId: string;
  productColumns: Array<ProductColumnConfigInput & { key: string }>;
}) {
  const [columnStates, setColumnStates] = useState<
    Record<string, { visible: boolean; editable: boolean; required: boolean; show_in_list: boolean; show_in_form: boolean; affects_stock: boolean; affects_dashboard: boolean }>
  >(() => {
    const state: Record<string, {
      visible: boolean;
      editable: boolean;
      required: boolean;
      show_in_list: boolean;
      show_in_form: boolean;
      affects_stock: boolean;
      affects_dashboard: boolean;
    }> = {};
    for (const c of productColumns) {
      state[c.key] = {
        visible: c.visible,
        editable: c.editable,
        required: c.required,
        show_in_list: c.show_in_list,
        show_in_form: c.show_in_form,
        affects_stock: c.affects_stock,
        affects_dashboard: c.affects_dashboard,
      };
    }
    return state;
  });

  const [state, formAction] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, formData: FormData) => {
      const json = formData.get("config") as string;
      if (!json) return { ok: false, error: "Datos inválidos" };
      try {
        const input = JSON.parse(json) as SaveProductColumnsInput;
        return await saveProductColumnsConfigAction(companyId, input);
      } catch {
        return { ok: false, error: "Datos inválidos" };
      }
    },
    null
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const input: SaveProductColumnsInput = {
      columns: productColumns.map((c, i) => {
        const v = columnStates[c.key]?.visible ?? c.visible;
        return {
          column_key: c.column_key,
          column_label: c.column_label,
          module_section: c.module_section,
          visible: v,
          editable: columnStates[c.key]?.editable ?? c.editable,
          required: columnStates[c.key]?.required ?? c.required,
          show_in_list: columnStates[c.key]?.show_in_list ?? c.show_in_list,
          show_in_form: columnStates[c.key]?.show_in_form ?? c.show_in_form,
          affects_stock: columnStates[c.key]?.affects_stock ?? c.affects_stock,
          affects_dashboard: columnStates[c.key]?.affects_dashboard ?? c.affects_dashboard,
          sort_order: i,
        };
      }),
    };
    const form = e.currentTarget;
    const inputEl = form.querySelector('input[name="config"]') as HTMLInputElement;
    if (inputEl) inputEl.value = JSON.stringify(input);
  };

  const catalogoCols = productColumns.filter((c) => c.module_section === "catalogo");
  const stockCols = productColumns.filter((c) => c.module_section === "stock");

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-zinc-900">Columnas de Productos</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Define qué columnas verá esta empresa en Catálogo y Stock. Los cambios se aplican al módulo Productos.
      </p>

      <form action={formAction} onSubmit={handleSubmit} className="mt-6 space-y-6">
        <input type="hidden" name="config" value="" />
        <div>
          <h3 className="mb-3 font-medium text-zinc-800">Catálogo</h3>
          <div className="space-y-2">
            {catalogoCols.map((c) => (
              <div
                key={c.key}
                className="flex flex-wrap items-center gap-4 rounded border border-zinc-100 px-3 py-2"
              >
                <span className="min-w-[140px] text-sm font-medium text-zinc-700">{c.column_label}</span>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={columnStates[c.key]?.visible ?? c.visible}
                    onChange={(e) =>
                      setColumnStates((prev) => ({
                        ...prev,
                        [c.key]: { ...prev[c.key], visible: e.target.checked },
                      }))
                    }
                    className="h-3 w-3"
                  />
                  Visible
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={columnStates[c.key]?.editable ?? c.editable}
                    onChange={(e) =>
                      setColumnStates((prev) => ({
                        ...prev,
                        [c.key]: { ...prev[c.key], editable: e.target.checked },
                      }))
                    }
                    className="h-3 w-3"
                  />
                  Editable
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={columnStates[c.key]?.required ?? c.required}
                    onChange={(e) =>
                      setColumnStates((prev) => ({
                        ...prev,
                        [c.key]: { ...prev[c.key], required: e.target.checked },
                      }))
                    }
                    className="h-3 w-3"
                  />
                  Obligatorio
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={columnStates[c.key]?.affects_dashboard ?? c.affects_dashboard}
                    onChange={(e) =>
                      setColumnStates((prev) => ({
                        ...prev,
                        [c.key]: { ...prev[c.key], affects_dashboard: e.target.checked },
                      }))
                    }
                    className="h-3 w-3"
                  />
                  Dashboard
                </label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-medium text-zinc-800">Stock</h3>
          <div className="space-y-2">
            {stockCols.map((c) => (
              <div
                key={c.key}
                className="flex flex-wrap items-center gap-4 rounded border border-zinc-100 px-3 py-2"
              >
                <span className="min-w-[140px] text-sm font-medium text-zinc-700">{c.column_label}</span>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={columnStates[c.key]?.visible ?? c.visible}
                    onChange={(e) =>
                      setColumnStates((prev) => ({
                        ...prev,
                        [c.key]: { ...prev[c.key], visible: e.target.checked },
                      }))
                    }
                    className="h-3 w-3"
                  />
                  Visible
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={columnStates[c.key]?.editable ?? c.editable}
                    onChange={(e) =>
                      setColumnStates((prev) => ({
                        ...prev,
                        [c.key]: { ...prev[c.key], editable: e.target.checked },
                      }))
                    }
                    className="h-3 w-3"
                  />
                  Editable
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={columnStates[c.key]?.affects_stock ?? c.affects_stock}
                    onChange={(e) =>
                      setColumnStates((prev) => ({
                        ...prev,
                        [c.key]: { ...prev[c.key], affects_stock: e.target.checked },
                      }))
                    }
                    className="h-3 w-3"
                  />
                  Stock
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={columnStates[c.key]?.affects_dashboard ?? c.affects_dashboard}
                    onChange={(e) =>
                      setColumnStates((prev) => ({
                        ...prev,
                        [c.key]: { ...prev[c.key], affects_dashboard: e.target.checked },
                      }))
                    }
                    className="h-3 w-3"
                  />
                  Dashboard
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 border-t border-zinc-200 pt-4">
          <SaveButton label="Guardar columnas de productos" />
          {state?.ok === true && (
            <span className="text-sm text-emerald-600">Guardado correctamente</span>
          )}
          {state?.ok === false && (
            <span className="text-sm text-red-600">{state.error}</span>
          )}
        </div>
      </form>
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
  const [state, formAction] = useActionState(
    async (_prev: { ok: boolean; error?: string } | null, formData: FormData) => {
      return await saveBrandingConfigAction(companyId, {
        display_name: (formData.get("display_name") as string) || null,
        logo_url: (formData.get("logo_url") as string) || null,
        primary_color: (formData.get("primary_color") as string) || null,
      });
    },
    null
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-zinc-900">Identidad visual</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Nombre comercial, logo y color principal que verá esta empresa.
      </p>

      <form action={formAction} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-zinc-700">
            Nombre comercial
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            defaultValue={branding?.display_name ?? ""}
            placeholder="Nombre que verá el cliente"
            className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div>
          <label htmlFor="primary_color" className="block text-sm font-medium text-zinc-700">
            Color principal (hex)
          </label>
          <input
            id="primary_color"
            name="primary_color"
            type="text"
            defaultValue={branding?.primary_color ?? "#18181b"}
            placeholder="#18181b"
            pattern="^#[0-9A-Fa-f]{6}$"
            title="Formato: #RRGGBB (ej: #18181b)"
            className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="logo_url" className="block text-sm font-medium text-zinc-700">
            URL del logo
          </label>
          <input
            id="logo_url"
            name="logo_url"
            type="url"
            defaultValue={branding?.logo_url ?? ""}
            placeholder="https://..."
            className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div className="flex items-center gap-4 sm:col-span-2">
          <SaveButton label="Guardar branding" />
          {state?.ok === true && (
            <span className="text-sm text-emerald-600">Guardado correctamente</span>
          )}
          {state?.ok === false && (
            <span className="text-sm text-red-600">{state.error}</span>
          )}
        </div>
      </form>
    </div>
  );
}
