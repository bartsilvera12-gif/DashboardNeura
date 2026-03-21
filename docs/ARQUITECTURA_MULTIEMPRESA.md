# Arquitectura SaaS Multiempresa - DashboardNeura

## Visión general

Sistema configurable donde un **Super Admin** controla por empresa:
- Módulos visibles
- Secciones internas por módulo
- Widgets del dashboard
- Campos de formularios (visibilidad, requerido, editable, orden)
- Branding (nombre, logo, color)
- Roles y permisos

---

## Modelo de datos Supabase

### Diagrama de relaciones (resumido)

```
auth.users (Supabase Auth)
    └── profiles (extiende usuario)
            └── user_company_roles (usuario ↔ empresa ↔ rol)

companies (empresas)
    ├── company_modules (qué módulos ve)
    ├── company_module_sections (qué secciones ve por módulo)
    ├── company_dashboard_widgets (qué widgets en dashboard)
    ├── company_form_fields (config de campos por formulario)
    ├── company_branding (identidad visual)
    └── company_roles (roles personalizados por empresa)

modules (módulos del sistema)
    └── module_sections (secciones internas)

dashboard_widgets (widgets disponibles)
form_definitions (formularios por entidad/módulo)
    └── form_fields (campos del formulario)

roles (roles globales)
permissions (permisos granulares)
    └── role_permissions (permisos por rol)
```

---

## Tablas detalladas

### 1. `companies`
Empresas del sistema.

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    | Identificador                  |
| name          | text         | Nombre interno                 |
| slug          | text (unique)| Identificador URL-friendly     |
| is_active     | boolean      | Activa/inactiva                |
| created_at    | timestamptz  | Fecha creación                 |
| updated_at    | timestamptz  | Fecha actualización            |

### 2. `profiles`
Extensión de auth.users. Vincula usuario con rol global (super_admin).

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK,FK) | = auth.users.id                |
| email         | text         | Email (copia)                  |
| full_name     | text         | Nombre completo                |
| is_super_admin| boolean      | Si es Super Admin global       |
| created_at    | timestamptz  |                                |
| updated_at    | timestamptz  |                                |

### 3. `roles`
Roles del sistema (globales y por empresa).

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| code          | text (unique)| super_admin, company_admin, vendedor, etc. |
| name          | text         | Nombre legible                 |
| scope         | enum         | 'global' | 'company' (rol por empresa)    |
| created_at    | timestamptz  |                                |

### 4. `user_company_roles`
Asignación usuario-empresa-rol.

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| user_id       | uuid (FK)    | profiles.id                    |
| company_id    | uuid (FK)    | companies.id                   |
| role_id       | uuid (FK)    | roles.id                       |
| created_at    | timestamptz  |                                |

### 5. `modules`
Módulos del sistema (productos, dashboard, usuarios, empresas).

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| code          | text (unique)| dashboard, productos, usuarios, empresas |
| name          | text         | Nombre legible                 |
| path          | text         | Ruta /productos, /dashboard    |
| sort_order    | int          | Orden en menú                  |
| is_active     | boolean      | Módulo activo en sistema       |
| created_at    | timestamptz  |                                |

### 6. `module_sections`
Secciones internas de cada módulo.

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| module_id     | uuid (FK)    | modules.id                     |
| code          | text         | catalogo, stock, etc.          |
| name          | text         | Nombre legible                 |
| sort_order    | int          | Orden dentro del módulo        |
| created_at    | timestamptz  |                                |

### 7. `company_modules`
Qué módulos ve cada empresa.

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| company_id    | uuid (FK)    | companies.id                   |
| module_id     | uuid (FK)    | modules.id                     |
| is_enabled    | boolean      | Módulo visible para empresa   |
| sort_order    | int          | Orden en menú de la empresa    |
| created_at    | timestamptz  |                                |

### 8. `company_module_sections`
Qué secciones ve cada empresa dentro de cada módulo.

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| company_id    | uuid (FK)    | companies.id                   |
| module_section_id | uuid (FK) | module_sections.id             |
| is_enabled    | boolean      | Sección visible                |
| sort_order    | int          | Orden                         |
| created_at    | timestamptz  |                                |

### 9. `dashboard_widgets`
Widgets disponibles para el dashboard.

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| code          | text (unique)| ventas_dia, top_productos, etc.|
| name          | text         | Nombre legible                 |
| description   | text         | Descripción                    |
| default_config| jsonb        | Config por defecto             |
| sort_order    | int          | Orden por defecto              |
| created_at    | timestamptz  |                                |

### 10. `company_dashboard_widgets`
Qué widgets ve cada empresa en su dashboard.

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| company_id    | uuid (FK)    | companies.id                   |
| widget_id     | uuid (FK)    | dashboard_widgets.id           |
| is_enabled    | boolean      | Widget visible                 |
| config        | jsonb        | Config específica empresa      |
| sort_order    | int          | Orden en dashboard             |
| created_at    | timestamptz  |                                |

### 11. `form_definitions`
Definición de formularios (por entidad/módulo).

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| module_id     | uuid (FK)    | modules.id                     |
| entity_code   | text         | producto, cliente, etc.        |
| form_code     | text         | crear, editar, listar          |
| name          | text         | Nombre legible                 |
| created_at    | timestamptz  |                                |

### 12. `form_fields`
Campos disponibles en cada formulario.

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| form_definition_id | uuid (FK) | form_definitions.id            |
| code          | text         | titulo, precio, sku, etc.      |
| name          | text         | Nombre legible                 |
| type          | text         | text, number, select, etc.     |
| default_required | boolean   | Requerido por defecto          |
| default_visible | boolean    | Visible por defecto            |
| default_editable | boolean   | Editable por defecto           |
| default_sort_order | int      | Orden por defecto              |
| options       | jsonb        | Opciones para select, etc.     |
| created_at    | timestamptz  |                                |

### 13. `company_form_fields`
Configuración de campos por empresa (override).

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| company_id    | uuid (FK)    | companies.id                   |
| form_field_id | uuid (FK)    | form_fields.id                 |
| is_visible    | boolean      | Override visibilidad           |
| is_required   | boolean      | Override requerido             |
| is_editable   | boolean      | Override editable              |
| sort_order    | int          | Override orden                 |
| created_at    | timestamptz  |                                |

### 14. `company_branding`
Identidad visual por empresa.

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| company_id    | uuid (FK)    | companies.id (unique)          |
| display_name  | text         | Nombre comercial               |
| logo_url      | text         | URL del logo (Supabase Storage)|
| primary_color | text         | Hex #RRGGBB                    |
| created_at    | timestamptz  |                                |
| updated_at    | timestamptz  |                                |

### 15. `permissions`
Permisos granulares del sistema.

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| code          | text (unique)| productos.create, etc.         |
| name          | text         | Nombre legible                 |
| resource      | text         | productos, empresas, etc.      |
| action        | text         | create, read, update, delete   |
| created_at    | timestamptz  |                                |

### 16. `role_permissions`
Permisos asignados a cada rol.

| Columna       | Tipo         | Descripción                    |
|---------------|--------------|--------------------------------|
| id            | uuid (PK)    |                                |
| role_id       | uuid (FK)    | roles.id                       |
| permission_id | uuid (FK)    | permissions.id                 |
| created_at    | timestamptz  |                                |

---

## Flujo de configuración

1. **Super Admin** crea empresa → `companies`
2. Super Admin activa módulos → `company_modules`
3. Super Admin activa secciones → `company_module_sections`
4. Super Admin configura dashboard → `company_dashboard_widgets`
5. Super Admin configura campos de formularios → `company_form_fields`
6. Super Admin define branding → `company_branding`
7. Super Admin asigna roles a usuarios → `user_company_roles`

---

## RLS (Row Level Security)

- `companies`: Super Admin ve todas; usuarios ven solo las suyas (via user_company_roles)
- `company_*`: Solo Super Admin o company_admin de esa empresa
- `profiles`: Usuario ve su propio perfil
- Tablas de definición (`modules`, `form_definitions`, etc.): Lectura para usuarios autenticados; escritura solo Super Admin

---

## Ubicación en frontend

```
lib/
  supabase/
    server.ts         # Cliente Supabase (server)
  supabase.ts         # Reexport getSupabaseClient (compatibilidad)
  config/
    company-config.ts       # getCompanyModules, getCompanyDashboardWidgets,
                            # getCompanyFormFields, getCompanyBranding, getCompanies
    companies-service.ts    # CRUD empresas
    company-modules-service.ts  # Config módulos/secciones por empresa
    company-branding-service.ts # Config branding
  types/
    database.ts       # Tipos TypeScript del esquema
  constants/
    modules.ts        # Códigos de módulos
    roles.ts          # Códigos de roles

app/(saas)/
  layout.tsx          # Módulos dinámicos desde getCompanyModules(companyId)
  empresas/           # Módulo Super Admin
    page.tsx          # Lista de empresas
    actions.ts        # Server Actions: create, update, toggle
    empresas-list.tsx # Componente cliente con formularios
    [id]/configurar/
      page.tsx        # Configuración por empresa
      company-config-panel.tsx  # Tabs: módulos, branding
```

## Uso de la configuración

### Obtener módulos para el menú

```ts
const { modules } = await getCompanyModules(companyId);
// modules: Array<Module & { is_enabled, sort_order }>
```

### Obtener campos de formulario (ej: crear producto)

```ts
const { fields } = await getCompanyFormFields(
  companyId,
  "productos",
  "producto",
  "crear"
);
// fields: ResolvedFormField[] con is_visible, is_required, is_editable, sort_order
```

### Obtener widgets del dashboard

```ts
const { widgets } = await getCompanyDashboardWidgets(companyId);
```

### Obtener branding

```ts
const branding = await getCompanyBranding(companyId);
// branding.display_name, logo_url, primary_color
```
