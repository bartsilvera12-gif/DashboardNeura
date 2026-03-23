-- Alinea stock_movements con estructura real usada en backend
-- Si la tabla fue creada con stock_before/stock_after, renombra a previous_stock/new_stock
-- Si ya tiene previous_stock/new_stock (creación manual), no hace nada

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stock_movements' AND column_name='stock_before') THEN
    ALTER TABLE stock_movements RENAME COLUMN stock_before TO previous_stock;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stock_movements' AND column_name='stock_after') THEN
    ALTER TABLE stock_movements RENAME COLUMN stock_after TO new_stock;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
