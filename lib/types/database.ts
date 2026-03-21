/**
 * Tipos generados para el esquema de Supabase.
 * Reflejan la estructura de ARQUITECTURA_MULTIEMPRESA.md
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type RoleScope = "global" | "company";

export interface Company {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  is_super_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  scope: RoleScope;
  created_at: string;
}

export interface UserCompanyRole {
  id: string;
  user_id: string;
  company_id: string;
  role_id: string;
  created_at: string;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  path: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ModuleSection {
  id: string;
  module_id: string;
  code: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface CompanyModule {
  id: string;
  company_id: string;
  module_id: string;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
}

export interface CompanyModuleSection {
  id: string;
  company_id: string;
  module_section_id: string;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
}

export interface DashboardWidget {
  id: string;
  code: string;
  name: string;
  description: string | null;
  default_config: Json;
  sort_order: number;
  created_at: string;
}

export interface CompanyDashboardWidget {
  id: string;
  company_id: string;
  widget_id: string;
  is_enabled: boolean;
  config: Json;
  sort_order: number;
  created_at: string;
}

export interface FormDefinition {
  id: string;
  module_id: string;
  entity_code: string;
  form_code: string;
  name: string;
  created_at: string;
}

export interface FormField {
  id: string;
  form_definition_id: string;
  code: string;
  name: string;
  type: string;
  default_required: boolean;
  default_visible: boolean;
  default_editable: boolean;
  default_sort_order: number;
  options: Json;
  created_at: string;
}

export interface CompanyFormField {
  id: string;
  company_id: string;
  form_field_id: string;
  is_visible: boolean | null;
  is_required: boolean | null;
  is_editable: boolean | null;
  sort_order: number | null;
  created_at: string;
}

export interface CompanyBranding {
  id: string;
  company_id: string;
  display_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  resource: string;
  action: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

// Tipos con relaciones (para queries con join)
export interface ModuleWithSections extends Module {
  sections?: ModuleSection[];
}

export interface CompanyModuleWithModule extends CompanyModule {
  module?: Module;
}

export interface CompanyModuleSectionWithSection extends CompanyModuleSection {
  module_section?: ModuleSection;
}

export interface FormFieldWithConfig extends FormField {
  companyOverride?: CompanyFormField | null;
}

export interface ResolvedFormField {
  id: string;
  code: string;
  name: string;
  type: string;
  is_visible: boolean;
  is_required: boolean;
  is_editable: boolean;
  sort_order: number;
  options: Json;
}
