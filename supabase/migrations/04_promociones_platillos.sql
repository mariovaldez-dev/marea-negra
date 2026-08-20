-- AGREGAR SOPORTE DE PROMOCIONES, PRECIOS EN OFERTA Y DÍAS DE ACTIVACIÓN A PLATILLOS
ALTER TABLE platillos 
  ADD COLUMN IF NOT EXISTS precio_anterior NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS es_promocion BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS etiqueta_promo TEXT,
  ADD COLUMN IF NOT EXISTS dias_promo TEXT[];

-- ASIGNAR TODOS LOS DÍAS POR DEFECTO A PLATILLOS EXISTENTES CON PROMOCIÓN/OFERTA SI 'dias_promo' ES NULL
UPDATE platillos 
SET dias_promo = ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo']
WHERE (es_promocion = TRUE OR etiqueta_promo IS NOT NULL OR precio_anterior IS NOT NULL) 
  AND (dias_promo IS NULL OR cardinality(dias_promo) = 0);

-- MARCAR PLATILLO DEMO COMO PROMOCIÓN ACTIVA EN TODOS LOS DÍAS
UPDATE platillos 
SET 
  es_promocion = TRUE,
  precio_anterior = 199.00,
  etiqueta_promo = 'ESPECIAL 2X1',
  dias_promo = ARRAY['lunes','martes','miercoles','jueves','viernes','sabado','domingo']
WHERE id = 1 AND (es_promocion IS FALSE OR es_promocion IS NULL);
