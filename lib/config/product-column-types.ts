/**
 * Tipos de configuración de columnas de productos.
 * Seguro para importar en Client Components (no usa Supabase ni next/headers).
 */

export type ProductModuleSection = "catalogo" | "stock";

export interface ProductColumnConfig {
  id: string;
  company_id: string;
  column_key: string;
  column_label: string;
  module_section: ProductModuleSection;
  visible: boolean;
  editable: boolean;
  required: boolean;
  show_in_list: boolean;
  show_in_form: boolean;
  affects_stock: boolean;
  affects_dashboard: boolean;
  sort_order: number;
}

export interface ResolvedProductColumn {
  key: string;
  label: string;
  section: ProductModuleSection;
  type: string;
  visible: boolean;
  editable: boolean;
  required: boolean;
  show_in_list: boolean;
  show_in_form: boolean;
  affects_stock: boolean;
  affects_dashboard: boolean;
  sort_order: number;
}

export interface ProductColumnConfigInput {
  column_key: string;
  column_label: string;
  module_section: ProductModuleSection;
  visible: boolean;
  editable: boolean;
  required: boolean;
  show_in_list: boolean;
  show_in_form: boolean;
  affects_stock: boolean;
  affects_dashboard: boolean;
  sort_order: number;
}
