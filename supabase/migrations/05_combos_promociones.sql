-- ===================================================
-- MAREA NEGRA — MIGRACIÓN 05: COMBOS Y PROMOCIONES
-- ===================================================
-- Ejecutar en Supabase SQL Editor después de las migraciones anteriores
-- ===================================================

-- 1. AGREGAR CATEGORÍA "Combos & Promos" (si no existe)
INSERT INTO categorias (nombre, orden)
SELECT 'Combos & Promos', 10
WHERE NOT EXISTS (
  SELECT 1 FROM categorias WHERE nombre = 'Combos & Promos'
);

-- Obtener el ID de la categoría recién creada o existente
DO $$
DECLARE
  cat_id INT;
BEGIN
  SELECT id INTO cat_id FROM categorias WHERE nombre = 'Combos & Promos' LIMIT 1;

  -- ===================================================
  -- 2. COMBOS DE 2 PLATILLOS
  -- ===================================================

  -- Combo Premium: TRIPLETE + Aguachile Mixto
  INSERT INTO platillos (categoria_id, nombre, descripcion, precio, precio_anterior, es_promocion, etiqueta_promo, dias_promo, emoji, disponible)
  VALUES (
    cat_id,
    'Combo Premium',
    'TRIPLETE + Aguachile Mixto. Tercia de camarón cocido, curtido con pulpo o atún y emulsión de sabores.',
    399.00,
    425.00,
    TRUE,
    'COMBO PREMIUM',
    ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],
    '🦐',
    TRUE
  )
  ON CONFLICT DO NOTHING;

  -- Combo Especial: TRIPLETE + Tosticeviche
  INSERT INTO platillos (categoria_id, nombre, descripcion, precio, precio_anterior, es_promocion, etiqueta_promo, dias_promo, emoji, disponible)
  VALUES (
    cat_id,
    'Combo Especial',
    'TRIPLETE + Tosticeviche de camarón. Lo mejor del mar en una combinación ganadora.',
    389.00,
    420.00,
    TRUE,
    'COMBO ESPECIAL',
    ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],
    '🌊',
    TRUE
  )
  ON CONFLICT DO NOTHING;

  -- Combo Clásico: Aguachile Mixto + Ceviche Camarón
  INSERT INTO platillos (categoria_id, nombre, descripcion, precio, precio_anterior, es_promocion, etiqueta_promo, dias_promo, emoji, disponible)
  VALUES (
    cat_id,
    'Combo Clásico',
    'Aguachile Mixto + Ceviche de Camarón. Dos sabores del mar sinaloanense en un solo pedido.',
    339.00,
    365.00,
    TRUE,
    'COMBO CLÁSICO',
    ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],
    '🍋',
    TRUE
  )
  ON CONFLICT DO NOTHING;

  -- Combo Crunch: Tosticeviche + Ceviche Camarón
  INSERT INTO platillos (categoria_id, nombre, descripcion, precio, precio_anterior, es_promocion, etiqueta_promo, dias_promo, emoji, disponible)
  VALUES (
    cat_id,
    'Combo Crunch',
    'Tosticeviche + Ceviche de Camarón. Crujiente y fresco, la combinación perfecta.',
    329.00,
    360.00,
    TRUE,
    'COMBO CRUNCH',
    ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],
    '🥑',
    TRUE
  )
  ON CONFLICT DO NOTHING;

  -- Combo Ligero: Ceviche Camarón + Tostadas de Camarón
  INSERT INTO platillos (categoria_id, nombre, descripcion, precio, precio_anterior, es_promocion, etiqueta_promo, dias_promo, emoji, disponible)
  VALUES (
    cat_id,
    'Combo Ligero',
    'Ceviche de Camarón + Tostadas de Camarón. Ideal para un antojo sin excesos.',
    279.00,
    300.00,
    TRUE,
    'COMBO LIGERO',
    ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],
    '🌮',
    TRUE
  )
  ON CONFLICT DO NOTHING;

  -- Combo Individual Plus: Ceviche Media Orden + Tostadas de Camarón
  INSERT INTO platillos (categoria_id, nombre, descripcion, precio, precio_anterior, es_promocion, etiqueta_promo, dias_promo, emoji, disponible)
  VALUES (
    cat_id,
    'Combo Individual Plus',
    'Ceviche (Media orden) + Tostadas de Camarón. Para el que quiere probar de todo sin pasarse.',
    225.00,
    245.00,
    TRUE,
    'COMBO INDIVIDUAL',
    ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],
    '🍤',
    TRUE
  )
  ON CONFLICT DO NOTHING;

  -- ===================================================
  -- 3. COMBOS DE 3 PLATILLOS (PARA COMPARTIR)
  -- ===================================================

  -- Trío de la Casa
  INSERT INTO platillos (categoria_id, nombre, descripcion, precio, precio_anterior, es_promocion, etiqueta_promo, dias_promo, emoji, disponible)
  VALUES (
    cat_id,
    'Trío de la Casa',
    'TRIPLETE + Aguachile Mixto + Tosticeviche. El paquete estrella para compartir entre amigos o familia.',
    549.00,
    605.00,
    TRUE,
    'TRIO DE LA CASA',
    ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],
    '🎉',
    TRUE
  )
  ON CONFLICT DO NOTHING;

  -- Trío Camarón Total
  INSERT INTO platillos (categoria_id, nombre, descripcion, precio, precio_anterior, es_promocion, etiqueta_promo, dias_promo, emoji, disponible)
  VALUES (
    cat_id,
    'Trío Camarón Total',
    'Aguachile Mixto + Ceviche Camarón + Tostadas de Camarón. Para los que aman el camarón en todas sus formas.',
    439.00,
    485.00,
    TRUE,
    'TRIO CAMARÓN',
    ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],
    '🦐',
    TRUE
  )
  ON CONFLICT DO NOTHING;

  -- Trío Tostadas y Ceviches
  INSERT INTO platillos (categoria_id, nombre, descripcion, precio, precio_anterior, es_promocion, etiqueta_promo, dias_promo, emoji, disponible)
  VALUES (
    cat_id,
    'Trío Tostadas y Ceviches',
    'Tosticeviche + Ceviche Camarón + Ceviche (Media orden). El festín de ceviches frescos de Sinaloa.',
    439.00,
    485.00,
    TRUE,
    'TRIO CEVICHES',
    ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],
    '🌊',
    TRUE
  )
  ON CONFLICT DO NOTHING;

  -- ===================================================
  -- 4. PROMOCIONES POR VOLUMEN
  -- ===================================================

  -- 2x1.5 Tostadas de Camarón (compra 1 y la 2ª al 50%)
  INSERT INTO platillos (categoria_id, nombre, descripcion, precio, precio_anterior, es_promocion, etiqueta_promo, dias_promo, emoji, disponible)
  VALUES (
    cat_id,
    '2×1.5 Tostadas de Camarón',
    'Compra 2 Tostadas de Camarón: la primera a precio normal y la segunda al 50%. ¡Un clásico irresistible al mejor precio!',
    180.00,
    240.00,
    TRUE,
    '2×1.5 OFERTA',
    ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],
    '🌮',
    TRUE
  )
  ON CONFLICT DO NOTHING;

  -- Par de Tosticeviches
  INSERT INTO platillos (categoria_id, nombre, descripcion, precio, precio_anterior, es_promocion, etiqueta_promo, dias_promo, emoji, disponible)
  VALUES (
    cat_id,
    'Par de Tosticeviches',
    'Llévate 2 Tosticeviches de camarón por un precio especial. Doble crujido, doble sabor.',
    329.00,
    360.00,
    TRUE,
    'DUPLA',
    ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],
    '🥑',
    TRUE
  )
  ON CONFLICT DO NOTHING;

  -- Dupla de Medias Órdenes
  INSERT INTO platillos (categoria_id, nombre, descripcion, precio, precio_anterior, es_promocion, etiqueta_promo, dias_promo, emoji, disponible)
  VALUES (
    cat_id,
    'Dupla de Medias Órdenes',
    '2 Ceviches (Media orden) por un precio especial. Ideal para probar dos sabores distintos del mar.',
    220.00,
    250.00,
    TRUE,
    'DUPLA',
    ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],
    '🍋',
    TRUE
  )
  ON CONFLICT DO NOTHING;

END $$;

-- Reset sequence
SELECT setval('platillos_id_seq', (SELECT MAX(id) FROM platillos));
SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias));

-- Verificar combos insertados
SELECT id, nombre, precio, precio_anterior, etiqueta_promo, es_promocion
FROM platillos
WHERE es_promocion = TRUE
ORDER BY id;
