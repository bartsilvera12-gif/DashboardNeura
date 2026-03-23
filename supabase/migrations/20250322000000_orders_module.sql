-- Módulo Gestión de pedidos
-- orders + order_items
-- Integración con stock_movements (venta / venta_cancelada)

-- Si existe orders sin company_id (tabla legacy), eliminarla para recrear
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'company_id')
  THEN
    DROP TABLE IF EXISTS order_status_history CASCADE;
    DROP TABLE IF EXISTS order_items CASCADE;
    DROP TABLE orders CASCADE;
  END IF;
END $$;

-- Tabla orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  source_channel TEXT NOT NULL DEFAULT 'manual',
  source_platform TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  notes TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK (payment_status IN (
    'pendiente', 'en_revision', 'validado', 'rechazado', 'reembolsado'
  )),
  payment_method TEXT,
  payment_provider TEXT,
  payment_reference TEXT,
  payment_bank TEXT,
  payment_amount_received DECIMAL(14,2),
  payment_received_at TIMESTAMPTZ,
  payment_verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_verified_at TIMESTAMPTZ,
  order_status TEXT NOT NULL DEFAULT 'pendiente_confirmacion' CHECK (order_status IN (
    'pendiente_confirmacion', 'confirmado', 'en_preparacion', 'entregado_courier',
    'en_camino', 'entregado', 'rechazado', 'cancelado'
  )),
  rejection_reason TEXT,
  rejection_notes TEXT,
  subtotal DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  shipping_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  total DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_company_order_number ON orders(company_id, order_number);
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Tabla order_items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  sku_snapshot TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(14,2) NOT NULL DEFAULT 0,
  inventory_source TEXT DEFAULT 'propio' CHECK (inventory_source IN (
    'propio', 'dropi', 'shopify', 'externo'
  )),
  external_reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_company ON order_items(company_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Historial de cambios de estado (opcional, para auditoría)
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);

-- Módulo Gestión de pedidos (se agregará si no existe)
INSERT INTO modules (code, name, path, sort_order) VALUES
  ('pedidos', 'Gestión de pedidos', '/pedidos', 25)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  path = EXCLUDED.path,
  sort_order = EXCLUDED.sort_order;

-- RLS orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_orders" ON orders;
CREATE POLICY "super_admin_orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin)
  );

DROP POLICY IF EXISTS "users_orders_by_company" ON orders;
CREATE POLICY "users_orders_by_company" ON orders
  FOR ALL USING (
    company_id IS NOT NULL AND public.usuario_tiene_acceso_empresa(company_id)
  );

-- RLS order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_order_items" ON order_items;
CREATE POLICY "super_admin_order_items" ON order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin)
  );

DROP POLICY IF EXISTS "users_order_items_by_company" ON order_items;
CREATE POLICY "users_order_items_by_company" ON order_items
  FOR ALL USING (
    company_id IS NOT NULL AND public.usuario_tiene_acceso_empresa(company_id)
  );

-- RLS order_status_history
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super_admin_order_status_history" ON order_status_history;
CREATE POLICY "super_admin_order_status_history" ON order_status_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin)
  );

DROP POLICY IF EXISTS "users_order_status_history" ON order_status_history;
CREATE POLICY "users_order_status_history" ON order_status_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_status_history.order_id
        AND o.company_id IS NOT NULL
        AND public.usuario_tiene_acceso_empresa(o.company_id)
    )
  );

NOTIFY pgrst, 'reload schema';
