# Migraciones Supabase - DashboardNeura

## Requisitos

- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado
- Proyecto vinculado a Supabase (`supabase link`)

## Ejecutar migraciones

### Opción 1: Supabase local (desarrollo)

```bash
supabase start
supabase db reset   # Aplica todas las migraciones desde cero
```

### Opción 2: Proyecto remoto (producción)

```bash
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

### Opción 3: SQL manual

Si prefieres ejecutar el SQL manualmente en el dashboard de Supabase:

1. Ir a SQL Editor en tu proyecto
2. Ejecutar en orden:
   - `supabase/migrations/20250321000001_initial_schema.sql`
   - `supabase/migrations/20250321000002_seed_data.sql`
   - `supabase/migrations/20250321000003_rls_policies.sql`

## Variables de entorno

Añade a `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

**SUPABASE_SERVICE_ROLE_KEY** es necesaria para el onboarding de clientes (crear usuarios admin).
Obtenerla en: Supabase Dashboard > Settings > API > service_role (secret).

## Crear el primer Super Admin

### Opción A: Migración automática (usuario neurautomations@gmail.com)

Ejecuta la migración `20250321000004_super_admin_profile.sql` que asigna
automáticamente el rol Super Admin al usuario con email `neurautomations@gmail.com`.

### Opción B: Manual

```sql
-- Reemplaza USER_UUID con el id del usuario creado en Auth
INSERT INTO profiles (id, email, full_name, is_super_admin)
VALUES ('USER_UUID', 'admin@tudominio.com', 'Super Admin', true)
ON CONFLICT (id) DO UPDATE SET is_super_admin = true;
```

## Configurar Supabase Auth

En el dashboard de Supabase → Authentication → URL Configuration:

- **Site URL**: `http://localhost:3000` (desarrollo) o tu dominio en producción
- **Redirect URLs**: añade `http://localhost:3000/auth/callback`

## Estructura de migraciones

| Archivo | Descripción |
|---------|-------------|
| 20250321000001 | Tablas core, módulos, formularios, permisos |
| 20250321000002 | Seed: roles, módulos, secciones, widgets, form definitions |
| 20250321000003 | RLS policies para multi-tenancy |
| 20250321000004 | Asignar Super Admin a neurautomations@gmail.com |
| 20250321120000 | **Fix company_type**: añade company_type, description, contact_name, contact_phone a companies |
| 20250321130000 | **Fix company_branding**: crea tabla company_branding |
| 20250321140000 | **Fix roles**: crea tabla roles, user_company_roles y rol company_admin |

## Error "Could not find company_type in schema cache"

### Qué problema resuelve esta migración

El error indica que la tabla `companies` no tiene las columnas `company_type`, `description`, `contact_name` o `contact_phone`, o que el schema cache de PostgREST está desactualizado. La migración `20250321120000_fix_companies_company_type.sql` añade estas columnas y notifica a PostgREST para recargar el schema.

### Cómo aplicarla con `supabase db push`

```bash
npx supabase link --project-ref TU_PROJECT_REF   # si aún no está vinculado
npx supabase db push
```

Esto aplica todas las migraciones pendientes, incluida la de fix.

### Cómo aplicarla solo con la migración fix (ejecución directa)

Si el proyecto ya está vinculado y solo necesitas ejecutar el fix:

```bash
npm run db:migrate-fix
```

O manualmente:

```bash
npx supabase db query -f supabase/migrations/20250321120000_fix_companies_company_type.sql --linked
```

### Refrescar schema cache

```bash
npm run db:refresh-schema
```

### Cómo aplicarla desde SQL Editor

1. Ir a **Supabase Dashboard** → **SQL Editor**
2. Crear una nueva query
3. Copiar y pegar el contenido de `supabase/migrations/20250321120000_fix_companies_company_type.sql`
4. Ejecutar (Run)

### Cómo refrescar schema cache con `NOTIFY pgrst, 'reload schema'`

La migración ya incluye `NOTIFY pgrst, 'reload schema';` al final. Si aplicaste la migración manualmente y el error persiste, ejecuta en SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

PostgREST escucha este canal y recarga el schema automáticamente.

### Qué hacer si el problema persiste

1. **Reiniciar el proyecto**: Dashboard → Settings → General → **Restart project**
2. **Verificar que las columnas existen**: En SQL Editor ejecuta `SELECT column_name FROM information_schema.columns WHERE table_name = 'companies';` y confirma que aparecen `company_type`, `description`, `contact_name`, `contact_phone`
3. **Revisar variables de entorno**: `.env.local` debe tener `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`

### Cómo validar que el onboarding volvió a funcionar

1. Iniciar sesión como Super Admin
2. Ir a `/empresas/nuevo`
3. Completar el wizard de 6 pasos (empresa, admin, módulos, widgets, branding, confirmación)
4. Pulsar "Dar de alta cliente"
5. Debe redirigir a `/empresas/[id]/configurar` sin errores
