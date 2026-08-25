-- Migración: Sistema de Reseñas y Feedback de Satisfacción (Google Maps Booster & Desvío Privado)

create table if not exists resenas_pedidos (
  id serial primary key,
  pedido_id int references pedidos(id) on delete cascade,
  cliente_telefono text,
  calificacion int not null check (calificacion between 1 and 5),
  motivo text,
  comentario text,
  canal_destino text check (canal_destino in ('google_maps', 'whatsapp_soporte', 'interno')) default 'interno',
  created_at timestamptz default now()
);

-- RLS
alter table resenas_pedidos enable row level security;

-- Cualquier comensal puede insertar su reseña del pedido
create policy "Insertar resenas publico"
  on resenas_pedidos
  for insert
  with check (true);

-- Solo administradores autenticados pueden ver todas las reseñas
create policy "Admin lee resenas"
  on resenas_pedidos
  for select
  using (auth.role() = 'authenticated');

-- Índices de optimización
create index if not exists idx_resenas_pedido on resenas_pedidos (pedido_id);
create index if not exists idx_resenas_calificacion on resenas_pedidos (calificacion, created_at desc);
