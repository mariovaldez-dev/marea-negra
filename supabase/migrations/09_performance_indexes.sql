-- ==============================================================================
-- MIGRACIÓN 09: ÍNDICES DE ALTO RENDIMIENTO (DATABASE PERFORMANCE OPTIMIZATION)
-- MAREA NEGRA - AGUACHILES & COCTELES
-- ==============================================================================

-- 1. MENÚ PÚBLICO Y PLATILLOS
-- Acelera las consultas del menú público (/ y /carta) filtrando por disponibilidad y categoría
CREATE INDEX IF NOT EXISTS idx_platillos_disponible_categoria 
ON platillos(disponible, categoria_id);

CREATE INDEX IF NOT EXISTS idx_categorias_orden 
ON categorias(orden ASC);

-- 2. PEDIDOS, KANBAN Y MONITOR DE COCINA (KDS)
-- Acelera la pantalla de cocina y Kanban filtrando pedidos activos y orden cronológico
CREATE INDEX IF NOT EXISTS idx_pedidos_estado_created 
ON pedidos(estado, created_at DESC);

-- Acelera la búsqueda de pedidos de hoy para el corte de caja
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at 
ON pedidos(created_at DESC);

-- 3. CRM Y TARJETAS DE LEALTAD VIP
-- Acelera las búsquedas instantáneas por número de teléfono en QR, comanda y CRM
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_telefono 
ON pedidos(cliente_telefono);

CREATE INDEX IF NOT EXISTS idx_pedidos_mesa_id 
ON pedidos(mesa_id);

-- 4. ITEMS DE PEDIDOS
-- Acelera el cálculo de platillos top y desglose de comandas
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido_id 
ON pedido_items(pedido_id);

CREATE INDEX IF NOT EXISTS idx_pedido_items_platillo_id 
ON pedido_items(platillo_id);

-- 5. INVENTARIO Y BITÁCORA DE MERMAS
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_insumo_created 
ON movimientos_inventario(insumo_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_insumos_stock 
ON insumos(stock_actual, stock_minimo);

-- 6. MESAS Y SALÓN
CREATE INDEX IF NOT EXISTS idx_mesas_estado 
ON mesas(estado);
