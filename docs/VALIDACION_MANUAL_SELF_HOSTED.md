# Validación manual — Supabase self-hosted + `tradexpar`

Checklist para operadores (no sustituye pruebas en la app).

## Auth (GoTrue / Kong)

- [ ] **Site URL** y **Redirect URLs** incluyen el dominio de la app Next (producción y `http://localhost:3000` si desarrollás local).
- [ ] **Email** (magic link / confirmación): SMTP o plantillas configurados si usás flujos por correo.
- [ ] Tras registro, existe fila en **`tradexpar.profiles`** (trigger `handle_new_user` aplicado en Postgres).

## API / PostgREST

- [ ] **Exposed schemas** incluyen `tradexpar` (y lo que use Auth si aplica).
- [ ] Tras cambios DDL: `NOTIFY pgrst, 'reload schema';` o reinicio del servicio API.

## RLS y datos

- [ ] Políticas en tablas `tradexpar.*` alineadas con `public.is_super_admin()` / `usuario_tiene_acceso_empresa()` (según migraciones aplicadas).
- [ ] Usuario no super admin solo ve empresas vía `user_company_roles` en `tradexpar`.

## App / hosting

- [ ] Variables en el panel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_BUSINESS_SCHEMA=tradexpar`, **`NEXT_PUBLIC_APP_URL`** (dominio público del ERP).
- [ ] HTTPS terminado correctamente (cookies `Secure` en producción).

## Realtime / Storage

- [ ] Si usás **Storage** o **Realtime**, comprobar que los servicios self-hosted estén habilitados y con la misma URL base.
