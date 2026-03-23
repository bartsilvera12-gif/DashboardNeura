-- Centro de control Empresas: tablas y columnas para templates y configuración completa
-- No modifica estructuras existentes, solo añade

-- ============================================
-- 1. EXTENDER COMPANIES
-- ============================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_type TEXT NOT NULL DEFAULT 'personalizado';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;

-- Constraint para tipo válido
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'companies_company_type_check'
  ) THEN
    ALTER TABLE companies ADD CONSTRAINT companies_company_type_check
      CHECK (company_type IN ('ecommerce', 'inmobiliaria', 'servicios', 'personalizado'));
  END IF;
END $$;

-- ============================================
-- 2. MODULE_SECTIONS (secciones por módulo)
-- ============================================
CREATE TABLE IF NOT EXISTS module_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, code)
);

CREATE INDEX IF NOT EXISTS idx_module_sections_module ON module_sections(module_id);

-- Seed secciones por módulo
INSERT INTO module_sections (module_id, code, name, sort_order)
SELECT m.id, 'catalogo', 'Catálogo', 10 FROM modules m WHERE m.code = 'productos'
ON CONFLICT (module_id, code) DO NOTHING;

INSERT INTO module_sections (module_id, code, name, sort_order)
SELECT m.id, 'stock', 'Stock', 20 FROM modules m WHERE m.code = 'productos'
ON CONFLICT (module_id, code) DO NOTHING;

-- ============================================
-- 3. COMPANY_MODULE_SECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS company_module_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module_section_id UUID NOT NULL REFERENCES module_sections(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, module_section_id)
);

CREATE INDEX IF NOT EXISTS idx_company_module_sections_company ON company_module_sections(company_id);

-- ============================================
-- 4. DASHBOARD_WIDGETS
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  default_config JSONB DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_code ON dashboard_widgets(code);

-- Seed widgets
INSERT INTO dashboard_widgets (code, name, description, sort_order) VALUES
  ('ventas_dia', 'Ventas del día', 'Resumen de ventas del día', 10),
  ('ventas_mes', 'Ventas del mes', 'Resumen de ventas del mes', 20),
  ('top_productos', 'Top productos', 'Productos más vendidos', 30),
  ('propiedades_vistas', 'Propiedades vistas', 'Consultas de propiedades', 40),
  ('consultas', 'Consultas', 'Consultas recibidas', 50)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 5. COMPANY_DASHBOARD_WIDGETS
-- ============================================
CREATE TABLE IF NOT EXISTS company_dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  widget_id UUID NOT NULL REFERENCES dashboard_widgets(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, widget_id)
);

CREATE INDEX IF NOT EXISTS idx_company_dashboard_widgets_company ON company_dashboard_widgets(company_id);

-- ============================================
-- 6. FORM_DEFINITIONS, FORM_FIELDS, COMPANY_FORM_FIELDS
-- ============================================
CREATE TABLE IF NOT EXISTS form_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  entity_code TEXT NOT NULL,
  form_code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, entity_code, form_code)
);

CREATE INDEX IF NOT EXISTS idx_form_definitions_module ON form_definitions(module_id);

CREATE TABLE IF NOT EXISTS form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_definition_id UUID NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  default_required BOOLEAN NOT NULL DEFAULT false,
  default_visible BOOLEAN NOT NULL DEFAULT true,
  default_editable BOOLEAN NOT NULL DEFAULT true,
  default_sort_order INT NOT NULL DEFAULT 0,
  options JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(form_definition_id, code)
);

CREATE INDEX IF NOT EXISTS idx_form_fields_form_definition ON form_fields(form_definition_id);

CREATE TABLE IF NOT EXISTS company_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  form_field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  is_visible BOOLEAN,
  is_required BOOLEAN,
  is_editable BOOLEAN,
  sort_order INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, form_field_id)
);

CREATE INDEX IF NOT EXISTS idx_company_form_fields_company ON company_form_fields(company_id);

-- Seed form_definitions y form_fields para producto (módulo productos)
INSERT INTO form_definitions (module_id, entity_code, form_code, name)
SELECT m.id, 'producto', 'edicion', 'Formulario de producto'
FROM modules m WHERE m.code = 'productos'
ON CONFLICT (module_id, entity_code, form_code) DO NOTHING;

INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_sort_order)
SELECT fd.id, 'nombre', 'Nombre', 'text', true, 10
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code = 'edicion'
ON CONFLICT (form_definition_id, code) DO NOTHING;

INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_sort_order)
SELECT fd.id, 'precio', 'Precio', 'number', true, 20
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code = 'edicion'
ON CONFLICT (form_definition_id, code) DO NOTHING;

INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_sort_order)
SELECT fd.id, 'descripcion', 'Descripción', 'textarea', false, 30
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code = 'edicion'
ON CONFLICT (form_definition_id, code) DO NOTHING;

-- ============================================
-- 7. COMPANY_BRANDING
-- ============================================
CREATE TABLE IF NOT EXISTS company_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  display_name TEXT,
  logo_url TEXT,
  primary_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Función updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS company_branding_updated_at ON company_branding;
CREATE TRIGGER company_branding_updated_at
  BEFORE UPDATE ON company_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
