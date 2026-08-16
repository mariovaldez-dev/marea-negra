-- 1. Asegurarnos que la tabla exista desde cero si nunca se había creado en producción
CREATE TABLE IF NOT EXISTS clientes_club (
  id uuid primary key,
  nombre text not null,
  telefono text,
  email text,
  codigo_referido text unique not null,
  puntos int default 0,
  created_at timestamptz default now()
);

-- 2. Eliminar la restricción hacia auth.users (en caso de que la tabla ya existiera y la tuviera por error)
ALTER TABLE clientes_club DROP CONSTRAINT IF EXISTS clientes_club_id_fkey;

-- 3. Añadir la columna de contraseña para guardar el Hash seguro (si no la tenía)
ALTER TABLE clientes_club ADD COLUMN IF NOT EXISTS password_hash text;

-- 4. Asegurar que RLS esté activo
ALTER TABLE clientes_club ENABLE ROW LEVEL SECURITY;

-- 5. Permitir la lectura pública del perfil de forma segura
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clientes_club' AND policyname = 'Publico lee clientes_club'
  ) THEN
    CREATE POLICY "Publico lee clientes_club" ON clientes_club FOR SELECT USING (true);
  END IF;
END
$$;
