# Centro de Control Empresas - Resumen de Cambios

## Cambios realizados

### 1. Migración `20250321000008_empresas_centro_control.sql`

- **companies:** Nuevas columnas `company_type` (ecommerce | inmobiliaria | servicios | personalizado) y `description` (opcional).
- **module_sections:** Tabla creada con secciones Catálogo y Stock para el módulo Productos.
- **company_module_sections:** Tabla para configurar secciones por empresa.
- **dashboard_widgets:** Tabla con widgets: ventas_dia, ventas_mes, top_productos, propiedades_vistas, consultas.
- **company_dashboard_widgets:** Tabla para configurar widgets por empresa.
- **form_definitions, form_fields, company_form_fields:** Estructura base para formularios dinámicos (producto: nombre, precio, descripción).
- **company_branding:** Tabla para nombre comercial, logo y color principal por empresa.

### 2. Formulario de creación de empresa

- Campos: nombre, slug, **tipo de empresa** (obligatorio), descripción (opcional), estado (activo/inactivo).
- UI: formulario colapsable, agrupación de campos, feedback visual.
- Validación de slug (solo letras minúsculas, números y guiones).

### 3. Sistema de templates por tipo

Al crear una empresa, se aplica automáticamente:

| Tipo        | Módulos                    | Secciones (Productos) | Widgets                          |
|------------|----------------------------|------------------------|----------------------------------|
| ecommerce  | dashboard, productos, usuarios | Catálogo, Stock       | ventas_dia, ventas_mes, top_productos |
| inmobiliaria | dashboard, productos       | Catálogo               | propiedades_vistas, consultas    |
| servicios  | dashboard                  | -                      | ventas_dia, ventas_mes           |
| personalizado | -                        | -                      | -                                |

### 4. Redirección post-creación

Tras crear una empresa, se redirige automáticamente a `/empresas/[id]/configurar`.

### 5. Pantalla de configuración con pestañas

- **Módulos:** Activar/desactivar módulos y secciones por empresa.
- **Dashboard:** Activar/desactivar widgets del dashboard.
- **Formularios:** Configurar visibilidad y requisitos de campos por formulario.
- **Branding:** Nombre comercial, color principal, URL del logo.

### 6. Servicios nuevos/actualizados

- `company-templates-service.ts`: Aplica templates según tipo de empresa.
- `company-dashboard-service.ts`: CRUD de widgets por empresa.
- `company-forms-service.ts`: CRUD de campos de formulario por empresa.
- `companies-service.ts`: Extendido con company_type, description y llamada a templates.
- `company-branding-service.ts`: Sin cambios (ya existía).

---

## Flujo completo de creación de empresa

1. Super Admin va a **Empresas**.
2. Expande **Nueva empresa**.
3. Completa: nombre, slug, tipo (ecommerce/inmobiliaria/servicios/personalizado), descripción opcional, estado.
4. Pulsa **Crear empresa**.
5. Se crea la empresa en `companies` con `company_type` y `description`.
6. Se aplica el template: se insertan filas en `company_modules`, `company_module_sections`, `company_dashboard_widgets` según el tipo.
7. Se redirige a `/empresas/[id]/configurar`.
8. El Super Admin puede ajustar en cada pestaña:
   - Módulos y secciones
   - Widgets del dashboard
   - Campos de formularios
   - Branding

---

## Cómo aplicar la migración

```bash
# Opción 1: Supabase CLI (proyecto remoto)
supabase db push

# Opción 2: SQL manual en Supabase Dashboard > SQL Editor
# Ejecutar el contenido de supabase/migrations/20250321000008_empresas_centro_control.sql
```

---

## Pendiente / no implementado

- **RLS:** Las tablas nuevas no tienen políticas RLS. El sistema asume Super Admin con acceso total.
- **CRUD de formularios:** Solo se configuran campos existentes; no hay creación/edición de form_definitions ni form_fields desde la UI.
- **Configuración de widgets:** Solo activar/desactivar; no hay edición de `config` por widget.
- **Módulos Dashboard, Productos, Usuarios:** Las páginas aún no consumen la configuración de widgets ni de formularios; la estructura está lista para cuando se implementen.
