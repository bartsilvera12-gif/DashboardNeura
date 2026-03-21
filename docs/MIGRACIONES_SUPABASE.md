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
```

## Crear el primer Super Admin

Después de las migraciones, crea un usuario en Supabase Auth y luego inserta su perfil como super admin:

```sql
-- Reemplaza USER_UUID con el id del usuario creado en Auth
INSERT INTO profiles (id, email, full_name, is_super_admin)
VALUES ('USER_UUID', 'admin@tudominio.com', 'Super Admin', true);
```

## Estructura de migraciones

| Archivo | Descripción |
|---------|-------------|
| 20250321000001 | Tablas core, módulos, formularios, permisos |
| 20250321000002 | Seed: roles, módulos, secciones, widgets, form definitions |
| 20250321000003 | RLS policies para multi-tenancy |
