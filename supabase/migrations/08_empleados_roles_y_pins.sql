-- MIGRACIÓN 08: GESTIÓN DE EMPLEADOS, ROLES, PIN Y TRAZABILIDAD (IDEMPOTENTE)

DO $$
BEGIN
  -- 1. Ampliar roles en profiles
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_rol_check 
    CHECK (rol IN ('admin', 'cajero', 'mesero', 'cocina', 'empleado'));

  -- 2. Columnas en profiles para PIN y datos de empleado
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'pin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pin text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'telefono'
  ) THEN
    ALTER TABLE profiles ADD COLUMN telefono text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_emoji'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_emoji text DEFAULT '🦐';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'activo'
  ) THEN
    ALTER TABLE profiles ADD COLUMN activo boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'puesto'
  ) THEN
    ALTER TABLE profiles ADD COLUMN puesto text;
  END IF;

  -- 3. Trazabilidad en pedidos (mesero y cajero)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'mesero_id'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN mesero_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'mesero_nombre'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN mesero_nombre text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pedidos' AND column_name = 'cobrado_por'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN cobrado_por uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. POLÍTICAS RLS EN PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Perfiles lectura para autenticados" ON profiles;
CREATE POLICY "Perfiles lectura para autenticados" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Perfiles gestion admin" ON profiles;
CREATE POLICY "Perfiles gestion admin" ON profiles
  FOR ALL USING (auth.role() = 'authenticated');
