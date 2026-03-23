-- Cierre del módulo Stock: origin, referencia, created_by
-- Deja listo para ventas

-- 1. Asegurar reference_id (ya existe en creación original)
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS reference_id UUID;

-- 2. Columna origin (origen del movimiento)
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS origin TEXT;

-- 3. Constraint para origin (valores permitidos)
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_origin_check;
ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_origin_check
  CHECK (origin IS NULL OR origin IN (
    'manual',
    'stock_inicial',
    'venta',
    'devolucion',
    'ajuste_admin'
  ));

-- 4. Índice para filtros por company (ya existe, pero aseguramos)
CREATE INDEX IF NOT EXISTS idx_stock_movements_company ON stock_movements(company_id);

-- 5. Comentarios para documentación
COMMENT ON COLUMN stock_movements.origin IS 'Origen: manual, stock_inicial, venta, devolucion, ajuste_admin';
COMMENT ON COLUMN stock_movements.reference_type IS 'Tipo de referencia externa (ej: venta, compra)';
COMMENT ON COLUMN stock_movements.reference_id IS 'ID de la entidad referenciada';
COMMENT ON COLUMN stock_movements.created_by IS 'Usuario que registró el movimiento';

NOTIFY pgrst, 'reload schema';
