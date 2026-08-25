-- Migración: Sistema de Recuperación de Contraseñas Costo $0 MXN (OTP WhatsApp & Verificación Cumpleaños)

create table if not exists codigos_recuperacion (
  id serial primary key,
  telefono text not null,
  codigo text not null,
  expira_at timestamptz not null default (now() + interval '15 minutes'),
  utilizado boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table codigos_recuperacion enable row level security;

-- Solo admins o server actions con admin client pueden gestionar
create policy "Solo admin gestiona codigos_recuperacion"
  on codigos_recuperacion
  for all
  using (auth.role() = 'authenticated');

create index if not exists idx_codigos_tel_expira on codigos_recuperacion (telefono, expira_at, utilizado);
