-- RLS para roles y user_company_roles (onboarding seguro)
-- Funciones helper y políticas para evitar escalada de privilegios

-- ============================================
-- 1. FUNCIÓN is_super_admin() (si no existe)
-- ============================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. FUNCIÓN usuario_tiene_acceso_empresa (si no existe)
-- ============================================
CREATE OR REPLACE FUNCTION public.usuario_tiene_acceso_empresa(company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM user_company_roles
      WHERE user_id = auth.uid() AND user_company_roles.company_id = usuario_tiene_acceso_empresa.company_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. RLS EN ROLES
-- ============================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen
DROP POLICY IF EXISTS "authenticated_read_roles" ON roles;
DROP POLICY IF EXISTS "super_admin_write_roles" ON roles;

-- Super admin: gestión completa
CREATE POLICY "super_admin_all_roles" ON roles
  FOR ALL USING (public.is_super_admin());

-- Usuarios autenticados: solo lectura (para ver roles en UI)
CREATE POLICY "authenticated_read_roles" ON roles
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- 4. RLS EN USER_COMPANY_ROLES
-- ============================================
ALTER TABLE user_company_roles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen
DROP POLICY IF EXISTS "super_admin_all_ucr" ON user_company_roles;
DROP POLICY IF EXISTS "users_read_own_ucr" ON user_company_roles;
DROP POLICY IF EXISTS "company_admin_manage_ucr" ON user_company_roles;

-- Super admin: gestión completa
CREATE POLICY "super_admin_all_ucr" ON user_company_roles
  FOR ALL USING (public.is_super_admin());

-- Usuarios: solo leer sus propios roles (para saber a qué empresas tienen acceso)
CREATE POLICY "users_read_own_ucr" ON user_company_roles
  FOR SELECT USING (user_id = auth.uid());

-- Company admin: puede gestionar roles SOLO de su empresa (no puede auto-escalar)
-- Solo INSERT/UPDATE/DELETE donde tiene company_admin en ESA empresa
CREATE POLICY "company_admin_manage_ucr" ON user_company_roles
  FOR ALL USING (
    public.usuario_tiene_acceso_empresa(company_id)
    AND EXISTS (
      SELECT 1 FROM user_company_roles ucr
      JOIN roles r ON ucr.role_id = r.id
      WHERE ucr.user_id = auth.uid()
        AND ucr.company_id = user_company_roles.company_id
        AND r.code = 'company_admin'
    )
  );
