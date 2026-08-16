create table if not exists fcm_tokens (
  id          serial primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  token       text not null unique,
  updated_at  timestamptz default now()
);

alter table fcm_tokens enable row level security;

-- Solo el propio usuario ve y gestiona sus tokens
create policy "Usuario gestiona sus tokens"
  on fcm_tokens for all
  using (auth.uid() = user_id);
