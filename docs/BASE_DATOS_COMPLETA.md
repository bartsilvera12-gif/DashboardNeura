# Base de Datos Completa - Proyecto "paginas web neura"

**Documento de referencia técnica**  
**Objetivo:** Entender exactamente qué existe, para qué sirve, qué afecta qué, y cómo planificar cambios sin romper el sistema.

---

# PARTE 0: MIGRACIONES vs ESTADO REAL

## Qué define cada migración

| Migración | Define | Estado en Supabase |
|-----------|--------|--------------------|
| 001_initial_schema | companies, profiles (sin store_id), roles, user_company_roles, modules, module_sections, company_modules, company_module_sections, dashboard_widgets, company_dashboard_widgets, form_definitions, form_fields, company_form_fields, company_branding, permissions, role_permissions | **No aplicada.** El proyecto ya tenía esquema previo. |
| 002_seed_data | Datos iniciales | Depende de 001 |
| 003_rls_policies | RLS en todas las tablas SaaS | **Falla** si las tablas no existen (user_company_roles, etc.) |
| 004_super_admin_profile | Asignar super admin | - |
| 005_auto_create_profile | Trigger para crear perfil | - |
| 006_adapt_profiles_super_admin | Añade is_super_admin, updated_at a profiles | **Aplicada.** profiles tiene columnas legacy + SaaS. |
| 007_saas_core_tables | companies, modules, company_modules (IF NOT EXISTS) + seed módulos | **Aplicada.** Solo crea lo que no existe. |

## Conclusión

- **profiles** existía antes con `store_id`, `role` (legacy). La migración 006 añadió `is_super_admin` y `updated_at`.
- **companies, modules, company_modules** existen (creadas por 007).
- **roles, user_company_roles, module_sections, company_module_sections, company_branding, dashboard_widgets, company_dashboard_widgets, form_definitions, form_fields, company_form_fields, permissions, role_permissions** están definidos en 001 pero **no existen** en el proyecto actual. La migración 001 no se aplicó porque el proyecto ya tenía un esquema legacy distinto.

---

# PARTE 1: INVENTARIO DE TABLAS

## Tabla: `profiles`

### Columnas (estructura real en Supabase)

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | - | **PK.** Referencia a auth.users.id. Un perfil por usuario. |
| email | TEXT | SÍ | - | Email (copia de auth.users) |
| full_name | TEXT | SÍ | - | Nombre completo |
| role | TEXT | SÍ | 'admin' | **Legacy.** Rol del usuario en el modelo stores (admin, etc.) |
| store_id | UUID | SÍ | - | **FK → stores.** **Legacy.** Tienda asignada al usuario. |
| created_at | TIMESTAMP | SÍ | now() | Fecha de creación |
| is_super_admin | BOOLEAN | NO | false | **SaaS.** Si true, usuario tiene acceso total a todas las empresas |
| updated_at | TIMESTAMPTZ | NO | now() | **SaaS.** Fecha de última actualización |

### Para qué sirve

- **Modelo legacy:** Vincula usuario (auth) con una tienda (`store_id`). Todas las políticas RLS de orders, products, etc. usan `profiles.store_id` para filtrar.
- **Modelo SaaS:** `is_super_admin` determina si el usuario ve todas las empresas o solo las asignadas en `user_company_roles` (tabla que no existe aún).

### Quién la usa

| Archivo | Uso |
|---------|-----|
| `lib/auth/session.ts` | SELECT por id para obtener perfil e is_super_admin |
| RLS de neighborhoods, orders, products, etc. | Subconsulta `profiles.store_id WHERE profiles.id = auth.uid()` |

### Qué afecta

- **Auth:** Sin perfil, el layout muestra "Perfil no encontrado" y bloquea acceso.
- **Empresas:** is_super_admin=true → ve todas las companies. is_super_admin=false → debería usar user_company_roles (no existe).
- **Legacy:** store_id determina qué orders, products, quotes puede ver el usuario.

### Si modificas o eliminas

- **Eliminar columna store_id:** Rompe todas las políticas RLS de orders, products, product_images, quotes, neighborhoods, property_types, property_valuation_rules.
- **Eliminar is_super_admin:** El SaaS no puede identificar Super Admins; getCompaniesForUser siempre intentaría user_company_roles y fallaría.
- **Eliminar role:** Puede afectar lógica legacy que dependa del rol.

---

## Tabla: `stores`

### Columnas (inferidas por FKs)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | **PK** |
| (otras) | - | Datos de la tienda (nombre, etc.) |

### Para qué sirve

- **Núcleo del modelo legacy.** Representa tiendas/negocios del e-commerce e inmobiliaria.
- Todas las tablas legacy (products, orders, quotes, profiles, etc.) referencian stores mediante `store_id`.

### Quién la usa

- **profiles:** store_id → cada usuario pertenece a una tienda
- **orders:** store_id → pedidos de la tienda
- **products:** store_id → productos de la tienda
- **product_images:** store_id → imágenes de productos de la tienda
- **products_inmobiliaria:** store_id → propiedades de la tienda
- **product_images_inmobiliaria:** store_id
- **property_types:** store_id
- **property_valuation_rules:** store_id
- **quotes:** store_id

### Qué afecta

- **RLS:** Todas las políticas legacy filtran por `store_id = (SELECT store_id FROM profiles WHERE id = auth.uid())`.
- **No usada por el SaaS DashboardNeura** actual. El SaaS usa `companies`, no `stores`.

### Si modificas o eliminas

- **Eliminar stores:** Rompe FKs de profiles, orders, products, product_images, products_inmobiliaria, product_images_inmobiliaria, property_types, property_valuation_rules, quotes.
- **Cambiar id:** Rompe todas las referencias. Requiere migración en cascada.

---

## Tabla: `companies`

### Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | **PK** |
| name | TEXT | NO | - | Nombre de la empresa |
| slug | TEXT | NO | - | **UNIQUE.** Identificador URL (ej: mi-empresa) |
| is_active | BOOLEAN | NO | true | Si la empresa está activa |
| created_at | TIMESTAMPTZ | NO | now() | Fecha creación |
| updated_at | TIMESTAMPTZ | NO | now() | Fecha actualización |

### Para qué sirve

- **Núcleo del SaaS.** Representa empresas del sistema multiempresa.
- Cada empresa puede tener módulos, branding y configuración propia.

### Quién la usa

| Archivo | Uso |
|---------|-----|
| `lib/auth/session.ts` | SELECT id, name, slug para listar empresas del usuario |
| `lib/config/companies-service.ts` | INSERT, UPDATE, SELECT (CRUD completo) |
| `lib/config/company-config.ts` | SELECT para getCompanies |
| `app/(saas)/empresas/page.tsx` | Lista de empresas |
| `app/(saas)/empresas/[id]/configurar/page.tsx` | Datos de la empresa a configurar |
| `app/(saas)/company-selector.tsx` | Opciones del selector de empresa activa |

### Qué afecta

- **Layout:** Si no hay empresas o no hay empresa activa, el menú usa módulos por defecto.
- **Módulo Empresas:** Toda la funcionalidad de crear, listar, activar/desactivar.
- **Configurar empresa:** La página /empresas/[id]/configurar trabaja sobre una company.

### RLS

- **No tiene RLS.** Cualquier usuario autenticado puede leer y modificar todas las empresas.

### Si modificas o eliminas

- **Eliminar:** Rompe company_modules (FK). El módulo Empresas deja de funcionar.
- **Cambiar slug:** Asegurar que no haya duplicados (UNIQUE).
- **Añadir columna:** Revisar companies-service y tipos en database.ts.

---

## Tabla: `modules`

### Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | **PK** |
| code | TEXT | NO | - | **UNIQUE.** Código (dashboard, productos, usuarios, empresas) |
| name | TEXT | NO | - | Nombre para mostrar en menú |
| path | TEXT | NO | - | Ruta (/dashboard, /productos, etc.) |
| sort_order | INT | NO | 0 | Orden en el menú |
| is_active | BOOLEAN | NO | true | Si el módulo está activo en el sistema |
| created_at | TIMESTAMPTZ | NO | now() | Fecha creación |

### Para qué sirve

- Define los módulos disponibles en el sistema (Dashboard, Productos, Usuarios, Empresas).
- Es la "plantilla" global; cada empresa decide qué módulos ve mediante `company_modules`.

### Quién la usa

| Archivo | Uso |
|---------|-----|
| `lib/config/company-config.ts` | SELECT para getCompanyModules |
| `lib/config/company-modules-service.ts` | SELECT para getAllModules, getModuleSections (join con module_sections que no existe) |
| `app/(saas)/layout.tsx` | Módulos para el menú lateral |
| `app/(saas)/empresas/[id]/configurar/` | Lista de módulos para configurar por empresa |

### Datos actuales (seed migración 007)

- dashboard, /dashboard, orden 10
- productos, /productos, orden 20
- usuarios, /usuarios, orden 30
- empresas, /empresas, orden 40

### Qué afecta

- **Layout:** Los enlaces del menú lateral vienen de aquí.
- **Configurar empresa:** Se muestran como opciones para activar/desactivar por empresa.

### RLS

- **No tiene RLS.**

### Si modificas o eliminas

- **Eliminar un módulo:** Rompe company_modules que lo referencien. El menú dejaría de mostrarlo.
- **Cambiar code:** El código busca por code (ej: "productos"); hay que actualizar referencias.
- **Cambiar path:** Los enlaces del menú apuntan a path; debe coincidir con las rutas de la app.

---

## Tabla: `company_modules`

### Columnas

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | **PK** |
| company_id | UUID | NO | - | **FK → companies** |
| module_id | UUID | NO | - | **FK → modules** |
| is_enabled | BOOLEAN | NO | true | Si la empresa ve este módulo |
| sort_order | INT | NO | 0 | Orden en el menú de esta empresa |
| created_at | TIMESTAMPTZ | NO | now() | Fecha creación |

**UNIQUE(company_id, module_id)**

### Para qué sirve

- Configuración por empresa: qué módulos ve cada empresa y en qué orden.
- Si no hay fila para una empresa-módulo, el código asume que el módulo está habilitado (comportamiento por defecto).

### Quién la usa

| Archivo | Uso |
|---------|-----|
| `lib/config/company-config.ts` | SELECT para getCompanyModules |
| `lib/config/company-modules-service.ts` | SELECT getCompanyModulesConfig, DELETE+INSERT en setCompanyModules |
| `app/(saas)/layout.tsx` | Indirectamente vía getCompanyModules |
| `app/(saas)/empresas/[id]/configurar/company-config-panel.tsx` | Guardar configuración de módulos |

### Qué afecta

- **Layout:** Determina qué módulos aparecen en el menú para la empresa activa.
- **Configurar empresa:** La pestaña "Módulos y secciones" guarda aquí.

### RLS

- **No tiene RLS.**

### Si modificas o eliminas

- **Eliminar fila:** Esa empresa deja de tener configuración explícita para ese módulo; el código usa "habilitado por defecto".
- **Eliminar tabla:** El layout mostraría todos los módulos siempre (fallback en código).

---

## Tabla: `orders`

### Columnas (inferidas)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | - | **PK** |
| store_id | UUID | **FK → stores** |
| (otras) | - | Datos del pedido |

### Para qué sirve

- Pedidos del e-commerce. Modelo legacy.

### Quién la usa

- RLS: políticas por store_id vía profiles.
- No usada por el SaaS DashboardNeura actual.

### RLS

- SELECT, INSERT, UPDATE, DELETE filtrados por `store_id = (SELECT store_id FROM profiles WHERE id = auth.uid())`.

---

## Tabla: `products`

### Columnas (inferidas)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | - | **PK** |
| store_id | UUID | **FK → stores** |
| (otras) | - | Datos del producto e-commerce |

### Para qué sirve

- Productos del catálogo e-commerce. Modelo legacy.

### Quién la usa

- RLS por store_id.
- No usada por el SaaS actual (el módulo Productos no está conectado a esta tabla).

### RLS

- Varias políticas: admins por store_id, y una política pública de SELECT.

---

## Tabla: `product_images`

### Columnas (inferidas)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | - | **PK** |
| product_id | UUID | **FK → products** |
| store_id | UUID | **FK → stores** |
| (otras) | - | URL, etc. |

### Para qué sirve

- Imágenes de productos del e-commerce.

### RLS

- Por store_id vía profiles.

---

## Tabla: `products_inmobiliaria`

### Columnas (inferidas)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | - | **PK** |
| store_id | UUID | **FK → stores** |
| neighborhood_id | UUID | **FK → neighborhoods** |
| property_type_id | UUID | **FK → property_types** |
| (otras) | - | Datos de propiedad inmobiliaria |

### Para qué sirve

- Propiedades/listados inmobiliarios.

### RLS

- Por store_id.

---

## Tabla: `product_images_inmobiliaria`

### Columnas (inferidas)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | - | **PK** |
| product_id | UUID | **FK → products_inmobiliaria** |
| store_id | UUID | **FK → stores** |
| (otras) | - | Imágenes de propiedades |

### Para qué sirve

- Imágenes de propiedades inmobiliarias.

---

## Tabla: `neighborhoods`

### Columnas (inferidas)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | - | **PK** |
| store_id | UUID | **FK → stores** (implícito en RLS) |
| (otras) | - | Nombre del barrio, etc. |

### Para qué sirve

- Barrios para el módulo inmobiliario.

### RLS

- Por store_id vía profiles.

---

## Tabla: `property_types`

### Columnas (inferidas)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | - | **PK** |
| store_id | UUID | **FK → stores** |
| (otras) | - | Tipo de propiedad (casa, depto, etc.) |

### Para qué sirve

- Tipos de propiedad para inmobiliaria.

### RLS

- Por store_id.

---

## Tabla: `property_valuation_rules`

### Columnas (inferidas)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | - | **PK** |
| store_id | UUID | **FK → stores** |
| property_type_id | UUID | **FK → property_types** |
| neighborhood_id | UUID | **FK → neighborhoods** |
| (otras) | - | Reglas de valuación |

### Para qué sirve

- Reglas de valuación de propiedades por tipo y barrio.

### RLS

- Por store_id.

---

## Tabla: `quotes`

### Columnas (inferidas)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | - | **PK** |
| store_id | UUID | **FK → stores** |
| (otras) | - | Cotizaciones |

### Para qué sirve

- Cotizaciones del módulo inmobiliaria.

### RLS

- Por store_id.

---

# PARTE 2: TABLAS QUE EL CÓDIGO ESPERA PERO NO EXISTEN

## `user_company_roles`

**Usada en:** `lib/auth/session.ts` (getCompaniesForUser, cuando is_super_admin=false)

**Propósito esperado:** Vincular usuario con empresas y roles (user_id, company_id, role_id).

**Impacto actual:** Si un usuario tiene is_super_admin=false, getCompaniesForUser hace SELECT en user_company_roles. La tabla no existe → error. El try/catch devuelve []. El usuario no ve empresas y no puede usar el sistema.

**Conclusión:** Solo usuarios con is_super_admin=true pueden usar el SaaS actualmente.

---

## `module_sections`

**Usada en:** `lib/config/company-config.ts`, `lib/config/company-modules-service.ts`

**Propósito esperado:** Secciones internas de cada módulo (ej: Productos → Catálogo, Stock).

**Impacto actual:** La query devuelve error. El código usa try/catch y sections = []. No hay secciones configurables.

---

## `company_module_sections`

**Usada en:** `lib/config/company-config.ts`, `lib/config/company-modules-service.ts`

**Propósito esperado:** Qué secciones ve cada empresa dentro de cada módulo.

**Impacto actual:** Mismo patrón: error → fallback a vacío. La UI de configurar muestra módulos pero las secciones no se persisten.

---

## `company_branding`

**Usada en:** `lib/config/company-config.ts` (getCompanyBranding), `lib/config/company-branding-service.ts`, `app/(saas)/layout.tsx`, `app/(saas)/empresas/[id]/configurar/`

**Propósito esperado:** display_name, logo_url, primary_color por empresa.

**Impacto actual:** getCompanyBranding hace SELECT; la tabla no existe → error → catch devuelve null. El layout usa "DashboardNeura" y color por defecto. La pestaña Branding en configurar intenta guardar vía upsertCompanyBranding → error.

---

## `dashboard_widgets`, `company_dashboard_widgets`

**Usada en:** `lib/config/company-config.ts` (getCompanyDashboardWidgets)

**Impacto actual:** try/catch → devuelve { widgets: [] }. No hay widgets configurables.

---

## `form_definitions`, `form_fields`, `company_form_fields`

**Usada en:** `lib/config/company-config.ts` (getCompanyFormFields)

**Impacto actual:** try/catch → devuelve { fields: [] }. Formularios dinámicos no funcionan.

---

## `roles`, `permissions`, `role_permissions`

**Usada en:** Arquitectura documentada, no en código actual.

**Impacto actual:** Ninguno. El sistema usa is_super_admin como único rol especial.

---

# PARTE 3: FLUJO DE DATOS COMPLETO

## Flujo de login y sesión

```
1. Usuario hace login (Supabase Auth)
   → auth.users (id, email, etc.)

2. getSession() se ejecuta
   → SELECT profiles WHERE id = auth.uid()
   → Obtiene: is_super_admin, email, full_name

3. getCompaniesForUser(userId, is_super_admin)
   → Si is_super_admin: SELECT companies WHERE is_active=true
   → Si no: SELECT user_company_roles WHERE user_id=... (FALLA - tabla no existe)
   → companies = [] para no super_admin

4. getActiveCompanyId()
   → Lee cookie "saas-active-company"
   → companyId o null

5. companyId efectivo
   → activeCompanyId ?? (companies.length===1 ? companies[0].id : null)
```

## Flujo del layout

```
1. getCompanyModules(companyId)
   → SELECT modules WHERE is_active=true
   → Si companyId: SELECT company_modules WHERE company_id=companyId
   → Filtra/ordena módulos según company_modules
   → Intenta module_sections, company_module_sections (fallback vacío)

2. getCompanyBranding(companyId)
   → SELECT company_branding WHERE company_id=companyId (FALLA - tabla no existe)
   → return null

3. SaasSidebar recibe: modules, session, branding
   → displayName = branding?.display_name ?? "DashboardNeura"
   → primaryColor = branding?.primary_color ?? "#18181b"
   → Muestra menú con módulos
```

## Flujo del módulo Empresas

```
1. getCompanies()
   → SELECT companies ORDER BY name
   → Lista en /empresas

2. createCompany (formulario)
   → INSERT companies (name, slug, is_active)
   → companies-service

3. setCompanyActive (botón Activar/Desactivar)
   → UPDATE companies SET is_active=...

4. /empresas/[id]/configurar
   → getCompanyById(id)
   → getAllModules() → SELECT modules
   → getCompanyBranding(id) → null (tabla no existe)
   → getCompanyModulesConfig(id) → SELECT company_modules, company_module_sections
   → company_modules: OK. company_module_sections: vacío (tabla no existe)
   → getModuleSections(moduleId) → SELECT module_sections (tabla no existe) → []
```

---

# PARTE 4: MATRIZ DE IMPACTO

## Si cambias una tabla, qué se afecta

| Tabla | Afecta a | Riesgo |
|-------|----------|--------|
| profiles | session, login, RLS de todas las tablas legacy | CRÍTICO |
| stores | profiles, orders, products, product_images, products_inmobiliaria, product_images_inmobiliaria, property_types, property_valuation_rules, quotes, neighborhoods | CRÍTICO |
| companies | company_modules, session, layout, módulo Empresas | ALTO |
| modules | company_modules, layout, configurar | ALTO |
| company_modules | layout, configurar | MEDIO |
| orders, products, etc. | Solo modelo legacy | BAJO para SaaS |

## Si añades una tabla

| Tabla a añadir | Requiere | Afecta |
|----------------|----------|--------|
| user_company_roles | roles (o usar código de rol directo) | session.getCompaniesForUser |
| company_branding | - | getCompanyBranding, layout, configurar |
| module_sections | - | getCompanyModules, getModuleSections, configurar |
| company_module_sections | module_sections | getCompanyModules, configurar |
| dashboard_widgets | - | getCompanyDashboardWidgets |
| company_dashboard_widgets | dashboard_widgets | getCompanyDashboardWidgets |
| form_definitions | - | getCompanyFormFields |
| form_fields | form_definitions | getCompanyFormFields |
| company_form_fields | form_fields | getCompanyFormFields |

---

# PARTE 5: ANTES DE HACER CUALQUIER CAMBIO

## Checklist

1. **Identificar tablas afectadas:** ¿Qué tablas leen o escriben el dato que cambio?
2. **Revisar FKs:** ¿Alguna tabla tiene FK hacia la que modifico? ¿Cascadas?
3. **Revisar RLS:** ¿Las políticas usan la columna o tabla que cambio?
4. **Revisar código:** Buscar `.from("nombre_tabla")` y `nombre_tabla` en lib/ y app/
5. **Probar flujos:** Login, layout, empresas, configurar.

## Archivos que consultan la base de datos

| Archivo | Tablas que usa |
|---------|----------------|
| lib/auth/session.ts | profiles, companies, user_company_roles |
| lib/config/company-config.ts | modules, company_modules, module_sections, company_module_sections, dashboard_widgets, company_dashboard_widgets, form_definitions, form_fields, company_form_fields, company_branding, companies |
| lib/config/companies-service.ts | companies |
| lib/config/company-modules-service.ts | modules, company_modules, company_module_sections, module_sections |
| lib/config/company-branding-service.ts | company_branding |

---

# PARTE 6: RESUMEN EJECUTIVO

## Qué existe y funciona

- **profiles:** Con is_super_admin. Login y sesión OK.
- **companies:** CRUD, lista, activar/desactivar.
- **modules:** 4 módulos (dashboard, productos, usuarios, empresas).
- **company_modules:** Configuración de módulos por empresa. Guardar en configurar OK.

## Qué existe pero no se usa en el SaaS

- stores, orders, products, product_images, products_inmobiliaria, product_images_inmobiliaria, neighborhoods, property_types, property_valuation_rules, quotes.

## Qué no existe y rompe o limita funcionalidad

- **user_company_roles:** Usuarios no super_admin no pueden usar el sistema.
- **company_branding:** No hay branding por empresa; getCompanyBranding devuelve null.
- **module_sections, company_module_sections:** Secciones no configurables.
- **dashboard_widgets, company_dashboard_widgets:** Dashboard no configurable.
- **form_definitions, form_fields, company_form_fields:** Formularios no dinámicos.

## Orden sugerido para implementar

1. user_company_roles (para usuarios normales)
2. company_branding (layout y configurar)
3. module_sections + company_module_sections (secciones en configurar)
4. RLS en companies, company_modules, modules
5. dashboard_widgets + company_dashboard_widgets
6. form_definitions + form_fields + company_form_fields

---

# PARTE 7: ESQUEMA COMPLETO SEGÚN MIGRACIÓN 001

Si quisieras tener el sistema completo, la migración 001 define estas tablas con estas columnas exactas:

| Tabla | Columnas (según 001) |
|-------|----------------------|
| companies | id, name, slug, is_active, created_at, updated_at |
| profiles | id (FK auth.users), email, full_name, is_super_admin, created_at, updated_at |
| roles | id, code, name, scope (enum), created_at |
| user_company_roles | id, user_id (FK profiles), company_id (FK companies), role_id (FK roles), created_at. UNIQUE(user_id, company_id, role_id) |
| modules | id, code, name, path, sort_order, is_active, created_at |
| module_sections | id, module_id (FK modules), code, name, sort_order, created_at. UNIQUE(module_id, code) |
| company_modules | id, company_id, module_id, is_enabled, sort_order, created_at. UNIQUE(company_id, module_id) |
| company_module_sections | id, company_id, module_section_id (FK module_sections), is_enabled, sort_order, created_at. UNIQUE(company_id, module_section_id) |
| dashboard_widgets | id, code, name, description, default_config (JSONB), sort_order, created_at |
| company_dashboard_widgets | id, company_id, widget_id (FK dashboard_widgets), is_enabled, config (JSONB), sort_order, created_at. UNIQUE(company_id, widget_id) |
| form_definitions | id, module_id, entity_code, form_code, name, created_at. UNIQUE(module_id, entity_code, form_code) |
| form_fields | id, form_definition_id, code, name, type, default_required, default_visible, default_editable, default_sort_order, options (JSONB), created_at. UNIQUE(form_definition_id, code) |
| company_form_fields | id, company_id, form_field_id, is_visible, is_required, is_editable, sort_order, created_at. UNIQUE(company_id, form_field_id) |
| company_branding | id, company_id (UNIQUE FK companies), display_name, logo_url, primary_color, created_at, updated_at |
| permissions | id, code, name, resource, action, created_at |
| role_permissions | id, role_id, permission_id, created_at. UNIQUE(role_id, permission_id) |

**Importante:** No puedes ejecutar 001 tal cual en "paginas web neura" porque:
- profiles ya existe con store_id y role (legacy). 001 crearía profiles sin esas columnas y rompería RLS legacy.
- stores y tablas legacy no están en 001.

Para implementar las tablas faltantes, crea migraciones nuevas que solo creen lo que falta (user_company_roles, company_branding, module_sections, company_module_sections, etc.) sin tocar profiles ni las tablas legacy.

---

**Fin del documento.**
