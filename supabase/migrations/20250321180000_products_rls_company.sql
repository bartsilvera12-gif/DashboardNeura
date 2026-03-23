-- RLS para products por company_id (SaaS)
-- Permite a usuarios con acceso a la empresa: SELECT, INSERT, UPDATE en sus productos

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Borrar políticas legacy por store_id si existen (evita conflicto)
DROP POLICY IF EXISTS "products_select_by_store" ON products;
DROP POLICY IF EXISTS "products_insert_by_store" ON products;
DROP POLICY IF EXISTS "products_update_by_store" ON products;
DROP POLICY IF EXISTS "products_delete_by_store" ON products;

-- Super Admin: acceso total
DROP POLICY IF EXISTS "super_admin_products" ON products;
CREATE POLICY "super_admin_products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin)
  );

-- Usuarios con acceso a empresa: SELECT productos de su empresa
DROP POLICY IF EXISTS "users_select_products_by_company" ON products;
CREATE POLICY "users_select_products_by_company" ON products
  FOR SELECT USING (
    company_id IS NOT NULL AND public.usuario_tiene_acceso_empresa(company_id)
  );

-- Usuarios con acceso a empresa: INSERT productos en su empresa
DROP POLICY IF EXISTS "users_insert_products_by_company" ON products;
CREATE POLICY "users_insert_products_by_company" ON products
  FOR INSERT WITH CHECK (
    company_id IS NOT NULL AND public.usuario_tiene_acceso_empresa(company_id)
  );

-- Usuarios con acceso a empresa: UPDATE productos de su empresa
DROP POLICY IF EXISTS "users_update_products_by_company" ON products;
CREATE POLICY "users_update_products_by_company" ON products
  FOR UPDATE USING (
    company_id IS NOT NULL AND public.usuario_tiene_acceso_empresa(company_id)
  );

NOTIFY pgrst, 'reload schema';
