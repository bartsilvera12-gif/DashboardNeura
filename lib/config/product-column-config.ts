/**
 * Configuración de columnas de productos por empresa (SERVER ONLY - usa getSupabaseClient).
 */

import { getSupabaseClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProductModuleSection,
  ResolvedProductColumn,
  ProductColumnConfigInput,
} from "./product-column-types";

export type {
  ProductModuleSection,
  ProductColumnConfig,
  ResolvedProductColumn,
  ProductColumnConfigInput,
} from "./product-column-types";

/** Columnas disponibles en products (maestro) */
export const PRODUCT_COLUMN_DEFINITIONS: Array<{
  key: string;
  label: string;
  section: ProductModuleSection;
  type: string;
  default_visible: boolean;
  default_editable: boolean;
  default_required: boolean;
  affects_stock: boolean;
  affects_dashboard: boolean;
}> = [
  { key: "product_type", label: "Tipo de producto", section: "catalogo", type: "product_type_select", default_visible: false, default_editable: true, default_required: false, affects_stock: true, affects_dashboard: true },
  { key: "name", label: "Nombre", section: "catalogo", type: "text", default_visible: true, default_editable: true, default_required: true, affects_stock: false, affects_dashboard: true },
  { key: "description", label: "Descripción", section: "catalogo", type: "textarea", default_visible: true, default_editable: true, default_required: false, affects_stock: false, affects_dashboard: false },
  { key: "sku", label: "SKU", section: "catalogo", type: "text", default_visible: true, default_editable: true, default_required: false, affects_stock: false, affects_dashboard: false },
  { key: "barcode", label: "Código de barras", section: "catalogo", type: "text", default_visible: true, default_editable: true, default_required: false, affects_stock: false, affects_dashboard: false },
  { key: "category", label: "Categoría", section: "catalogo", type: "category_select", default_visible: true, default_editable: true, default_required: false, affects_stock: false, affects_dashboard: true },
  { key: "brand", label: "Marca", section: "catalogo", type: "text", default_visible: true, default_editable: true, default_required: false, affects_stock: false, affects_dashboard: false },
  { key: "price", label: "Precio venta", section: "catalogo", type: "number", default_visible: true, default_editable: true, default_required: false, affects_stock: false, affects_dashboard: true },
  { key: "cost_price", label: "Precio coste", section: "catalogo", type: "number", default_visible: true, default_editable: true, default_required: false, affects_stock: false, affects_dashboard: true },
  { key: "image", label: "Imagen URL", section: "catalogo", type: "text", default_visible: true, default_editable: true, default_required: false, affects_stock: false, affects_dashboard: false },
  { key: "status", label: "Estado", section: "catalogo", type: "text", default_visible: true, default_editable: true, default_required: false, affects_stock: false, affects_dashboard: true },
  { key: "featured", label: "Destacado", section: "catalogo", type: "boolean", default_visible: true, default_editable: true, default_required: false, affects_stock: false, affects_dashboard: true },
  { key: "stock", label: "Stock actual", section: "stock", type: "number", default_visible: true, default_editable: true, default_required: false, affects_stock: true, affects_dashboard: true },
  { key: "min_stock", label: "Stock mínimo", section: "stock", type: "number", default_visible: true, default_editable: true, default_required: false, affects_stock: true, affects_dashboard: true },
  { key: "max_stock", label: "Stock máximo", section: "stock", type: "number", default_visible: true, default_editable: true, default_required: false, affects_stock: true, affects_dashboard: false },
  { key: "reorder_point", label: "Punto de pedido", section: "stock", type: "number", default_visible: true, default_editable: true, default_required: false, affects_stock: true, affects_dashboard: true },
  { key: "track_stock", label: "Controlar stock", section: "stock", type: "boolean", default_visible: true, default_editable: true, default_required: false, affects_stock: true, affects_dashboard: false },
  { key: "allow_backorder", label: "Permitir backorder", section: "stock", type: "boolean", default_visible: true, default_editable: true, default_required: false, affects_stock: true, affects_dashboard: false },
  { key: "unit_type", label: "Unidad", section: "catalogo", type: "text", default_visible: true, default_editable: true, default_required: false, affects_stock: false, affects_dashboard: false },
];

/**
 * Obtiene la configuración de columnas de productos para una empresa.
 * Si no hay config guardada, devuelve defaults del maestro.
 */
export async function getCompanyProductColumnConfig(
  companyId: string | null,
  section?: ProductModuleSection
): Promise<ResolvedProductColumn[]> {
  const defs = section
    ? PRODUCT_COLUMN_DEFINITIONS.filter((d) => d.section === section)
    : PRODUCT_COLUMN_DEFINITIONS;

  if (!companyId) {
    return defs.map((d, i) => ({
      key: d.key,
      label: d.label,
      section: d.section,
      type: d.type,
      visible: d.default_visible,
      editable: d.default_editable,
      required: d.default_required,
      show_in_list: true,
      show_in_form: true,
      affects_stock: d.affects_stock,
      affects_dashboard: d.affects_dashboard,
      sort_order: i,
    }));
  }

  try {
    const supabase = await getSupabaseClient();
    let query = supabase
      .from("company_product_column_config")
      .select("*")
      .eq("company_id", companyId)
      .order("sort_order");

    if (section) {
      query = query.eq("module_section", section);
    }

    const { data: configs } = await query;

    const configMap = new Map((configs ?? []).map((c) => [c.column_key, c]));

    return defs
      .map((d, i) => {
        const c = configMap.get(d.key);
        return {
          key: d.key,
          label: c?.column_label ?? d.label,
          section: d.section,
          type: d.type,
          visible: c?.visible ?? d.default_visible,
          editable: c?.editable ?? d.default_editable,
          required: c?.required ?? d.default_required,
          show_in_list: c?.show_in_list ?? true,
          show_in_form: c?.show_in_form ?? true,
          affects_stock: c?.affects_stock ?? d.affects_stock,
          affects_dashboard: c?.affects_dashboard ?? d.affects_dashboard,
          sort_order: c?.sort_order ?? i,
        };
      })
      .filter((col) => col.visible)
      .sort((a, b) => a.sort_order - b.sort_order);
  } catch {
    return defs.map((d, i) => ({
      key: d.key,
      label: d.label,
      section: d.section,
      type: d.type,
      visible: d.default_visible,
      editable: d.default_editable,
      required: d.default_required,
      show_in_list: true,
      show_in_form: true,
      affects_stock: d.affects_stock,
      affects_dashboard: d.affects_dashboard,
      sort_order: i,
    }));
  }
}

/**
 * Siembra la configuración por defecto de columnas de productos para una empresa.
 * Usar en onboarding al crear la empresa.
 * Usa upsert para ser idempotente: si ya existe config (manual o previo), la actualiza.
 * @param companyId ID de la empresa
 * @param supabase Cliente Supabase (admin en onboarding para bypass RLS)
 */
export async function seedDefaultProductColumnConfig(
  companyId: string,
  supabase?: SupabaseClient
): Promise<{ ok: boolean; error?: string }> {
  const client = supabase ?? (await getSupabaseClient());
  const rows = PRODUCT_COLUMN_DEFINITIONS.map((d, i) => ({
    company_id: companyId,
    column_key: d.key,
    column_label: d.label,
    module_section: d.section,
    visible: d.default_visible,
    editable: d.default_editable,
    required: d.default_required,
    show_in_list: true,
    show_in_form: true,
    affects_stock: d.affects_stock,
    affects_dashboard: d.affects_dashboard,
    sort_order: i,
  }));
  const { error } = await client
    .from("company_product_column_config")
    .upsert(rows, { onConflict: "company_id,column_key" });
  if (error) {
    console.error("seedDefaultProductColumnConfig:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Guarda la configuración de columnas de productos para una empresa.
 */
export async function setCompanyProductColumnConfig(
  companyId: string,
  rows: ProductColumnConfigInput[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseClient();
    await supabase.from("company_product_column_config").delete().eq("company_id", companyId);
    if (rows.length > 0) {
      const toInsert = rows.map((r) => ({
        company_id: companyId,
        column_key: r.column_key,
        column_label: r.column_label,
        module_section: r.module_section,
        visible: r.visible,
        editable: r.editable,
        required: r.required,
        show_in_list: r.show_in_list,
        show_in_form: r.show_in_form,
        affects_stock: r.affects_stock,
        affects_dashboard: r.affects_dashboard,
        sort_order: r.sort_order,
      }));
      const { error } = await supabase.from("company_product_column_config").insert(toInsert);
      if (error) {
        console.error("setCompanyProductColumnConfig:", error);
        return { ok: false, error: error.message };
      }
    }
    return { ok: true };
  } catch (e) {
    console.error("setCompanyProductColumnConfig:", e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Obtiene la configuración RAW de columnas (para panel de configuración).
 * Incluye todas las columnas del maestro, con valores guardados o defaults.
 */
export async function getCompanyProductColumnConfigRaw(
  companyId: string | null
): Promise<Array<ProductColumnConfigInput & { key: string }>> {
  const defs = PRODUCT_COLUMN_DEFINITIONS;
  if (!companyId) {
    return defs.map((d, i) => ({
      key: d.key,
      column_key: d.key,
      column_label: d.label,
      module_section: d.section,
      visible: d.default_visible,
      editable: d.default_editable,
      required: d.default_required,
      show_in_list: true,
      show_in_form: true,
      affects_stock: d.affects_stock,
      affects_dashboard: d.affects_dashboard,
      sort_order: i,
    }));
  }
  try {
    const supabase = await getSupabaseClient();
    const { data: configs } = await supabase
      .from("company_product_column_config")
      .select("*")
      .eq("company_id", companyId);
    const configMap = new Map((configs ?? []).map((c) => [c.column_key, c]));
    return defs.map((d, i) => {
      const c = configMap.get(d.key);
      return {
        key: d.key,
        column_key: d.key,
        column_label: c?.column_label ?? d.label,
        module_section: d.section,
        visible: c?.visible ?? d.default_visible,
        editable: c?.editable ?? d.default_editable,
        required: c?.required ?? d.default_required,
        show_in_list: c?.show_in_list ?? true,
        show_in_form: c?.show_in_form ?? true,
        affects_stock: c?.affects_stock ?? d.affects_stock,
        affects_dashboard: c?.affects_dashboard ?? d.affects_dashboard,
        sort_order: c?.sort_order ?? i,
      };
    });
  } catch {
    return defs.map((d, i) => ({
      key: d.key,
      column_key: d.key,
      column_label: d.label,
      module_section: d.section,
      visible: d.default_visible,
      editable: d.default_editable,
      required: d.default_required,
      show_in_list: true,
      show_in_form: true,
      affects_stock: d.affects_stock,
      affects_dashboard: d.affects_dashboard,
      sort_order: i,
    }));
  }
}
