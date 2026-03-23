# Entrega: Consolidación del Módulo Productos

## Cambios realizados

### 1. Unificación de company_id
- **products-service.ts**: `getProductsForCompany` usa ÚNICAMENTE `company_id`. Eliminado fallback a `store_id`.
- `store_id` permanece en la tabla para datos legacy pero no se usa en queries funcionales.

### 2. Tipo de producto (product_type)
- **Columna nueva**: `products.product_type` (`ecommerce` | `servicios` | `inmobiliaria`).
- **Comportamiento**:
  - `ecommerce` → usa stock (track_stock aplica)
  - `servicios` → no usa stock (track_stock=false por defecto)
  - `inmobiliaria` → preparado para campos específicos (extensible)
- **UI**: Selector en formulario de Catálogo. Columna visible en listados según config.
- **Lógica**: `productTypeUsesStock()` centraliza la decisión de si un producto controla stock.

### 3. Sistema de movimientos de stock
- **Tabla**: `stock_movements` (entrada, salida, ajuste).
- **Servicio**: `lib/config/stock-movements-service.ts`.
- **API**: `recordStockMovement(productId, companyId, type, quantity, reason)`.
- **Actualización**: `products.stock` se actualiza al registrar el movimiento.
- **UI**: Botón "Ajustar" en Stock para productos con control de stock. Formulario inline (tipo, cantidad, motivo).

### 4. Configuración por empresa
- **company_product_column_config** controla:
  - **UI**: columnas visibles, editables, obligatorias, show_in_list, show_in_form.
  - **Stock**: columnas con affects_stock. product_type incluido.
  - **Dashboard**: métricas según affects_dashboard (hasStock, hasCostPrice, hasFeatured, hasCategory, hasMinStock).
- **product_type** añadido a PRODUCT_COLUMN_DEFINITIONS (sección catalogo, affects_stock, affects_dashboard).

### 5. Dashboard
- Métricas dependen de configuración:
  - `sinStock`, `stockBajo`: solo si hasStock/hasMinStock
  - `valorInventario`: solo si hasCostPrice
  - `destacados`: solo si hasFeatured
  - `categoriasTop`: solo si hasCategory
- product_type `servicios` excluido de métricas de stock.

---

## Migraciones SQL

**Archivo**: `supabase/migrations/20250321160000_products_consolidation.sql`

```sql
-- product_type en products
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'ecommerce'
  CHECK (product_type IN ('ecommerce', 'servicios', 'inmobiliaria'));

-- stock_movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'ajuste')),
  quantity INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

---

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `lib/config/products-service.ts` | Solo company_id, product_type, productTypeUsesStock() |
| `lib/config/product-column-config.ts` | product_type en definiciones |
| `lib/config/stock-movements-service.ts` | **Nuevo** – movimientos de stock |
| `lib/config/dashboard-products-service.ts` | productTypeUsesStock, métricas según config |
| `app/(saas)/productos/actions.ts` | product_type, recordStockMovementAction |
| `app/(saas)/productos/_components/catalogo-section.tsx` | product_type select, formatValue(product_type) |
| `app/(saas)/productos/_components/stock-section.tsx` | productTypeUsesStock, Ajustar UI, N/A para servicios |
| `app/(saas)/productos/_components/productos-tabs.tsx` | companyId a StockSection |
| `supabase/migrations/20250321160000_products_consolidation.sql` | **Nuevo** |

---

## Validación recomendada

1. **Crear empresa** – Onboarding completo.
2. **Configurar columnas** – Empresas → [Empresa] → Configurar → Productos.
3. **Crear producto** – Catálogo, con tipo ecommerce/servicios/inmobiliaria.
4. **Ver Catálogo** – Comprobar columnas según config.
5. **Ver Stock** – Productos ecommerce con stock, servicios como N/A, botón Ajustar.
6. **Registrar movimiento** – Entrada/salida/ajuste y comprobar que stock se actualiza.
7. **Ver Dashboard** – Métricas coherentes con configuración.

---

## Consistencia

- Queries de productos usan solo `company_id`.
- `store_id` conservado como legacy, sin uso en lógica.
- `product_type` define si el producto usa stock.
- `stock_movements` trazabilidad; `products.stock` como valor actual.
- Configuración por empresa aplicada en UI, stock y dashboard.
