-- Onboarding completo: contacto, roles, user_company_roles
-- Soporta alta de cliente con admin principal

-- ============================================
-- 1. EXTENDER COMPANIES (contacto/responsable)
-- ============================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- ============================================
-- 2. ROLES (si no existe)
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);

-- Seed rol company_admin
INSERT INTO roles (code, name) VALUES ('company_admin', 'Administrador de empresa')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 3. USER_COMPANY_ROLES
-- ============================================
CREATE TABLE IF NOT EXISTS user_company_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_company_roles_user ON user_company_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_company_roles_company ON user_company_roles(company_id);
