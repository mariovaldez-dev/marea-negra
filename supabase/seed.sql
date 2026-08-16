-- ===================================================
-- MAREA NEGRA - DATOS SEMILLA (seed.sql)
-- ===================================================

-- Insertar Categorías
insert into categorias (id, nombre, orden) values
  (1, 'Aguachiles', 1),
  (2, 'Ceviches y Cocteles', 2),
  (3, 'Complementos', 3)
on conflict (id) do update set nombre = excluded.nombre, orden = excluded.orden;

-- Reset sequence for categorias
select setval('categorias_id_seq', (select max(id) from categorias));

-- Insertar Platillos
insert into platillos (id, categoria_id, nombre, descripcion, precio, emoji, disponible) values
  (1, 1, 'Aguachile Negro', 'Camarón, chile chiltepín, pepino, cebolla morada', 149.00, '🦐', true),
  (2, 1, 'Aguachile Rojo', 'Camarón, chile de árbol, limón, cilantro', 149.00, '🌶️', true),
  (3, 1, 'Aguachile Verde', 'Camarón, chile serrano, pepino, aguacate', 139.00, '🥒', true),
  (4, 2, 'Ceviche Camarón', 'Camarón cocido, jitomate, pepino, cilantro', 139.00, '🍋', true),
  (5, 2, 'Coctel Sinaloa', 'Camarón, pulpo, callo, aguacate, valentina', 179.00, '🐙', true),
  (6, 3, 'Tostadas de Callo', 'Callo marinado, mayonesa, aguacate, limón', 59.00, '🥑', true)
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  precio = excluded.precio,
  emoji = excluded.emoji,
  disponible = excluded.disponible;

-- Reset sequence for platillos
select setval('platillos_id_seq', (select max(id) from platillos));

-- Insertar Insumos base
insert into insumos (id, nombre, unidad, stock_actual, stock_minimo) values
  (1, 'Camarón fresco', 'kg', 5.000, 2.000),
  (2, 'Pulpo', 'kg', 2.000, 1.000),
  (3, 'Callo de hacha', 'kg', 1.500, 0.500),
  (4, 'Chile chiltepín', 'gr', 500.000, 100.000),
  (5, 'Limón', 'kg', 3.000, 1.000),
  (6, 'Pepino', 'pza', 10.000, 5.000),
  (7, 'Cebolla morada', 'kg', 2.000, 0.500),
  (8, 'Aguacate', 'pza', 8.000, 4.000),
  (9, 'Tostadas', 'paquete', 3.000, 2.000)
on conflict (id) do update set
  nombre = excluded.nombre,
  unidad = excluded.unidad,
  stock_actual = excluded.stock_actual,
  stock_minimo = excluded.stock_minimo;

-- Reset sequence for insumos
select setval('insumos_id_seq', (select max(id) from insumos));

-- Insertar Configuración de Negocio por defecto
insert into configuracion_negocio (id, abierto, modo_automatico, mensaje_cerrado, horarios_dias) values
  (1, true, false, 'Por el momento nuestra cocina se encuentra cerrada y no estamos recibiendo nuevos pedidos en línea.', '[{"id": "lunes", "nombre": "Lunes", "abierto": true, "apertura": "11:00", "cierre": "20:00"}, {"id": "martes", "nombre": "Martes", "abierto": true, "apertura": "11:00", "cierre": "20:00"}, {"id": "miercoles", "nombre": "Miércoles", "abierto": true, "apertura": "11:00", "cierre": "20:00"}, {"id": "jueves", "nombre": "Jueves", "abierto": true, "apertura": "11:00", "cierre": "20:00"}, {"id": "viernes", "nombre": "Viernes", "abierto": true, "apertura": "11:00", "cierre": "21:00"}, {"id": "sabado", "nombre": "Sábado", "abierto": true, "apertura": "11:00", "cierre": "21:00"}, {"id": "domingo", "nombre": "Domingo", "abierto": true, "apertura": "11:00", "cierre": "20:00"}]'::jsonb)
on conflict (id) do nothing;

-- Insertar Configuración de Lealtad por defecto
insert into configuracion_lealtad (id, meta1_pedidos, recompensa1_producto, meta2_pedidos, recompensa2_producto, meta3_pedidos, recompensa3_producto) values
  (1, 3, 'Bebida de cortesía (Refresco o Agua fresca)', 5, 'Tostada de Callo gratis', 10, 'Aguachile de tu elección gratis')
on conflict (id) do nothing;
