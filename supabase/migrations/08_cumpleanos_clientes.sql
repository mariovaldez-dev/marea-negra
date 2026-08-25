-- MIGRACIÓN 08: CAMPO BORNDATE PARA CLIENTES DEL CLUB DE LEALTAD

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clientes_club' AND column_name = 'borndate'
  ) THEN
    ALTER TABLE clientes_club ADD COLUMN borndate date;
  END IF;
END $$;
