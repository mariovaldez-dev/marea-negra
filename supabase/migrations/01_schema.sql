-- ===================================================
-- MAREA NEGRA — ESQUEMA DE BASE DE DATOS SUPABASE
-- ===================================================

-- PERFILES Y ROLES DE ADMINISTRACIÓN
create table if not exists profiles (
  id uuid references auth.users primary key,
  nombre text,
  rol text check (rol in ('admin', 'empleado')) default 'empleado',
  created_at timestamptz default now()
);

-- CATEGORÍAS DEL MENÚ
create table if not exists categorias (
  id serial primary key,
  nombre text not null,
  orden int default 0
);

-- PLATILLOS
create table if not exists platillos (
  id serial primary key,
  categoria_id int references categorias(id),
  nombre text not null,
  descripcion text,
  precio numeric(10,2) not null,
  emoji text,
  disponible boolean default true,
  imagen_url text,
  created_at timestamptz default now()
);

-- PEDIDOS
create table if not exists pedidos (
  id serial primary key,
  cliente_nombre text not null,
  cliente_telefono text,
  estado text check (estado in (
    'nuevo','preparando','listo','entregado','cancelado'
  )) default 'nuevo',
  metodo_pago text check (metodo_pago in (
    'efectivo','transferencia','oxxo'
  )),
  hora_recogida time,
  total numeric(10,2),
  notas text,
  created_at timestamptz default now()
);

-- DETALLE DE PEDIDOS (CON PICOR Y NOTAS POR ITEM)
create table if not exists pedido_items (
  id serial primary key,
  pedido_id int references pedidos(id) on delete cascade,
  platillo_id int references platillos(id),
  nombre_platillo text,
  precio_unitario numeric(10,2),
  cantidad int default 1,
  nivel_picor text default 'medio',
  notas_item text
);

-- INSUMOS / INVENTARIO
create table if not exists insumos (
  id serial primary key,
  nombre text not null,
  unidad text not null,
  stock_actual numeric(10,3) default 0,
  stock_minimo numeric(10,3) default 0,
  created_at timestamptz default now()
);

-- MOVIMIENTOS DE INVENTARIO
create table if not exists movimientos_inventario (
  id serial primary key,
  insumo_id int references insumos(id),
  tipo text check (tipo in ('entrada','salida')),
  cantidad numeric(10,3),
  motivo text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- CIERRES DE CAJA
create table if not exists cierres_caja (
  id serial primary key,
  fecha date not null unique,
  total_efectivo numeric(10,2) default 0,
  total_transferencia numeric(10,2) default 0,
  total_oxxo numeric(10,2) default 0,
  total_sistema numeric(10,2),
  total_real numeric(10,2),
  diferencia numeric(10,2),
  notas text,
  cerrado_por uuid references profiles(id),
  created_at timestamptz default now()
);

-- TABLA DE CLIENTES DEL CLUB MAREA NEGRA & REFERIDOS
create table if not exists clientes_club (
  id uuid references auth.users primary key,
  nombre text not null,
  telefono text,
  email text,
  codigo_referido text unique not null,
  puntos int default 0,
  created_at timestamptz default now()
);

-- TABLA DE CUPONES DE DESCUENTO
create table if not exists cupones (
  id serial primary key,
  codigo text unique not null,
  descuento_porcentaje numeric(5,2) default 10,
  monto_fijo numeric(10,2) default 0,
  activo boolean default true,
  usos_maximos int default 100,
  usos_actuales int default 0,
  created_at timestamptz default now()
);

-- TABLA DE CONFIGURACIÓN DEL PLAN DE LEALTAD
create table if not exists configuracion_lealtad (
  id int primary key default 1,
  meta1_pedidos int default 3,
  recompensa1_producto text,
  meta2_pedidos int default 5,
  recompensa2_producto text,
  meta3_pedidos int default 10,
  recompensa3_producto text,
  created_at timestamptz default now()
);

-- TABLA DE CUPONES Y RECOMPENSAS DE LEALTAD N-DINÁMICAS (Tipos: porcentaje, producto_regalo, monto_fijo)
create table if not exists recompensas_lealtad (
  id serial primary key,
  pedidos_requeridos int not null default 1,
  codigo text not null,
  titulo text not null,
  tipo_recompensa text default 'porcentaje',
  descuento_porcentaje numeric(5,2) default 10,
  monto_fijo numeric(10,2) default 0,
  producto_regalo text,
  activo boolean default true,
  created_at timestamptz default now()
);

-- TABLA DE CONFIGURACIÓN DEL NEGOCIO, ESTADO Y HORARIOS DE ATENCIÓN DE SUCURSAL
create table if not exists configuracion_negocio (
  id int primary key default 1,
  abierto boolean default true,
  modo_automatico boolean default false,
  mensaje_cerrado text,
  horarios_dias jsonb,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table platillos enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;
alter table insumos enable row level security;
alter table movimientos_inventario enable row level security;
alter table cierres_caja enable row level security;
alter table clientes_club enable row level security;
alter table cupones enable row level security;
alter table configuracion_lealtad enable row level security;
alter table recompensas_lealtad enable row level security;
alter table configuracion_negocio enable row level security;

-- POLÍTICAS PÚBLICAS Y AUTENTICADAS
create policy "Menu publico platillos" on platillos for select using (true);
create policy "Categorias publicas" on categorias for select using (true);

create policy "Publico crea pedidos" on pedidos for insert to public with check (true);
create policy "Publico lee pedidos" on pedidos for select to public using (true);
create policy "Publico crea pedido_items" on pedido_items for insert to public with check (true);
create policy "Publico lee pedido_items" on pedido_items for select to public using (true);

create policy "Cupones visibles por publico" on cupones for select using (true);
create policy "Recompensas lealtad publicas" on recompensas_lealtad for select using (true);
create policy "Configuracion negocio publica" on configuracion_negocio for select using (true);

-- POLÍTICAS SOLO AUTENTICADOS (ADMIN)
create policy "Admin todo pedidos" on pedidos for all using (auth.role() = 'authenticated');
create policy "Admin todo platillos" on platillos for all using (auth.role() = 'authenticated');
create policy "Admin todo insumos" on insumos for all using (auth.role() = 'authenticated');
create policy "Admin todo cierres" on cierres_caja for all using (auth.role() = 'authenticated');
create policy "Admin todo recompensas lealtad" on recompensas_lealtad for all using (auth.role() = 'authenticated');
create policy "Admin todo configuracion negocio" on configuracion_negocio for all using (auth.role() = 'authenticated');

-- REALTIME PUBLICATION
alter publication supabase_realtime add table pedidos;
