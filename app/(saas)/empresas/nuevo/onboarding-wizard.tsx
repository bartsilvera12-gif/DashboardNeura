"use client";

import { useState } from "react";
import type { DashboardWidget, Module, ModuleSection } from "@/lib/types/database";
import type { CompanyType } from "@/lib/types/database";
import { onboardingAction } from "./actions";

const STEPS = [
  { id: 1, title: "Empresa", short: "Empresa" },
  { id: 2, title: "Responsable y admin", short: "Admin" },
  { id: 3, title: "Módulos y secciones", short: "Módulos" },
  { id: 4, title: "Dashboard y widgets", short: "Widgets" },
  { id: 5, title: "Branding", short: "Branding" },
  { id: 6, title: "Confirmación", short: "Confirmar" },
];

const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "inmobiliaria", label: "Inmobiliaria" },
  { value: "servicios", label: "Servicios" },
  { value: "personalizado", label: "Personalizado" },
];

interface OnboardingWizardProps {
  modules: Module[];
  sectionsByModule: Record<string, ModuleSection[]>;
  widgets: DashboardWidget[];
}

export function OnboardingWizard({
  modules,
  sectionsByModule,
  widgets,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    company: {
      name: "",
      slug: "",
      company_type: "personalizado" as CompanyType,
      description: "",
      is_active: true,
      contact_name: "",
      contact_phone: "",
    },
    admin: {
      email: "",
      password: "",
      full_name: "",
    },
    modules: {} as Record<string, boolean>,
    sections: {} as Record<string, boolean>,
    widgets: {} as Record<string, boolean>,
    branding: {
      display_name: "",
      primary_color: "#18181b",
      logo_url: "",
    },
  });

  const updateCompany = (updates: Partial<typeof formData.company>) =>
    setFormData((d) => ({ ...d, company: { ...d.company, ...updates } }));
  const updateAdmin = (updates: Partial<typeof formData.admin>) =>
    setFormData((d) => ({ ...d, admin: { ...d.admin, ...updates } }));
  const updateBranding = (updates: Partial<typeof formData.branding>) =>
    setFormData((d) => ({ ...d, branding: { ...d.branding, ...updates } }));

  const toggleModule = (id: string) =>
    setFormData((d) => ({
      ...d,
      modules: { ...d.modules, [id]: !d.modules[id] },
    }));
  const toggleSection = (id: string) =>
    setFormData((d) => ({
      ...d,
      sections: { ...d.sections, [id]: !d.sections[id] },
    }));
  const toggleWidget = (id: string) =>
    setFormData((d) => ({
      ...d,
      widgets: { ...d.widgets, [id]: !d.widgets[id] },
    }));

  const canNext = () => {
    if (step === 1) {
      return formData.company.name.trim() && formData.company.slug.trim();
    }
    if (step === 2) {
      return (
        formData.admin.email.trim() &&
        formData.admin.password.length >= 6 &&
        formData.admin.full_name.trim()
      );
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const slug = formData.company.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const enabledModules = modules.filter((m) => formData.modules[m.id] !== false);
    const enabledSections = modules.flatMap((m) => {
      if (formData.modules[m.id] === false) return [];
      const secs = sectionsByModule[m.id] ?? [];
      return secs.filter((s) => formData.sections[s.id] !== false);
    });
    const enabledWidgets = widgets.filter((w) => formData.widgets[w.id] !== false);

    try {
      const result = await onboardingAction({
        company: {
          ...formData.company,
          slug,
          modules: enabledModules.map((m, i) => ({
            module_id: m.id,
            is_enabled: true,
            sort_order: i,
          })),
          sections: enabledSections.map((s, i) => ({
            module_section_id: s.id,
            is_enabled: true,
            sort_order: i,
          })),
          widgets: enabledWidgets.map((w, i) => ({
            widget_id: w.id,
            is_enabled: true,
            sort_order: i,
          })),
          branding: {
            display_name: formData.branding.display_name.trim() || null,
            primary_color: formData.branding.primary_color.trim() || null,
            logo_url: formData.branding.logo_url.trim() || null,
          },
        },
        admin: formData.admin,
      });

      if (result && !result.ok) {
        setError(result.error ?? "Error al crear el cliente");
      } else if (result == null) {
        setError("No se recibió respuesta del servidor");
      }
    } catch (e) {
      // Next.js redirect() lanza un error especial - no mostrarlo como error de usuario
      if (e && typeof e === "object" && "digest" in e && String((e as { digest?: string }).digest ?? "").includes("NEXT_REDIRECT")) {
        throw e;
      }
      const errMsg = e instanceof Error ? e.message : e != null ? String(e) : "Error inesperado";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              step === s.id
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {s.id}. {s.short}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        {step === 1 && (
          <StepEmpresa data={formData.company} onChange={updateCompany} />
        )}
        {step === 2 && (
          <StepResponsableAdmin
            companyData={{ contact_name: formData.company.contact_name, contact_phone: formData.company.contact_phone }}
            adminData={formData.admin}
            onCompanyChange={(u) => setFormData((d) => ({ ...d, company: { ...d.company, ...u } }))}
            onAdminChange={updateAdmin}
          />
        )}
        {step === 3 && (
          <StepModulos
            modules={modules}
            sectionsByModule={sectionsByModule}
            modulesState={formData.modules}
            sectionsState={formData.sections}
            onToggleModule={toggleModule}
            onToggleSection={toggleSection}
          />
        )}
        {step === 4 && (
          <StepWidgets
            widgets={widgets}
            widgetsState={formData.widgets}
            onToggle={toggleWidget}
          />
        )}
        {step === 5 && (
          <StepBranding data={formData.branding} onChange={updateBranding} />
        )}
        {step === 6 && (
          <StepConfirmacion formData={formData} modules={modules} widgets={widgets} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Anterior
        </button>
        {step < 6 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(6, s + 1))}
            disabled={!canNext()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Creando cliente..." : "Dar de alta cliente"}
          </button>
        )}
      </div>

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

function StepEmpresa({
  data,
  onChange,
}: {
  data: {
    name: string;
    slug: string;
    company_type: CompanyType;
    description: string;
    is_active: boolean;
  };
  onChange: (u: Partial<typeof data>) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900">Datos de la empresa</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Nombre *</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Mi Empresa S.L."
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Slug *</label>
          <input
            type="text"
            value={data.slug}
            onChange={(e) => onChange({ slug: e.target.value })}
            placeholder="mi-empresa"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Tipo</label>
          <select
            value={data.company_type}
            onChange={(e) => onChange({ company_type: e.target.value as CompanyType })}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            {COMPANY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="is_active"
            checked={data.is_active}
            onChange={(e) => onChange({ is_active: e.target.checked })}
            className="h-4 w-4 rounded"
          />
          <label htmlFor="is_active" className="text-sm text-zinc-700">
            Empresa activa
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700">Descripción</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          placeholder="Breve descripción..."
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}

function StepResponsableAdmin({
  companyData,
  adminData,
  onCompanyChange,
  onAdminChange,
}: {
  companyData: { contact_name: string; contact_phone: string };
  adminData: { email: string; password: string; full_name: string };
  onCompanyChange: (u: Partial<typeof companyData>) => void;
  onAdminChange: (u: Partial<typeof adminData>) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900">Responsable y admin principal</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Nombre del responsable / contacto
          </label>
          <input
            type="text"
            value={companyData.contact_name}
            onChange={(e) => onCompanyChange({ contact_name: e.target.value })}
            placeholder="Juan Pérez"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Teléfono</label>
          <input
            type="tel"
            value={companyData.contact_phone}
            onChange={(e) => onCompanyChange({ contact_phone: e.target.value })}
            placeholder="+34 600 000 000"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <hr className="border-zinc-200" />
      <div className="space-y-4">
        <h3 className="font-medium text-zinc-900">Admin principal del cliente</h3>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Correo *</label>
          <input
            type="email"
            value={adminData.email}
            onChange={(e) => onAdminChange({ email: e.target.value })}
            placeholder="admin@cliente.com"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Contraseña inicial * (mín. 6 caracteres)
          </label>
          <input
            type="password"
            value={adminData.password}
            onChange={(e) => onAdminChange({ password: e.target.value })}
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Nombre completo *</label>
          <input
            type="text"
            value={adminData.full_name}
            onChange={(e) => onAdminChange({ full_name: e.target.value })}
            placeholder="Admin Cliente"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

function StepModulos({
  modules,
  sectionsByModule,
  modulesState,
  sectionsState,
  onToggleModule,
  onToggleSection,
}: {
  modules: Module[];
  sectionsByModule: Record<string, ModuleSection[]>;
  modulesState: Record<string, boolean>;
  sectionsState: Record<string, boolean>;
  onToggleModule: (id: string) => void;
  onToggleSection: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900">Módulos y secciones</h2>
      <p className="text-sm text-zinc-500">
        Selecciona qué módulos y secciones verá el cliente en su ERP.
      </p>
      <div className="space-y-4">
        {modules.map((m) => {
          const sections = sectionsByModule[m.id] ?? [];
          const enabled = modulesState[m.id] !== false;
          return (
            <div
              key={m.id}
              className="rounded-lg border border-zinc-200 p-4"
            >
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => onToggleModule(m.id)}
                  className="h-4 w-4 rounded"
                />
                <span className="font-medium text-zinc-900">{m.name}</span>
                <span className="text-sm text-zinc-500">{m.path}</span>
              </label>
              {sections.length > 0 && enabled && (
                <div className="mt-3 space-y-2 pl-7">
                  {sections.map((s) => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sectionsState[s.id] !== false}
                        onChange={() => onToggleSection(s.id)}
                        className="h-3.5 w-3.5 rounded"
                      />
                      <span className="text-sm text-zinc-600">{s.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepWidgets({
  widgets,
  widgetsState,
  onToggle,
}: {
  widgets: DashboardWidget[];
  widgetsState: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  if (widgets.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Dashboard y widgets</h2>
        <p className="mt-2 text-zinc-500">No hay widgets configurados.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900">Widgets del dashboard</h2>
      <p className="text-sm text-zinc-500">
        Selecciona qué widgets verá el cliente en su dashboard.
      </p>
      <div className="space-y-2">
        {widgets.map((w) => (
          <label
            key={w.id}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50"
          >
            <div>
              <span className="font-medium text-zinc-900">{w.name}</span>
              {w.description && (
                <p className="text-sm text-zinc-500">{w.description}</p>
              )}
            </div>
            <input
              type="checkbox"
              checked={widgetsState[w.id] !== false}
              onChange={() => onToggle(w.id)}
              className="h-4 w-4 rounded"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function StepBranding({
  data,
  onChange,
}: {
  data: { display_name: string; primary_color: string; logo_url: string };
  onChange: (u: Partial<typeof data>) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900">Branding inicial</h2>
      <p className="text-sm text-zinc-500">
        Identidad visual que verá el cliente al iniciar sesión.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Nombre comercial
          </label>
          <input
            type="text"
            value={data.display_name}
            onChange={(e) => onChange({ display_name: e.target.value })}
            placeholder="Nombre en el dashboard"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Color principal (hex)
          </label>
          <input
            type="text"
            value={data.primary_color}
            onChange={(e) => onChange({ primary_color: e.target.value })}
            placeholder="#18181b"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-zinc-700">URL del logo</label>
          <input
            type="url"
            value={data.logo_url}
            onChange={(e) => onChange({ logo_url: e.target.value })}
            placeholder="https://..."
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

function StepConfirmacion({
  formData,
  modules,
  widgets,
}: {
  formData: {
    company: { name: string; slug: string; company_type: string; contact_name: string; contact_phone: string };
    admin: { email: string; full_name: string };
    modules: Record<string, boolean>;
    widgets: Record<string, boolean>;
    branding: { display_name: string; primary_color: string };
  };
  modules: Module[];
  widgets: DashboardWidget[];
}) {
  const c = formData.company;
  const a = formData.admin;
  const enabledMods = modules.filter((m) => formData.modules[m.id] !== false);
  const enabledWidgs = widgets.filter((w) => formData.widgets[w.id] !== false);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900">Confirmación</h2>
      <p className="text-sm text-zinc-500">
        Revisa los datos antes de dar de alta al cliente.
      </p>
      <div className="space-y-4 text-sm">
        <div>
          <span className="font-medium text-zinc-500">Empresa:</span> {c.name} ({c.slug})
        </div>
        <div>
          <span className="font-medium text-zinc-500">Tipo:</span> {c.company_type}
        </div>
        <div>
          <span className="font-medium text-zinc-500">Contacto:</span> {c.contact_name || "-"} /{" "}
          {c.contact_phone || "-"}
        </div>
        <div>
          <span className="font-medium text-zinc-500">Admin:</span> {a.email} ({a.full_name})
        </div>
        <div>
          <span className="font-medium text-zinc-500">Módulos:</span>{" "}
          {enabledMods.map((m) => m.name).join(", ") || "Ninguno"}
        </div>
        <div>
          <span className="font-medium text-zinc-500">Widgets:</span>{" "}
          {enabledWidgs.map((w) => w.name).join(", ") || "Ninguno"}
        </div>
        <div>
          <span className="font-medium text-zinc-500">Branding:</span>{" "}
          {formData.branding.display_name || formData.branding.primary_color || "Por defecto"}
        </div>
      </div>
    </div>
  );
}
