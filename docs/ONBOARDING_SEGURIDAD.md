# Onboarding - Seguridad y Robustez

## Resumen de cambios

### 1. RLS para roles y user_company_roles

**Migración `20250321000010_rls_roles_onboarding.sql`:**

- **roles:**
  - `super_admin_all_roles`: Super Admin puede gestionar (CRUD).
  - `authenticated_read_roles`: Usuarios autenticados solo lectura.
- **user_company_roles:**
  - `super_admin_all_ucr`: Super Admin puede gestionar.
  - `users_read_own_ucr`: Usuarios solo leen sus propios roles.
  - `company_admin_manage_ucr`: Company Admin puede gestionar roles solo de su empresa.

**Funciones helper:** `is_super_admin()`, `usuario_tiene_acceso_empresa(company_id)`.

### 2. Onboarding robusto ante fallos

- **Rollback de Auth user:** Si falla profile o user_company_roles tras crear el usuario en Auth, se elimina el usuario (`auth.admin.deleteUser`) para evitar huérfanos.
- **Orden de creación:** Empresa → Branding → Módulos → Secciones → Widgets → Admin (Auth + profile + user_company_roles). Si falla en cualquier paso, rollback de lo creado.
- **Admin client:** El onboarding usa `getSupabaseAdminClient()` para todas las operaciones de BD, evitando problemas con RLS.

### 3. Control de acceso

- **Server action:** Verifica `session.profile?.is_super_admin` antes de ejecutar.
- **Página /empresas/nuevo:** Redirige a `/empresas` si el usuario no es Super Admin.
- **Service Role Key:** Solo en servidor, nunca en frontend.

### 4. Mensajes de error

| Código | Mensaje |
|--------|---------|
| COMPANY_SLUG_EXISTS | Ya existe una empresa con ese slug. Usa otro slug. |
| BRANDING_FAILED | Error al configurar el branding de la empresa |
| MODULES_FAILED | Error al configurar los módulos de la empresa |
| SECTIONS_FAILED | Error al configurar las secciones de los módulos |
| WIDGETS_FAILED | Error al configurar los widgets del dashboard |
| ADMIN_FAILED | Mensaje específico (email duplicado, contraseña corta, etc.) |
| AUTH_USER_EXISTS | Ya existe un usuario con ese correo |
| ROLE_NOT_FOUND | Rol company_admin no configurado. Ejecuta las migraciones. |

### 5. Estructura de notificación

- **`lib/notifications/onboarding-notify.ts`:** Contrato para notificar al admin creado.
- Por ahora solo log en desarrollo; preparado para integrar Resend, SendGrid, etc.
- No bloquea el flujo si falla.

---

## Riesgos resueltos

| Riesgo | Solución |
|--------|----------|
| Usuario huérfano en Auth | Rollback: `deleteAuthUser()` si falla profile o user_company_roles |
| Empresa sin configuración | Rollback en cascada: borrar company elimina branding, módulos, etc. |
| Escalada de privilegios | RLS: solo super_admin gestiona roles; company_admin solo su empresa |
| Acceso no autorizado | Verificación is_super_admin en action y página |
| Service Role en frontend | Solo en lib/supabase-admin.ts, usado solo en servidor |
| Errores poco claros | Códigos y mensajes específicos por tipo de fallo |

---

## Parte del onboarding ya segura

- Creación de empresa, branding, módulos, secciones, widgets.
- Creación de usuario en Auth con rollback si falla lo posterior.
- Asignación de rol company_admin.
- Verificación de Super Admin antes de ejecutar.
- Mensajes de error claros al usuario.
- RLS en roles y user_company_roles.

---

## Pendiente (mejoras futuras)

- **Notificación por email:** Integrar proveedor (Resend, etc.) en `onboarding-notify.ts`.
- **RLS en otras tablas:** companies, company_branding, etc. (migración 003 puede no estar aplicada).
- **Auditoría:** Registrar en log quién creó cada empresa y cuándo.
- **Rate limiting:** Limitar intentos de onboarding por IP/usuario.
