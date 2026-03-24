import { dbFrom } from "@/lib/db/schema";
/**
 * Servicio de templates por tipo de empresa.
 * Aplica configuración base al crear una empresa según su tipo.
 */

import { getSupabaseClient } from "@/lib/supabase";
import type { CompanyType } from "@/lib/types/database";

interface TemplateModule {
  code: string;
  is_enabled: boolean;
  sort_order: number;
}

interface TemplateSection {
  module_code: string;
  section_code: string;
  is_enabled: boolean;
  sort_order: number;
}

interface TemplateWidget {
  code: string;
  is_enabled: boolean;
  sort_order: number;
}

const TEMPLATES: Record<
  Exclude<CompanyType, "personalizado">,
  { modules: TemplateModule[]; sections: TemplateSection[]; widgets: TemplateWidget[] }
> = {
  ecommerce: {
    modules: [
      { code: "dashboard", is_enabled: true, sort_order: 10 },
      { code: "productos", is_enabled: true, sort_order: 20 },
      { code: "usuarios", is_enabled: true, sort_order: 30 },
    ],
    sections: [
      { module_code: "productos", section_code: "catalogo", is_enabled: true, sort_order: 10 },
      { module_code: "productos", section_code: "stock", is_enabled: true, sort_order: 20 },
    ],
    widgets: [
      { code: "ventas_dia", is_enabled: true, sort_order: 10 },
      { code: "ventas_mes", is_enabled: true, sort_order: 20 },
      { code: "top_productos", is_enabled: true, sort_order: 30 },
    ],
  },
  inmobiliaria: {
    modules: [
      { code: "dashboard", is_enabled: true, sort_order: 10 },
      { code: "productos", is_enabled: true, sort_order: 20 },
    ],
    sections: [
      { module_code: "productos", section_code: "catalogo", is_enabled: true, sort_order: 10 },
    ],
    widgets: [
      { code: "propiedades_vistas", is_enabled: true, sort_order: 10 },
      { code: "consultas", is_enabled: true, sort_order: 20 },
    ],
  },
  servicios: {
    modules: [{ code: "dashboard", is_enabled: true, sort_order: 10 }],
    sections: [],
    widgets: [
      { code: "ventas_dia", is_enabled: true, sort_order: 10 },
      { code: "ventas_mes", is_enabled: true, sort_order: 20 },
    ],
  },
};

/**
 * Aplica el template correspondiente al tipo de empresa.
 * Inserta en company_modules, company_module_sections, company_dashboard_widgets.
 */
export async function applyCompanyTemplate(
  companyId: string,
  companyType: CompanyType
): Promise<{ ok: boolean; error?: string }> {
  if (companyType === "personalizado") {
    return { ok: true };
  }

  const template = TEMPLATES[companyType];
  if (!template) return { ok: true };

  try {
    const supabase = await getSupabaseClient();

    // Resolver IDs de módulos
    const { data: modules } = await dbFrom(supabase, "modules")
      .select("id, code")
      .in("code", [...new Set([...template.modules.map((m) => m.code)])]);
    const moduleByCode = new Map((modules ?? []).map((m) => [m.code, m.id]));

    // Resolver IDs de module_sections
    const moduleIdsForSections = [...new Set(template.sections.map((s) => s.module_code))];
    const { data: modsForSections } = await dbFrom(supabase, "modules")
      .select("id, code")
      .in("code", moduleIdsForSections);
    const moduleIdByCode = new Map((modsForSections ?? []).map((m) => [m.code, m.id]));

    const sectionIds: { module_section_id: string; is_enabled: boolean; sort_order: number }[] = [];
    for (const s of template.sections) {
      const moduleId = moduleIdByCode.get(s.module_code);
      if (!moduleId) continue;
      const { data: sec } = await dbFrom(supabase, "module_sections")
        .select("id")
        .eq("module_id", moduleId)
        .eq("code", s.section_code)
        .single();
      if (sec) {
        sectionIds.push({
          module_section_id: sec.id,
          is_enabled: s.is_enabled,
          sort_order: s.sort_order,
        });
      }
    }

    // Resolver IDs de widgets
    const { data: widgets } = await dbFrom(supabase, "dashboard_widgets")
      .select("id, code")
      .in("code", template.widgets.map((w) => w.code));
    const widgetByCode = new Map((widgets ?? []).map((w) => [w.code, w.id]));

    // Insertar company_modules
    const companyModulesRows = template.modules
      .filter((m) => moduleByCode.has(m.code))
      .map((m) => ({
        company_id: companyId,
        module_id: moduleByCode.get(m.code)!,
        is_enabled: m.is_enabled,
        sort_order: m.sort_order,
      }));
    if (companyModulesRows.length > 0) {
      const { error: em } = await dbFrom(supabase, "company_modules").insert(companyModulesRows);
      if (em) {
        console.error("applyCompanyTemplate company_modules:", em);
        return { ok: false, error: "Error al aplicar módulos del template" };
      }
    }

    // Insertar company_module_sections
    if (sectionIds.length > 0) {
      const sectionRows = sectionIds.map((s) => ({
        company_id: companyId,
        module_section_id: s.module_section_id,
        is_enabled: s.is_enabled,
        sort_order: s.sort_order,
      }));
      const { error: es } = await dbFrom(supabase, "company_module_sections").insert(sectionRows);
      if (es) {
        console.error("applyCompanyTemplate company_module_sections:", es);
        return { ok: false, error: "Error al aplicar secciones del template" };
      }
    }

    // Insertar company_dashboard_widgets
    const widgetRows = template.widgets
      .filter((w) => widgetByCode.has(w.code))
      .map((w) => ({
        company_id: companyId,
        widget_id: widgetByCode.get(w.code)!,
        is_enabled: w.is_enabled,
        config: {},
        sort_order: w.sort_order,
      }));
    if (widgetRows.length > 0) {
      const { error: ew } = await dbFrom(supabase, "company_dashboard_widgets").insert(widgetRows);
      if (ew) {
        console.error("applyCompanyTemplate company_dashboard_widgets:", ew);
        return { ok: false, error: "Error al aplicar widgets del template" };
      }
    }

    return { ok: true };
  } catch (e) {
    console.error("applyCompanyTemplate:", e);
    return { ok: false, error: "Error al aplicar template" };
  }
}
