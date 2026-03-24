-- Perfiles y helpers RLS: fuente de verdad en tradexpar.profiles.
-- Si el remoto solo tenía tablas en public, se clonan companies/roles/user_company_roles a tradexpar.
-- Tras aplicar: Supabase → API → Exposed schemas debe incluir "tradexpar".

CREATE SCHEMA IF NOT EXISTS tradexpar;

-- ---------------------------------------------------------------------------
-- 0. Clonar tablas de negocio desde public → tradexpar si faltan (FKs coherentes)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.companies') IS NOT NULL AND to_regclass('tradexpar.companies') IS NULL THEN
    EXECUTE 'CREATE TABLE tradexpar.companies (LIKE public.companies INCLUDING ALL)';
    EXECUTE 'INSERT INTO tradexpar.companies SELECT * FROM public.companies ON CONFLICT (id) DO NOTHING';
  END IF;

  IF to_regclass('public.roles') IS NOT NULL AND to_regclass('tradexpar.roles') IS NULL THEN
    EXECUTE 'CREATE TABLE tradexpar.roles (LIKE public.roles INCLUDING ALL)';
    EXECUTE 'INSERT INTO tradexpar.roles SELECT * FROM public.roles ON CONFLICT (id) DO NOTHING';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Tabla profiles en tradexpar
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tradexpar.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tradexpar_profiles_super
  ON tradexpar.profiles(is_super_admin)
  WHERE is_super_admin = true;

-- Copia desde public.profiles si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    INSERT INTO tradexpar.profiles (id, email, full_name, is_super_admin, created_at, updated_at)
    SELECT id, email, full_name, is_super_admin, created_at, updated_at
    FROM public.profiles
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      is_super_admin = EXCLUDED.is_super_admin,
      updated_at = EXCLUDED.updated_at;
  END IF;
END $$;

-- user_company_roles: clonar desde public si falta en tradexpar
DO $$
DECLARE
  r RECORD;
BEGIN
  IF to_regclass('public.user_company_roles') IS NOT NULL
     AND to_regclass('tradexpar.user_company_roles') IS NULL THEN
    EXECUTE 'CREATE TABLE tradexpar.user_company_roles (LIKE public.user_company_roles INCLUDING ALL)';

    FOR r IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE n.nspname = 'tradexpar'
        AND t.relname = 'user_company_roles'
        AND c.contype = 'f'
    LOOP
      EXECUTE format('ALTER TABLE tradexpar.user_company_roles DROP CONSTRAINT %I', r.conname);
    END LOOP;

    ALTER TABLE tradexpar.user_company_roles
      ADD CONSTRAINT user_company_roles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES tradexpar.profiles(id) ON DELETE CASCADE;
    ALTER TABLE tradexpar.user_company_roles
      ADD CONSTRAINT user_company_roles_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES tradexpar.companies(id) ON DELETE CASCADE;
    ALTER TABLE tradexpar.user_company_roles
      ADD CONSTRAINT user_company_roles_role_id_fkey
      FOREIGN KEY (role_id) REFERENCES tradexpar.roles(id) ON DELETE CASCADE;

    INSERT INTO tradexpar.user_company_roles
    SELECT * FROM public.user_company_roles
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Si sigue sin existir user_company_roles en tradexpar, la migración no puede continuar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'tradexpar' AND table_name = 'user_company_roles'
  ) THEN
    RAISE EXCEPTION
      'tradexpar.user_company_roles no existe y no se pudo clonar desde public.user_company_roles. Crea la tabla o revisa public.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Helpers en public.* (invocados por políticas RLS): leen tradexpar
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tradexpar.profiles
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.usuario_tiene_acceso_empresa(company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM tradexpar.user_company_roles ucr
      WHERE ucr.user_id = auth.uid()
        AND ucr.company_id = usuario_tiene_acceso_empresa.company_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 3. Nuevo usuario Auth → fila en tradexpar.profiles
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tradexpar.profiles (id, email, full_name, is_super_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. RLS en tradexpar.profiles
-- ---------------------------------------------------------------------------
ALTER TABLE tradexpar.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_profile" ON tradexpar.profiles;
CREATE POLICY "users_read_own_profile" ON tradexpar.profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "super_admin_all_profiles" ON tradexpar.profiles;
CREATE POLICY "super_admin_all_profiles" ON tradexpar.profiles
  FOR ALL USING (public.is_super_admin());

GRANT USAGE ON SCHEMA tradexpar TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON tradexpar.profiles TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Políticas que referían public.profiles en subconsultas → is_super_admin()
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  sch text;
BEGIN
  FOREACH sch IN ARRAY ARRAY['public', 'tradexpar']
  LOOP
    IF to_regclass(format('%I.orders', sch)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "super_admin_orders" ON %I.orders', sch);
      EXECUTE format(
        'CREATE POLICY "super_admin_orders" ON %I.orders FOR ALL USING (public.is_super_admin())',
        sch
      );
    END IF;

    IF to_regclass(format('%I.order_items', sch)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "super_admin_order_items" ON %I.order_items', sch);
      EXECUTE format(
        'CREATE POLICY "super_admin_order_items" ON %I.order_items FOR ALL USING (public.is_super_admin())',
        sch
      );
    END IF;

    IF to_regclass(format('%I.order_status_history', sch)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "super_admin_order_status_history" ON %I.order_status_history', sch);
      EXECUTE format(
        'CREATE POLICY "super_admin_order_status_history" ON %I.order_status_history FOR ALL USING (public.is_super_admin())',
        sch
      );
    END IF;

    IF to_regclass(format('%I.products', sch)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "super_admin_products" ON %I.products', sch);
      EXECUTE format(
        'CREATE POLICY "super_admin_products" ON %I.products FOR ALL USING (public.is_super_admin())',
        sch
      );
    END IF;

    IF to_regclass(format('%I.company_categories', sch)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "super_admin_company_categories" ON %I.company_categories', sch);
      EXECUTE format(
        'CREATE POLICY "super_admin_company_categories" ON %I.company_categories FOR ALL USING (public.is_super_admin())',
        sch
      );
    END IF;

    IF to_regclass(format('%I.user_company_roles', sch)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "company_admin_manage_ucr" ON %I.user_company_roles', sch);
      EXECUTE format(
        'CREATE POLICY "company_admin_manage_ucr" ON %I.user_company_roles FOR ALL USING (
          public.usuario_tiene_acceso_empresa(company_id)
          AND EXISTS (
            SELECT 1 FROM %I.user_company_roles ucr
            JOIN %I.roles r ON ucr.role_id = r.id
            WHERE ucr.user_id = auth.uid()
              AND ucr.company_id = user_company_roles.company_id
              AND r.code = ''company_admin''
          )
        )',
        sch, sch, sch
      );
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
