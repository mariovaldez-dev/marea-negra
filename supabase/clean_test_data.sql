-- Script para limpiar datos transaccionales (de prueba)
-- Mantiene intactos: clientes_club (usuarios app), platillos, categorias, insumos, profiles, configuraciones.

-- Deshabilitar triggers temporalmente para evitar problemas de Foreign Keys durante el truncado
SET session_replication_role = 'replica';

-- 1. Limpiar Pedidos y sus items (CASCADE se encarga de pedido_items automáticamente)
TRUNCATE TABLE pedidos CASCADE;

-- 2. Limpiar Movimientos de Inventario (mantiene los insumos intactos)
TRUNCATE TABLE movimientos_inventario CASCADE;

-- 3. Limpiar Cierres de Caja
TRUNCATE TABLE cierres_caja CASCADE;

-- (Opcional) Si también quieres borrar los cupones generados durante las pruebas, descomenta la siguiente línea:
-- TRUNCATE TABLE cupones CASCADE;

-- Restaurar triggers a la normalidad
SET session_replication_role = 'origin';

-- NOTA: Si prefieres borrar usando DELETE para que corran los triggers, usa:
-- DELETE FROM pedido_items;
-- DELETE FROM pedidos;
-- DELETE FROM movimientos_inventario;
-- DELETE FROM cierres_caja;
