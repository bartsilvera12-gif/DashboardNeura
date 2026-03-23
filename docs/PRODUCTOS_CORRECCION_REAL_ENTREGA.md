# Entrega: Corrección y consolidación del módulo Productos (estado REAL)

## Estado real confirmado en Supabase

- **products**: Todas las columnas incluyendo `company_id`, `product_type`
- **company_product_column_config**: Existe, había config manual para empresa `d00cfdd4-b403-421c-ade3-83351218b2dc`
- **stock_movements**: Creada manualmente con `previous_stock`, `new_stock` (no stock_before/stock_after)
- **Legacy**: Productos migrados a company_id; store_id solo por compatibilidad

---

## Qué estaba mal realmente

### 1. stock_movements – columnas incorrectas
- **Código usaba**: `stock_before`, `stock_after`, `reference_id`
- **Tabla real tiene**: `previous_stock`, `new_stock`; sin `reference_id`

### 2. Seed de configuración no idempotente
- **Problema**: Insert directo fallaba si ya existía config (unique violation)
- **Impacto**: Empresas con config manual o re-ejecución de onboarding fallaban

### 3. created_at en productos legacy
- **Problema**: Productos legacy con `created_at` null
- **Impacto**: Posibles errores en ordenación o filtros por fecha

### 4. createProduct sin created_at explícito
- Productos nuevos podían depender solo del default de BD

---

## Qué se corrigió

### 1. stock-movements-service.ts
- Uso de `previous_stock` y `new_stock` en lugar de `stock_before`/`stock_after`
- Eliminado `reference_id` del insert
- Interfaz `StockMovement` alineada con la tabla real

### 2. product-column-config.ts – seed robusto
- `seedDefaultProductColumnConfig` pasa a usar **upsert** con `onConflict: "company_id,column_key"`
- Idempotente: si existe config, se actualiza; si no, se inserta
- Compatible con config manual y con empresas nuevas

### 3. products-service.ts – createProduct
- `created_at` explícito al crear
- `product_type` con default `ecommerce` si no se envía

### 4. Migraciones SQL

**20250321170000_fix_products_created_at.sql**
```sql
UPDATE products SET created_at = now() WHERE created_at IS NULL;
```

**20250321170100_align_stock_movements_columns.sql**
- Renombra `stock_before` → `previous_stock` y `stock_after` → `new_stock` si existen
- No modifica tablas ya creadas manualmente con nombres correctos

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `lib/config/stock-movements-service.ts` | `previous_stock`/`new_stock`, sin `reference_id` |
| `lib/config/product-column-config.ts` | Seed con upsert en lugar de insert |
| `lib/config/products-service.ts` | `created_at` y `product_type` en `createProduct` |
| `supabase/migrations/20250321170000_fix_products_created_at.sql` | Nuevo – arregla `created_at` null |
| `supabase/migrations/20250321170100_align_stock_movements_columns.sql` | Nuevo – alinea columnas de stock_movements |

---

## Comandos para migraciones

```bash
# Opción 1: Por archivo
npx supabase db query -f supabase/migrations/20250321170000_fix_products_created_at.sql --linked
npx supabase db query -f supabase/migrations/20250321170100_align_stock_movements_columns.sql --linked

# Opción 2: Push completo
npx supabase db push --linked
```

---

## Validación para empresa d00cfdd4-b403-421c-ade3-83351218b2dc

| Flujo | Estado |
|-------|--------|
| **Catálogo** | `getProductsForCompany(companyId)` filtra por `company_id` |
| **Stock** | Mismos productos, columnas según `company_product_column_config` |
| **Ajustar stock** | `recordStockMovement` inserta en `stock_movements` con `previous_stock`/`new_stock` y actualiza `products.stock` |
| **Dashboard** | `getDashboardProductStats(companyId)` usa solo `company_id` |
| **Sin store_id** | No se usa `store_id` en ninguna query funcional |

---

## Compatibilidad con legacy

- `store_id` se mantiene en la tabla y en la interfaz
- Todas las queries de productos usan `company_id`
- `stores.company_id` puede quedar null; no afecta al flujo actual
- Productos ya migrados a `company_id` funcionan con el módulo actual
