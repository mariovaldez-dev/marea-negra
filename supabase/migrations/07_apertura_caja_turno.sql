-- MIGRACIÓN 07: APERTURA Y CONTROL DE TURNOS DE CAJA (IDEMPOTENTE)

DO $$
BEGIN
  -- Estado de la caja (abierta o cerrada)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cierres_caja' AND column_name = 'estado'
  ) THEN
    ALTER TABLE cierres_caja ADD COLUMN estado text CHECK (estado IN ('abierta', 'cerrada')) DEFAULT 'cerrada';
  END IF;

  -- Hora de apertura
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cierres_caja' AND column_name = 'hora_apertura'
  ) THEN
    ALTER TABLE cierres_caja ADD COLUMN hora_apertura timestamptz DEFAULT now();
  END IF;

  -- Hora de cierre
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cierres_caja' AND column_name = 'hora_cierre'
  ) THEN
    ALTER TABLE cierres_caja ADD COLUMN hora_cierre timestamptz;
  END IF;

  -- Usuario que abrió la caja
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cierres_caja' AND column_name = 'abierto_por'
  ) THEN
    ALTER TABLE cierres_caja ADD COLUMN abierto_por uuid REFERENCES profiles(id);
  END IF;

  -- Desglose de billetes al abrir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cierres_caja' AND column_name = 'monto_apertura_desglose'
  ) THEN
    ALTER TABLE cierres_caja ADD COLUMN monto_apertura_desglose jsonb;
  END IF;

  -- Notas de apertura
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cierres_caja' AND column_name = 'notas_apertura'
  ) THEN
    ALTER TABLE cierres_caja ADD COLUMN notas_apertura text;
  END IF;
END $$;
