-- Evolución de stock_movements: nuevos tipos, notas, referencia
-- Prepara el modelo para ventas y trazabilidad completa

-- 1. Añadir columnas notes y reference_type si no existen
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS reference_type TEXT;

-- 2. Ampliar movement_type: stock_inicial, devolucion
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'stock_movements'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%entrada%'
  LOOP
    EXECUTE format('ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;
ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_movement_type_check
  CHECK (movement_type IN (
    'stock_inicial',
    'entrada',
    'salida',
    'ajuste',
    'devolucion'
  ));

-- 3. Asegurar created_by existe (ya puede estar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE stock_movements ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
