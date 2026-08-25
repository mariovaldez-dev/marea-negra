-- Migración: Registro y Contador de Notificaciones (WhatsApp y SMS OTP)

create table if not exists registro_notificaciones (
  id serial primary key,
  canal text check (canal in ('whatsapp_pedido', 'whatsapp_campana', 'sms_otp', 'otro')) not null,
  destinatario text,
  pedido_id int references pedidos(id) on delete set null,
  metodo text default 'api', -- 'api', 'wa_link', 'firebase_sms'
  created_at timestamptz default now()
);

-- Habilitar RLS
alter table registro_notificaciones enable row level security;

-- Política: Solo administradores pueden ver el registro
create policy "Solo admin gestiona registro_notificaciones"
  on registro_notificaciones
  for all
  using (auth.role() = 'authenticated');

-- Índices para consultas ultra rápidas por mes y canal
create index if not exists idx_notificaciones_canal_fecha 
  on registro_notificaciones (canal, created_at desc);
