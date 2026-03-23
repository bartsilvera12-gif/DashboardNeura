-- Categorías administrables por empresa (evita texto libre duplicado)
-- Asegura helpers RLS (por si el remoto no los tiene)

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.usuario_tiene_acceso_empresa(company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM user_company_roles ucr
      WHERE ucr.user_id = auth.uid() AND ucr.company_id = usuario_tiene_acceso_empresa.company_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS company_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_company_categories_company ON company_categories(company_id);

-- RLS
ALTER TABLE company_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_company_categories" ON company_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin)
  );

CREATE POLICY "users_select_company_categories" ON company_categories
  FOR SELECT USING (company_id IS NOT NULL AND public.usuario_tiene_acceso_empresa(company_id));

CREATE POLICY "users_insert_company_categories" ON company_categories
  FOR INSERT WITH CHECK (
    company_id IS NOT NULL AND public.usuario_tiene_acceso_empresa(company_id)
  );

CREATE POLICY "users_update_company_categories" ON company_categories
  FOR UPDATE USING (company_id IS NOT NULL AND public.usuario_tiene_acceso_empresa(company_id));

CREATE POLICY "users_delete_company_categories" ON company_categories
  FOR DELETE USING (company_id IS NOT NULL AND public.usuario_tiene_acceso_empresa(company_id));

NOTIFY pgrst, 'reload schema';
