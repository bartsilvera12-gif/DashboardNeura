# Entrega: Evolución del Módulo PRODUCTOS

## 1. Propuesta final de arquitectura

### Tabla `products` (evolucionada)
- **Núcleo mantenido:** `id`, `store_id`, `name`, `description`, `price`, `image`, `category`, `stock`, `created_at`
- **Columnas nuevas:** `company_id`, `sku`, `status`, `cost_price`, `sale_price`, `barcode`, `brand`, `unit_type`, `min_stock`, `max_stock`, `reorder_point`, `track_stock`, `allow_backorder`, `weight`, `width`, `height`, `length`, `tags`, `updated_at`, `deleted_at`, `is_active`, `visibility`, `tax_type`, `currency`, `featured`, `internal_code`, `notes`

### Tabla `company_product_column_config`
Configuración por empresa de columnas visibles en Catálogo y Stock:
- `company_id`, `column_key`, `column_label`, `module_section` (catalogo | stock)
- `visible`, `editable`, `required`, `show_in_list`, `show_in_form`
- `affects_stock`, `affects_dashboard`, `sort_order`

### Flujo de datos
```
Empresa (company) 
  → company_product_column_config (qué columnas ver en Catálogo/Stock)
  → products (company_id o store_id para multiempresa)
  → Módulo Productos: Catálogo + Stock
  → Dashboard (métricas según affects_dashboard)
```

---

## 2. Migración SQL
- **Archivo:** `supabase/migrations/20250321150000_evolve_products_and_config.sql`
- **Contenido:** `ALTER TABLE ADD COLUMN IF NOT EXISTS` para ampliar `products`, creación de `company_product_column_config`, `stores.company_id`, índices.

---

## 3. Tablas nuevas
- `company_product_column_config`: configuración de columnas por empresa.

---

## 4. Archivos modificados/creados

| Archivo | Acción |
|---------|--------|
| `lib/config/products-service.ts` | Creado – CRUD productos |
| `lib/config/dashboard-products-service.ts` | Creado – métricas para dashboard |
| `lib/config/product-column-config.ts` | Extendido – seed, set, getRaw |
| `lib/config/onboarding-service.ts` | Modificado – seed de config en onboarding |
| `app/(saas)/productos/page.tsx` | Modificado – página con tabs |
| `app/(saas)/productos/actions.ts` | Creado – create/update producto |
| `app/(saas)/productos/_components/productos-tabs.tsx` | Creado |
| `app/(saas)/productos/_components/catalogo-section.tsx` | Creado |
| `app/(saas)/productos/_components/stock-section.tsx` | Creado |
| `app/(saas)/dashboard/page.tsx` | Modificado – widgets de productos |
| `app/(saas)/empresas/[id]/configurar/page.tsx` | Modificado – fetch productColumns |
| `app/(saas)/empresas/[id]/configurar/company-config-panel.tsx` | Modificado – tab Productos |
| `app/(saas)/empresas/[id]/configurar/actions.ts` | Modificado – saveProductColumnsConfigAction |

---

## 5. Explicación breve

1. **Productos** usa `company_id` (SaaS) o `store_id` (legacy) para multiempresa.
2. **Configuración de columnas** se siembra al crear empresa (onboarding) y se puede editar en **Empresas → [Empresa] → Configurar → Productos**.
3. **Módulo Productos** tiene dos tabs: **Catálogo** (listar/crear/editar) y **Stock** (estado del inventario). Las columnas se muestran según la config de la empresa.
4. **Dashboard** muestra total, activos, sin stock, stock bajo, destacados, valor inventario y categorías según los campos con `affects_dashboard`.

---

## 6. Qué queda visible en onboarding

- **Paso 5b (automático):** Se siembra la configuración por defecto de columnas (`company_product_column_config`) al crear la empresa. No es un paso de UI.

---

## 7. Configuración de columnas

- **Dónde:** Empresas → [Empresa] → Configurar → pestaña **Productos**.
- **Qué se configura:** Por columna: Visible, Editable, Obligatorio, afecta Stock, afecta Dashboard. Por sección: Catálogo y Stock.

---

## 8. Conexión Productos → Stock → Dashboard

- **Productos:** Página principal con tabs Catálogo y Stock.
- **Catálogo:** CRUD de productos con columnas de `company_product_column_config` (sección `catalogo`).
- **Stock:** Tabla con columnas de sección `stock` y estado (OK / Bajo / Sin stock).
- **Dashboard:** Métricas desde `getDashboardProductStats(companyId)` usando columnas con `affects_dashboard = true`.

---

## 9. Compatibilidad

- No se eliminan `products_inmobiliaria`, `product_images`, `orders`, `stores`, `companies`, `company_modules`.
- `products.store_id` se mantiene para legacy.
- `products.company_id` se usa para el flujo SaaS actual.
