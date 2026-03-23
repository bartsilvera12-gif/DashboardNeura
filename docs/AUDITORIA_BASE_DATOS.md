# Auditoría Completa de Base de Datos - DashboardNeura SaaS

**Proyecto Supabase:** paginas web neura  
**Fecha:** 21 de marzo de 2025  
**Alcance:** Esquema `public` completo

---

## 1. INVENTARIO COMPLETO

### 1.1 Tablas existentes en `public`

| Tabla | PK | RLS | Origen |
|-------|-----|-----|--------|
| companies | id (UUID) | No | SaaS (migración 007) |
| company_modules | id (UUID) | No | SaaS (migración 007) |
| modules | id (UUID) | No | SaaS (migración 007) |
| neighborhoods | id | Sí | Proyecto previo (inmobiliaria) |
| orders | id | Sí | Proyecto previo (e-commerce) |
| product_images | id | Sí | Proyecto previo |
| product_images_inmobiliaria | id | Sí | Proyecto previo (inmobiliaria) |
| products | id | Sí | Proyecto previo (e-commerce) |
| products_inmobiliaria | id | Sí | Proyecto previo (inmobiliaria) |
| profiles | id (UUID) | Sí | Proyecto previo + adaptación SaaS |
| property_types | id | Sí | Proyecto previo (inmobiliaria) |
| property_valuation_rules | id | Sí | Proyecto previo (inmobiliaria) |
| quotes | id | Sí | Proyecto previo |
| stores | id | No | Proyecto previo (e-commerce/inmobiliaria) |

### 1.2 Estructura de tablas críticas para el SaaS

#### profiles (adaptada)
| Columna | Tipo | Nullable | Propósito |
|---------|------|----------|-----------|
| id | UUID | NO | FK → auth.users.id |
| email | TEXT | SÍ | Email del usuario |
| full_name | TEXT | SÍ | Nombre completo |
| role | TEXT | SÍ | Rol legacy (admin, etc.) |
| store_id | UUID | SÍ | FK → stores (modelo legacy) |
| created_at | TIMESTAMP | SÍ | Fecha creación |
| is_super_admin | BOOLEAN | NO | Flag Super Admin (añadido migración 006) |
| updated_at | TIMESTAMPTZ | NO | Fecha actualización (añadido migración 006) |

**Nota:** La tabla `profiles` tiene **dos modelos de negocio mezclados**:
- **Legacy:** `store_id` + `role` (un usuario → una tienda)
- **SaaS:** `is_super_admin` (un usuario puede ser Super Admin global)

#### companies
| Columna | Tipo | Propósito |
|---------|------|-----------|
| id | UUID | PK |
| name | TEXT | Nombre de la empresa |
| slug | TEXT | Identificador URL (único) |
| is_active | BOOLEAN | Activa/inactiva |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### modules
| Columna | Tipo | Propósito |
|---------|------|-----------|
| id | UUID | PK |
| code | TEXT | Código único (dashboard, productos, etc.) |
| name | TEXT | Nombre legible |
| path | TEXT | Ruta (/dashboard, /productos) |
| sort_order | INT | Orden en menú |
| is_active | BOOLEAN | Módulo activo |
| created_at | TIMESTAMPTZ | |

#### company_modules
| Columna | Tipo | Propósito |
|---------|------|-----------|
| id | UUID | PK |
| company_id | UUID | FK → companies |
| module_id | UUID | FK → modules |
| is_enabled | BOOLEAN | Módulo visible para empresa |
| sort_order | INT | Orden en menú de la empresa |
| created_at | TIMESTAMPTZ | |

#### stores (legacy)
| Columna | Tipo | Propósito |
|---------|------|-----------|
| id | UUID | PK |
| ... | ... | Tiendas del e-commerce/inmobiliaria |

---

## 2. RELACIONES ENTRE TABLAS

### 2.1 Diagrama de relaciones (existente)

```
auth.users
    └── profiles (id = auth.users.id)
            └── store_id → stores

stores (núcleo legacy)
    ├── profiles (1 usuario : 1 store)
    ├── orders
    ├── products
    ├── product_images
    ├── product_images_inmobiliaria
    ├── products_inmobiliaria
    ├── property_types
    ├── property_valuation_rules
    └── quotes

companies (núcleo SaaS)
    └── company_modules
            ├── company_id → companies
            └── module_id → modules

modules
    └── (standalone, referenciado por company_modules)

neighborhoods
    └── store_id → stores (implícito en RLS)
```

### 2.2 Tipos de relación

| Relación | Tipo | Descripción |
|----------|------|-------------|
| auth.users ↔ profiles | 1-1 | Un usuario Auth = un perfil |
| profiles → stores | N-1 | Un perfil pertenece a una tienda (legacy) |
| companies ↔ company_modules | 1-N | Una empresa tiene muchos módulos configurados |
| modules ↔ company_modules | 1-N | Un módulo puede estar en muchas empresas |
| stores → products, orders, etc. | 1-N | Una tienda tiene muchos productos, pedidos, etc. |

### 2.3 Desconexión crítica

**No existe relación entre:**
- `profiles` y `companies` (debería existir `user_company_roles`)
- `profiles` y `stores` vs `companies` — son dos modelos de multi-tenancy distintos:
  - **stores:** modelo legacy (1 usuario : 1 tienda)
  - **companies:** modelo SaaS (1 usuario : N empresas vía roles)

---

## 3. PROPÓSITO DE CADA TABLA

### Tablas del SaaS (DashboardNeura)

| Tabla | Representa | Uso en sistema | Consumidor |
|-------|------------|----------------|-------------|
| **companies** | Empresas del SaaS | CRUD en /empresas, selector de empresa activa | companies-service, session, layout |
| **modules** | Módulos del sistema (Dashboard, Productos, etc.) | Menú lateral dinámico | company-config, company-modules-service |
| **company_modules** | Qué módulos ve cada empresa | Layout, navegación | company-config |
| **profiles** | Perfil extendido de usuario Auth | Login, is_super_admin, sesión | session, auth |

### Tablas legacy (proyecto previo)

| Tabla | Representa | Uso en sistema | Consumidor |
|-------|------------|----------------|-------------|
| **stores** | Tiendas (e-commerce/inmobiliaria) | Modelo de datos previo | products, orders, profiles, etc. |
| **products** | Productos de tienda | Catálogo e-commerce | (no usado por SaaS actual) |
| **product_images** | Imágenes de productos | Galería | (no usado por SaaS actual) |
| **products_inmobiliaria** | Propiedades inmobiliarias | Inmobiliaria | (no usado por SaaS actual) |
| **product_images_inmobiliaria** | Imágenes de propiedades | Inmobiliaria | (no usado por SaaS actual) |
| **orders** | Pedidos | E-commerce | (no usado por SaaS actual) |
| **quotes** | Cotizaciones | Inmobiliaria | (no usado por SaaS actual) |
| **neighborhoods** | Barrios | Inmobiliaria | products_inmobiliaria |
| **property_types** | Tipos de propiedad | Inmobiliaria | products_inmobiliaria |
| **property_valuation_rules** | Reglas de valuación | Inmobiliaria | (no usado por SaaS actual) |

---

## 4. DEPENDENCIAS CRÍTICAS

### 4.1 Núcleo del SaaS (orden de dependencia)

```
1. auth.users (Supabase Auth)
2. profiles (extiende auth, añade is_super_admin)
3. companies
4. modules
5. company_modules (depende de 3 y 4)
```

### 4.2 Impacto de eliminación

| Si se elimina... | Impacto |
|------------------|---------|
| companies | Layout sin empresas, módulo Empresas inutilizable, company_modules huérfanas |
| modules | Menú vacío, company_modules huérfanas |
| company_modules | Layout muestra todos los módulos por defecto (fallback en código) |
| profiles | Login falla, no hay is_super_admin |
| stores | Rompe profiles, products, orders, etc. (legacy) |

### 4.3 Tablas que el código espera pero NO existen

| Tabla | Usada por | Impacto actual |
|-------|-----------|----------------|
| user_company_roles | session.ts (getCompaniesForUser) | **Error en runtime** para usuarios no super_admin |
| company_module_sections | company-config, company-modules-service | Fallback a vacío, secciones no configurables |
| module_sections | company-config, company-modules-service | Fallback a vacío |
| dashboard_widgets | company-config | Fallback a [] |
| company_dashboard_widgets | company-config | Fallback a [] |
| form_definitions | company-config | Fallback a [] |
| form_fields | company-config | Fallback a [] |
| company_form_fields | company-config | Fallback a [] |
| company_branding | company-config, company-branding-service | **Error** si se llama getCompanyBranding |
| roles | (esperada en arquitectura) | No usada aún |
| permissions | (esperada en arquitectura) | No usada aún |
| role_permissions | (esperada en arquitectura) | No usada aún |

---

## 5. IMPACTO EN EL SISTEMA

### 5.1 Por funcionalidad

| Funcionalidad | Tablas que usa | Estado |
|---------------|----------------|--------|
| **Auth / Login** | auth.users, profiles | ✅ Funcional |
| **Layout (menú)** | modules, company_modules | ✅ Funcional (con fallback) |
| **Empresa activa** | companies | ✅ Funcional |
| **Módulo Empresas** | companies | ✅ Funcional |
| **Configurar empresa** | company_modules, company_module_sections | ⚠️ Parcial (company_module_sections no existe) |
| **Branding** | company_branding | ❌ Tabla no existe |
| **Dashboard widgets** | dashboard_widgets, company_dashboard_widgets | ❌ Tablas no existen |
| **Formularios dinámicos** | form_definitions, form_fields, company_form_fields | ❌ Tablas no existen |
| **Roles por empresa** | user_company_roles, roles | ❌ Tablas no existen |

### 5.2 Por módulo del frontend

| Módulo | Tablas | Estado |
|--------|--------|--------|
| Login | profiles | ✅ |
| Layout / Sidebar | modules, company_modules, companies, profiles | ✅ |
| Empresas (lista, crear) | companies | ✅ |
| Empresas (configurar) | company_modules, company_module_sections, company_branding | ⚠️ Parcial |
| Dashboard | (dashboard_widgets) | ❌ No implementado |
| Productos | (products, form_definitions) | ❌ No conectado al SaaS |
| Usuarios | (user_company_roles) | ❌ No implementado |

---

## 6. POLÍTICAS DE SEGURIDAD (RLS)

### 6.1 Tablas con RLS activo

| Tabla | RLS | Políticas |
|-------|-----|-----------|
| profiles | Sí | "Users can see their own profile" (id = auth.uid()) |
| neighborhoods | Sí | Por store_id vía profiles.store_id |
| orders | Sí | CRUD por store_id vía profiles.store_id |
| product_images | Sí | Por store_id vía profiles.store_id |
| product_images_inmobiliaria | Sí | (similar) |
| products | Sí | CRUD + SELECT público por store_id |
| products_inmobiliaria | Sí | (similar) |
| property_types | Sí | Por store_id |
| property_valuation_rules | Sí | Por store_id |
| quotes | Sí | Por store_id |

### 6.2 Tablas SIN RLS (riesgo)

| Tabla | Riesgo |
|-------|--------|
| companies | Cualquier usuario autenticado puede leer/escribir todas las empresas |
| company_modules | Cualquier usuario puede modificar configuración de cualquier empresa |
| modules | Lectura/escritura sin restricción |
| stores | Sin RLS |

### 6.3 Modelo de seguridad actual vs esperado

**Actual (legacy):**
- Todas las políticas usan `profiles.store_id` — modelo 1 usuario : 1 tienda
- No existe `is_super_admin` en las políticas
- No existe `usuario_tiene_acceso_empresa(company_id)`

**Esperado (SaaS):**
- `is_super_admin()` → acceso total
- `usuario_tiene_acceso_empresa(company_id)` → vía user_company_roles
- companies, company_* con políticas por empresa

**Conclusión:** La seguridad RLS del SaaS **no está aplicada**. Las tablas companies, modules, company_modules son accesibles sin restricción por cualquier usuario autenticado.

---

## 7. COMPARACIÓN CON ARQUITECTURA ESPERADA

### 7.1 Estado por tabla

| Tabla esperada | Existe | Completa | Notas |
|----------------|--------|----------|-------|
| profiles | ✅ | ⚠️ | Tiene is_super_admin pero también store_id, role (legacy) |
| companies | ✅ | ✅ | |
| roles | ❌ | - | No existe |
| user_company_roles | ❌ | - | No existe |
| modules | ✅ | ✅ | |
| module_sections | ❌ | - | No existe |
| company_modules | ✅ | ✅ | |
| company_module_sections | ❌ | - | No existe |
| dashboard_widgets | ❌ | - | No existe |
| company_dashboard_widgets | ❌ | - | No existe |
| form_definitions | ❌ | - | No existe |
| form_fields | ❌ | - | No existe |
| company_form_fields | ❌ | - | No existe |
| company_branding | ❌ | - | No existe |
| permissions | ❌ | - | No existe |
| role_permissions | ❌ | - | No existe |

### 7.2 Resumen

- **Completo:** companies, modules, company_modules
- **Parcial:** profiles (modelo híbrido)
- **Falta:** 11 tablas del modelo SaaS esperado

---

## 8. PROBLEMAS Y RIESGOS

### 8.1 Inconsistencias

1. **Dos modelos de multi-tenancy:** `stores` (legacy) vs `companies` (SaaS) sin puente
2. **profiles.store_id** apunta a stores, no a companies
3. **Super Admin** se identifica por `is_super_admin` pero no hay `user_company_roles` para usuarios normales

### 8.2 Duplicaciones / Redundancia

1. **products** y **products_inmobiliaria** — dos modelos de producto
2. **product_images** y **product_images_inmobiliaria** — dos modelos de imágenes

### 8.3 Relaciones incorrectas o faltantes

1. **profiles → companies:** Debería existir vía `user_company_roles`
2. **companies → company_branding:** Tabla inexistente
3. **modules → module_sections:** Tabla module_sections inexistente

### 8.4 Riesgos de escalabilidad

1. Sin `user_company_roles`, no se puede asignar usuarios a empresas
2. Sin `company_branding`, no hay personalización por empresa
3. Sin `form_definitions`/`form_fields`, formularios serán hardcodeados

### 8.5 Problemas de seguridad

1. **companies, company_modules, modules sin RLS** — acceso abierto
2. Políticas legacy usan `store_id`; el SaaS usa `company_id` — desconexión
3. No existe función `is_super_admin()` en la base de datos (solo en migraciones no aplicadas)

---

## 9. MAPA DEL SISTEMA

### 9.1 Flujo actual (lo que funciona)

```
Auth (Supabase) 
    → auth.users
    → profiles (id, is_super_admin)
    
Session (getSession)
    → profiles (is_super_admin)
    → companies (si super_admin)
    → user_company_roles (FALLA - tabla no existe, solo para no super_admin)
    
Layout
    → getCompanyModules(activeCompanyId)
    → modules
    → company_modules (por company_id)
    
Módulo Empresas
    → companies (CRUD)
    → company_modules (configurar)
    → company_module_sections (FALLA - tabla no existe)
    → company_branding (FALLA - tabla no existe)
```

### 9.2 Flujo esperado (arquitectura objetivo)

```
Auth → profiles (is_super_admin)
profiles + companies → user_company_roles (rol por empresa)
companies → company_modules → layout (menú)
companies → company_module_sections (secciones por módulo)
companies → company_dashboard_widgets → dashboard
companies → company_form_fields → formularios
companies → company_branding → UI (nombre, logo, color)
modules → module_sections (secciones internas)
form_definitions → form_fields (campos por formulario)
roles → role_permissions → permisos
```

### 9.3 Tablas legacy (fuera del SaaS actual)

```
stores → profiles (store_id)
stores → products, orders, quotes
stores → products_inmobiliaria, property_types, etc.
neighborhoods, property_valuation_rules
```

---

## 10. RECOMENDACIONES PRIORITARIAS

### Prioridad 1 (bloquea funcionalidad)
1. Crear `user_company_roles` — sin ella, usuarios no super_admin no pueden acceder a empresas
2. Crear `company_branding` — el código la invoca en getCompanyBranding
3. Aplicar RLS a companies, company_modules, modules

### Prioridad 2 (completa configuración)
4. Crear `module_sections` y `company_module_sections`
5. Crear `dashboard_widgets` y `company_dashboard_widgets`
6. Crear `form_definitions`, `form_fields`, `company_form_fields`

### Prioridad 3 (arquitectura completa)
7. Crear `roles`, `permissions`, `role_permissions`
8. Añadir funciones `is_super_admin()` y `usuario_tiene_acceso_empresa()` 
9. Definir estrategia para convivencia stores vs companies (migración o coexistencia)

---

**Fin del informe de auditoría.**
