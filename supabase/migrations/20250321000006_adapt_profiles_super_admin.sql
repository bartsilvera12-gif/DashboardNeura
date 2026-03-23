-- Adaptar tabla profiles existente y asignar Super Admin
-- Para proyecto "paginas web neura" con estructura previa

-- Añadir columna is_super_admin si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Añadir updated_at si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Crear o actualizar perfil para neurautomations@gmail.com como Super Admin
INSERT INTO public.profiles (id, email, full_name, is_super_admin)
SELECT
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  ),
  true
FROM auth.users
WHERE email = 'neurautomations@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  is_super_admin = true,
  email = EXCLUDED.email,
  full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name);
