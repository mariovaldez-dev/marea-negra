-- MIGRACIÓN 06: MÓDULO DE SALÓN & MESAS Y GASTOS DE CAJA CHICA (IDEMPOTENTE)

-- 1. TABLA DE MESAS
CREATE TABLE IF NOT EXISTS mesas (
  id serial PRIMARY KEY,
  nombre text NOT NULL,
  capacidad int DEFAULT 4,
  forma text CHECK (forma IN ('cuadrada', 'redonda', 'rectangular', 'barra')) DEFAULT 'cuadrada',
  pos_x int DEFAULT 50,
  pos_y int DEFAULT 50,
  estado text CHECK (estado IN ('libre', 'ocupada', 'cuenta_pedida')) DEFAULT 'libre',
  pedido_activo_id int REFERENCES pedidos(id) ON DELETE SET NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. TABLA DE GASTOS DE CAJA CHICA
CREATE TABLE IF NOT EXISTS gastos_caja (
  id serial PRIMARY KEY,
  fecha date NOT NULL,
  concepto text NOT NULL,
  categoria text CHECK (categoria IN ('insumos_urgentes', 'proveedores', 'servicios', 'personal', 'otros')) DEFAULT 'insumos_urgentes',
  monto numeric(10,2) NOT NULL,
  metodo_pago text CHECK (metodo_pago IN ('efectivo', 'transferencia')) DEFAULT 'efectivo',
  comprobante_url text,
  registrado_por uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 3. AMPLIAR TABLA PEDIDOS PARA SOPORTAR MESAS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'mesa_id'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN mesa_id int REFERENCES mesas(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'mesa_nombre'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN mesa_nombre text;
  END IF;
END $$;

-- 4. AMPLIAR TABLA CIERRES_CAJA PARA FONDO INICIAL Y GASTOS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cierres_caja' AND column_name = 'fondo_inicial'
  ) THEN
    ALTER TABLE cierres_caja ADD COLUMN fondo_inicial numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cierres_caja' AND column_name = 'total_gastos'
  ) THEN
    ALTER TABLE cierres_caja ADD COLUMN total_gastos numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cierres_caja' AND column_name = 'desglose_billetes'
  ) THEN
    ALTER TABLE cierres_caja ADD COLUMN desglose_billetes jsonb;
  END IF;
END $$;

-- 5. POLÍTICAS ROW LEVEL SECURITY (IDEMPOTENTES CON DROP POLICY IF EXISTS)
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_caja ENABLE ROW LEVEL SECURITY;

-- Políticas de Mesas: lectura pública para saber si está libre o para el menú QR
DROP POLICY IF EXISTS "Lectura publica de mesas" ON mesas;
CREATE POLICY "Lectura publica de mesas" ON mesas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Solo autenticados gestionan mesas" ON mesas;
CREATE POLICY "Solo autenticados gestionan mesas" ON mesas
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas de Gastos de Caja: solo personal autenticado
DROP POLICY IF EXISTS "Solo autenticados ven y gestionan gastos" ON gastos_caja;
CREATE POLICY "Solo autenticados ven y gestionan gastos" ON gastos_caja
  FOR ALL USING (auth.role() = 'authenticated');

-- 6. DATOS SEMILLA INICIALES DE MESAS (DISTRIBUCIÓN INICIAL DEL SALÓN)
INSERT INTO mesas (nombre, capacidad, forma, pos_x, pos_y, estado)
SELECT * FROM (VALUES
  ('Mesa 1', 4, 'cuadrada', 40, 40, 'libre'),
  ('Mesa 2', 4, 'cuadrada', 180, 40, 'libre'),
  ('Mesa 3', 6, 'rectangular', 320, 40, 'libre'),
  ('Mesa 4', 4, 'redonda', 40, 180, 'libre'),
  ('Mesa 5', 4, 'cuadrada', 180, 180, 'libre'),
  ('Mesa 6 (Terraza)', 6, 'rectangular', 320, 180, 'libre'),
  ('Barra 1', 2, 'barra', 480, 40, 'libre'),
  ('Barra 2', 2, 'barra', 480, 180, 'libre')
) AS v(nombre, capacidad, forma, pos_x, pos_y, estado)
WHERE NOT EXISTS (SELECT 1 FROM mesas LIMIT 1);
