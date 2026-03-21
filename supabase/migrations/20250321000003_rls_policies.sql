-- DashboardNeura: Row Level Security (RLS)
-- Políticas de acceso por tenant y rol

-- Habilitar RLS en todas las tablas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_module_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_branding ENABLE ROW LEVEL SECURITY;

-- Tablas de definición (lectura para autenticados, escritura solo super_admin)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNCIÓN HELPER: es_super_admin()
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
-- FUNCIÓN HELPER: usuario_tiene_acceso_empresa(company_id)
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
-- COMPANIES
-- ============================================

-- Super admin: todo
CREATE POLICY "super_admin_all_companies" ON companies
  FOR ALL USING (public.is_super_admin());

-- Usuarios: solo empresas donde tienen rol
CREATE POLICY "users_read_own_companies" ON companies
  FOR SELECT USING (public.usuario_tiene_acceso_empresa(id));

-- ============================================
-- PROFILES
-- ============================================

CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "super_admin_all_profiles" ON profiles
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- USER_COMPANY_ROLES
-- ============================================

CREATE POLICY "super_admin_all_ucr" ON user_company_roles
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "users_read_own_ucr" ON user_company_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "company_admin_manage_ucr" ON user_company_roles
  FOR ALL USING (
    public.usuario_tiene_acceso_empresa(company_id)
    AND EXISTS (
      SELECT 1 FROM user_company_roles ucr
      JOIN roles r ON ucr.role_id = r.id
      WHERE ucr.user_id = auth.uid() AND ucr.company_id = user_company_roles.company_id
      AND r.code = 'company_admin'
    )
  );

-- ============================================
-- COMPANY_* (configuración por empresa)
-- ============================================

-- company_modules
CREATE POLICY "super_admin_company_modules" ON company_modules
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "users_read_company_modules" ON company_modules
  FOR SELECT USING (public.usuario_tiene_acceso_empresa(company_id));

-- company_module_sections
CREATE POLICY "super_admin_company_module_sections" ON company_module_sections
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "users_read_company_module_sections" ON company_module_sections
  FOR SELECT USING (public.usuario_tiene_acceso_empresa(company_id));

-- company_dashboard_widgets
CREATE POLICY "super_admin_company_dashboard_widgets" ON company_dashboard_widgets
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "users_read_company_dashboard_widgets" ON company_dashboard_widgets
  FOR SELECT USING (public.usuario_tiene_acceso_empresa(company_id));

-- company_form_fields
CREATE POLICY "super_admin_company_form_fields" ON company_form_fields
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "users_read_company_form_fields" ON company_form_fields
  FOR SELECT USING (public.usuario_tiene_acceso_empresa(company_id));

-- company_branding
CREATE POLICY "super_admin_company_branding" ON company_branding
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "users_read_company_branding" ON company_branding
  FOR SELECT USING (public.usuario_tiene_acceso_empresa(company_id));

-- ============================================
-- TABLAS DE DEFINICIÓN (modules, roles, etc.)
-- ============================================

-- Lectura para usuarios autenticados
CREATE POLICY "authenticated_read_modules" ON modules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_module_sections" ON module_sections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_dashboard_widgets" ON dashboard_widgets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_form_definitions" ON form_definitions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_form_fields" ON form_fields
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_roles" ON roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_permissions" ON permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read_role_permissions" ON role_permissions
  FOR SELECT TO authenticated USING (true);

-- Escritura solo super admin (para futuras extensiones del sistema)
CREATE POLICY "super_admin_write_modules" ON modules
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "super_admin_write_roles" ON roles
  FOR ALL USING (public.is_super_admin());
