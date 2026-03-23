-- DashboardNeura: Asignar Super Admin al usuario neurautomations@gmail.com
-- Crea o actualiza el perfil con is_super_admin = true

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
  full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
  updated_at = now();
