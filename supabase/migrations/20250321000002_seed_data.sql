-- DashboardNeura: Datos iniciales (seed)
-- Módulos, roles, permisos, widgets de ejemplo

-- ============================================
-- ROLES
-- ============================================

INSERT INTO roles (code, name, scope) VALUES
  ('super_admin', 'Super Administrador', 'global'),
  ('company_admin', 'Administrador de empresa', 'company'),
  ('vendedor', 'Vendedor', 'company'),
  ('operador', 'Operador', 'company'),
  ('deposito', 'Depósito', 'company'),
  ('supervisor', 'Supervisor', 'company');

-- ============================================
-- MÓDULOS
-- ============================================

INSERT INTO modules (code, name, path, sort_order) VALUES
  ('dashboard', 'Dashboard', '/dashboard', 10),
  ('productos', 'Productos', '/productos', 20),
  ('usuarios', 'Usuarios', '/usuarios', 30),
  ('empresas', 'Empresas', '/empresas', 40);

-- ============================================
-- SECCIONES POR MÓDULO
-- ============================================

-- Secciones de Productos
INSERT INTO module_sections (module_id, code, name, sort_order)
SELECT id, 'catalogo', 'Catálogo de productos', 10 FROM modules WHERE code = 'productos';
INSERT INTO module_sections (module_id, code, name, sort_order)
SELECT id, 'stock', 'Stock e inventario', 20 FROM modules WHERE code = 'productos';

-- ============================================
-- DASHBOARD WIDGETS (ejemplos)
-- ============================================

INSERT INTO dashboard_widgets (code, name, description, sort_order) VALUES
  ('ventas_dia', 'Ventas por día', 'Métricas de ventas diarias', 10),
  ('ventas_mes', 'Ventas por mes', 'Métricas de ventas mensuales', 20),
  ('top_productos', 'Top 10 productos más vendidos', 'Ranking de productos', 30),
  ('top_buscados', 'Top 10 productos más buscados', 'Productos más buscados', 40),
  ('metricas_financieras', 'Métricas financieras', 'Indicadores financieros', 50),
  ('metricas_operativas', 'Métricas operativas', 'Indicadores operativos', 60),
  ('grafica_stock', 'Gráfica de stock', 'Estado del inventario', 70),
  ('alertas', 'Alertas', 'Alertas y notificaciones', 80),
  ('actividad_reciente', 'Actividad reciente', 'Última actividad', 90);

-- ============================================
-- FORM DEFINITIONS - Productos
-- ============================================

INSERT INTO form_definitions (module_id, entity_code, form_code, name)
SELECT id, 'producto', 'crear', 'Crear producto'
FROM modules WHERE code = 'productos';

INSERT INTO form_definitions (module_id, entity_code, form_code, name)
SELECT id, 'producto', 'editar', 'Editar producto'
FROM modules WHERE code = 'productos';

INSERT INTO form_definitions (module_id, entity_code, form_code, name)
SELECT id, 'producto', 'listar', 'Listado de productos'
FROM modules WHERE code = 'productos';

-- Campos del formulario Crear/Editar producto
INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_visible, default_editable, default_sort_order)
SELECT fd.id, 'titulo', 'Título', 'text', true, true, true, 10
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code IN ('crear', 'editar');

INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_visible, default_editable, default_sort_order)
SELECT fd.id, 'descripcion', 'Descripción', 'textarea', false, true, true, 20
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code IN ('crear', 'editar');

INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_visible, default_editable, default_sort_order)
SELECT fd.id, 'precio', 'Precio', 'number', true, true, true, 30
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code IN ('crear', 'editar');

INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_visible, default_editable, default_sort_order)
SELECT fd.id, 'sku', 'SKU', 'text', false, true, true, 40
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code IN ('crear', 'editar');

INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_visible, default_editable, default_sort_order)
SELECT fd.id, 'categoria', 'Categoría', 'select', false, true, true, 50
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code IN ('crear', 'editar');

INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_visible, default_editable, default_sort_order)
SELECT fd.id, 'marca', 'Marca', 'text', false, true, true, 60
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code IN ('crear', 'editar');

INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_visible, default_editable, default_sort_order)
SELECT fd.id, 'stock', 'Stock', 'number', false, true, true, 70
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code IN ('crear', 'editar');

INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_visible, default_editable, default_sort_order)
SELECT fd.id, 'imagenes', 'Imágenes', 'file', false, true, true, 80
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code IN ('crear', 'editar');

-- Campos para listado
INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_visible, default_editable, default_sort_order)
SELECT fd.id, 'titulo', 'Título', 'text', false, true, false, 10
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code = 'listar';

INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_visible, default_editable, default_sort_order)
SELECT fd.id, 'precio', 'Precio', 'number', false, true, false, 20
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code = 'listar';

INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_visible, default_editable, default_sort_order)
SELECT fd.id, 'sku', 'SKU', 'text', false, true, false, 30
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code = 'listar';

INSERT INTO form_fields (form_definition_id, code, name, type, default_required, default_visible, default_editable, default_sort_order)
SELECT fd.id, 'stock', 'Stock', 'number', false, true, false, 40
FROM form_definitions fd
JOIN modules m ON fd.module_id = m.id
WHERE m.code = 'productos' AND fd.entity_code = 'producto' AND fd.form_code = 'listar';

-- ============================================
-- PERMISOS (ejemplos)
-- ============================================

INSERT INTO permissions (code, name, resource, action) VALUES
  ('empresas.read', 'Ver empresas', 'empresas', 'read'),
  ('empresas.create', 'Crear empresas', 'empresas', 'create'),
  ('empresas.update', 'Editar empresas', 'empresas', 'update'),
  ('empresas.delete', 'Eliminar empresas', 'empresas', 'delete'),
  ('productos.read', 'Ver productos', 'productos', 'read'),
  ('productos.create', 'Crear productos', 'productos', 'create'),
  ('productos.update', 'Editar productos', 'productos', 'update'),
  ('productos.delete', 'Eliminar productos', 'productos', 'delete'),
  ('usuarios.read', 'Ver usuarios', 'usuarios', 'read'),
  ('usuarios.create', 'Crear usuarios', 'usuarios', 'create'),
  ('usuarios.update', 'Editar usuarios', 'usuarios', 'update'),
  ('usuarios.delete', 'Eliminar usuarios', 'usuarios', 'delete'),
  ('dashboard.read', 'Ver dashboard', 'dashboard', 'read');

-- Super admin tiene todos los permisos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin';
