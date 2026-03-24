# Onboarding de Clientes - Resumen

## Cambios realizados

### 1. Migración `20250321000009_onboarding_completo.sql`

- **companies:** Nuevas columnas `contact_name`, `contact_phone` (responsable/contacto).
- **roles:** Tabla creada con rol `company_admin`.
- **user_company_roles:** Tabla que vincula usuario → empresa → rol.

### 2. Nuevos archivos

| Archivo | Propósito |
|---------|-----------|
| `lib/supabase-admin.ts` | Cliente Supabase con Service Role Key (solo servidor). |
| `lib/auth/create-company-admin.ts` | Crea usuario en Auth, perfil y asigna company_admin. |
| `lib/config/onboarding-service.ts` | Orquesta todo el onboarding (empresa, branding, módulos, widgets, admin). |
| `app/(saas)/empresas/nuevo/page.tsx` | Página del wizard de alta. |
| `app/(saas)/empresas/nuevo/onboarding-wizard.tsx` | Wizard de 6 pasos. |
| `app/(saas)/empresas/nuevo/actions.ts` | Server action que ejecuta el onboarding. |

### 3. Flujo del wizard (6 pasos)

1. **Empresa:** nombre, slug, tipo, descripción, activa/inactiva.
2. **Responsable y admin:** contacto (nombre, teléfono), admin (email, contraseña, nombre).
3. **Módulos y secciones:** selección de módulos y secciones por módulo.
4. **Dashboard y widgets:** selección de widgets.
5. **Branding:** nombre comercial, color principal, logo.
6. **Confirmación:** resumen antes de dar de alta.

### 4. Lógica al crear (orden de ejecución)

1. Crear empresa en `companies`.
2. Crear branding en `company_branding`.
3. Insertar configuración en `company_modules`.
4. Insertar configuración en `company_module_sections`.
5. Insertar configuración en `company_dashboard_widgets`.
6. Crear usuario en Auth (`supabase.auth.admin.createUser`).
7. Crear/actualizar perfil en `profiles`.
8. Asignar rol en `user_company_roles` (company_admin).
9. Redirigir a `/empresas/[id]/configurar`.

Si falla en cualquier paso, se hace rollback de la empresa creada.

### 5. Auth

- Se usa `SUPABASE_SERVICE_ROLE_KEY` para crear usuarios vía `auth.admin.createUser`.
- El usuario se crea con `email_confirm: true` para que pueda iniciar sesión de inmediato.
- No se hardcodean credenciales; todo viene del formulario.

### 6. Cambios en la UI

- **Empresas:** Botón "Alta nuevo cliente" que lleva al wizard.
- **Empresas list:** Eliminado el formulario rápido de creación; el alta se hace solo por wizard.
- **Empresas list:** Mensaje cuando no hay empresas actualizado.

---

## Variables de entorno requeridas

Añadir a `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=...  # Panel API de tu Supabase self-hosted (service_role, solo servidor)
```

---

## Flujo que ya funciona

1. Super Admin va a **Empresas**.
2. Pulsa **Alta nuevo cliente**.
3. Completa los 6 pasos del wizard.
4. Pulsa **Dar de alta cliente**.
5. Se crea empresa, branding, módulos, secciones, widgets y admin.
6. El admin puede iniciar sesión con su email y contraseña.
7. Redirección a la página de configuración de la empresa.

---

## Pendiente

- **RLS:** Las tablas `roles` y `user_company_roles` no tienen políticas. El sistema asume Super Admin.
- **Validación de email:** El admin se crea con email confirmado; no hay flujo de verificación.
- **Cambio de contraseña:** El admin debería poder cambiar su contraseña inicial.
- **Notificación al admin:** Enviar email al admin con sus credenciales (opcional).
