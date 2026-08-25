-- MIGRACIÓN 07: CANJE DE RECOMPENSAS DE LEALTAD (PLATILLOS GRATIS)

CREATE TABLE IF NOT EXISTS canjes_lealtad (
  id serial PRIMARY KEY,
  telefono text NOT NULL,
  nombre_cliente text,
  recompensa text NOT NULL,
  pedido_id int REFERENCES pedidos(id) ON DELETE SET NULL,
  canjeado_por text DEFAULT 'admin',
  notas text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE canjes_lealtad ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de canjes" ON canjes_lealtad;
CREATE POLICY "Lectura publica de canjes" ON canjes_lealtad
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Solo autenticados gestionan canjes" ON canjes_lealtad;
CREATE POLICY "Solo autenticados gestionan canjes" ON canjes_lealtad
  FOR ALL USING (auth.role() = 'authenticated');
