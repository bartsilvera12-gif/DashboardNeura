-- Evolución de products: columnas universales + configuración por empresa
-- NO rompe compatibilidad con products, product_images, products_inmobiliaria, orders, stores

-- ============================================
-- 1. AMPLIAR products (ALTER TABLE ADD COLUMN IF NOT EXISTS)
-- Mantiene: id, description, name, price, image, category, stock, created_at, store_id
-- ============================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'unit';
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS width NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'visible';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS internal_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS notes TEXT;

-- company_id: vincula products al SaaS (companies). Nullable para compatibilidad con store_id legacy.
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id) WHERE store_id IS NOT NULL;

-- stores.company_id: vincula stores legacy con companies (opcional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stores' AND column_name='company_id') THEN
    ALTER TABLE stores ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_stores_company_id ON stores(company_id) WHERE company_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================
-- 2. TABLA company_product_column_config
-- Configuración por empresa de columnas visibles en Catálogo y Stock
-- ============================================
CREATE TABLE IF NOT EXISTS company_product_column_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  column_key TEXT NOT NULL,
  column_label TEXT NOT NULL,
  module_section TEXT NOT NULL CHECK (module_section IN ('catalogo', 'stock')),
  visible BOOLEAN NOT NULL DEFAULT true,
  editable BOOLEAN NOT NULL DEFAULT true,
  required BOOLEAN NOT NULL DEFAULT false,
  show_in_list BOOLEAN NOT NULL DEFAULT true,
  show_in_form BOOLEAN NOT NULL DEFAULT true,
  affects_stock BOOLEAN NOT NULL DEFAULT false,
  affects_dashboard BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, column_key)
);

CREATE INDEX IF NOT EXISTS idx_company_product_column_config_company ON company_product_column_config(company_id);
CREATE INDEX IF NOT EXISTS idx_company_product_column_config_section ON company_product_column_config(company_id, module_section);

-- Trigger updated_at
DROP TRIGGER IF EXISTS company_product_column_config_updated_at ON company_product_column_config;
CREATE TRIGGER company_product_column_config_updated_at
  BEFORE UPDATE ON company_product_column_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

NOTIFY pgrst, 'reload schema';
