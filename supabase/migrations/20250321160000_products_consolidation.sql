-- Consolidación y endurecimiento del módulo de productos
-- - product_type para comportamiento por tipo
-- - stock_movements para trazabilidad
-- NO rompe compatibilidad existente

-- ============================================
-- 1. PRODUCT_TYPE en products
-- ecommerce: usa stock | servicios: no stock | inmobiliaria: campos específicos
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'ecommerce'
  CHECK (product_type IN ('ecommerce', 'servicios', 'inmobiliaria'));

-- Índice para filtros por tipo
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type) WHERE product_type IS NOT NULL;

-- ============================================
-- 2. TABLA stock_movements
-- Registra entradas, salidas y ajustes
-- products.stock permanece como valor actual (cache)
-- ============================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'ajuste')),
  quantity INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_company ON stock_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);

NOTIFY pgrst, 'reload schema';
