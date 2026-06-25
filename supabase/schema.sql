-- =============================================
-- Barbearia — Schema Supabase (PostgreSQL)
-- Fiel ao banco de produção (introspecção 2026-06).
-- IDEMPOTENTE: pode rodar quantas vezes quiser, tanto num
-- banco novo quanto no de produção, sem dar erro.
-- =============================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ───────────────────────────────────────────
-- TABELA: profiles
-- ───────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  avatar_url text,
  role       text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now(),
  phone      text
);

alter table public.profiles enable row level security;

-- Função auxiliar: checa se o usuário atual é admin.
-- SECURITY DEFINER ignora o RLS, evitando recursão infinita
-- ao consultar profiles dentro de uma policy da própria tabela.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Usuários leem o próprio perfil" on public.profiles;
create policy "Usuários leem o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Usuários atualizam o próprio perfil" on public.profiles;
create policy "Usuários atualizam o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Usuários criam o próprio perfil" on public.profiles;
create policy "Usuários criam o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Admins leem todos os perfis" on public.profiles;
create policy "Admins leem todos os perfis"
  on public.profiles for select
  using (public.is_admin());

-- ───────────────────────────────────────────
-- TRIGGER: criar perfil ao registrar usuário
-- (lê full_name/name e avatar_url/picture dos metadados —
--  cobre cadastro por e-mail e login com Google)
-- ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    ),
    'client'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ───────────────────────────────────────────
-- TABELA: services
-- ───────────────────────────────────────────
create table if not exists public.services (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  duration   int  not null default 30, -- minutos
  price      numeric(10, 2) not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;

drop policy if exists "Todos leem serviços ativos" on public.services;
create policy "Todos leem serviços ativos"
  on public.services for select
  using (active = true or public.is_admin());

drop policy if exists "Admins gerenciam serviços" on public.services;
create policy "Admins gerenciam serviços"
  on public.services for all
  using (public.is_admin());

-- Serviços iniciais
insert into public.services (name, duration, price) values
  ('Corte de Cabelo', 30, 35.00),
  ('Barba', 20, 25.00),
  ('Corte + Barba', 50, 55.00),
  ('Pigmentação', 60, 80.00)
on conflict do nothing;

-- ───────────────────────────────────────────
-- TABELA: business_config
-- ───────────────────────────────────────────
create table if not exists public.business_config (
  id             uuid primary key default uuid_generate_v4(),
  opening_time   time not null default '09:00',
  closing_time   time not null default '18:00',
  slot_interval  int  not null default 30, -- minutos
  working_days   int[]   not null default '{1,2,3,4,5,6}', -- 0=Dom ... 6=Sáb
  day_hours      jsonb   not null default '{}'::jsonb,      -- { "1": {"open":"09:00","close":"18:00"}, ... }
  business_name  text not null default 'Barbearia',
  logo_url       text,
  address        text,
  phone          text,
  instagram      text,
  whatsapp       text,
  auto_confirm   boolean not null default false,
  address_number text,
  address_city   text,
  address_state  text,
  lunch_start    text, -- "HH:MM" ou null
  lunch_end      text  -- "HH:MM" ou null
);

alter table public.business_config enable row level security;

drop policy if exists "Todos leem configuração" on public.business_config;
create policy "Todos leem configuração"
  on public.business_config for select
  using (true);

drop policy if exists "Admins editam configuração" on public.business_config;
create policy "Admins editam configuração"
  on public.business_config for all
  using (public.is_admin());

-- Configuração inicial (apenas se a tabela estiver vazia)
insert into public.business_config (opening_time, closing_time, slot_interval)
select '09:00', '18:00', 30
where not exists (select 1 from public.business_config);

-- ───────────────────────────────────────────
-- TABELA: appointments
-- ───────────────────────────────────────────
create table if not exists public.appointments (
  id               uuid primary key default uuid_generate_v4(),
  client_id        uuid not null references public.profiles(id) on delete cascade,
  service_id       uuid not null references public.services(id),
  date             timestamptz not null,
  status           text not null default 'pending'
                   check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at       timestamptz not null default now(),
  hidden_by_client boolean not null default false,
  hidden_by_admin  boolean not null default false
);

alter table public.appointments enable row level security;

-- Leitura: cada cliente lê os próprios agendamentos.
drop policy if exists "Clientes leem próprios agendamentos" on public.appointments;
create policy "Clientes leem próprios agendamentos"
  on public.appointments for select
  using (auth.uid() = client_id);

-- Leitura: qualquer usuário autenticado enxerga os slots
-- ocupados (pending/confirmed) para montar a grade de horários.
drop policy if exists "Autenticados veem slots ocupados" on public.appointments;
create policy "Autenticados veem slots ocupados"
  on public.appointments for select
  using (auth.uid() is not null and status in ('confirmed', 'pending'));

-- Criação: cliente cria agendamento para si.
drop policy if exists "Clientes criam agendamentos" on public.appointments;
create policy "Clientes criam agendamentos"
  on public.appointments for insert
  with check (auth.uid() = client_id);

-- Atualização: cliente atualiza/cancela o próprio agendamento.
drop policy if exists "Clientes cancelam próprios agendamentos" on public.appointments;
create policy "Clientes cancelam próprios agendamentos"
  on public.appointments for update
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

-- Atualização: cliente oculta itens concluídos/cancelados do histórico.
drop policy if exists "Clientes ocultam histórico próprio" on public.appointments;
create policy "Clientes ocultam histórico próprio"
  on public.appointments for update
  using (auth.uid() = client_id and status in ('completed', 'cancelled'))
  with check (auth.uid() = client_id and hidden_by_client = true);

-- Exclusão: cliente apaga itens concluídos/cancelados do histórico.
drop policy if exists "Clientes excluem histórico próprio" on public.appointments;
create policy "Clientes excluem histórico próprio"
  on public.appointments for delete
  using (auth.uid() = client_id and status in ('completed', 'cancelled'));

-- Admin gerencia todos os agendamentos.
drop policy if exists "Admins gerenciam todos os agendamentos" on public.appointments;
create policy "Admins gerenciam todos os agendamentos"
  on public.appointments for all
  using (public.is_admin());

-- Índices para performance
create index if not exists appointments_date_idx on public.appointments (date);
create index if not exists appointments_client_idx on public.appointments (client_id);

-- ───────────────────────────────────────────
-- FUNÇÃO: verificar disponibilidade de slot
-- Retorna true se o slot está disponível
-- ───────────────────────────────────────────
create or replace function public.is_slot_available(
  p_date        timestamptz,
  p_duration    int
)
returns boolean
language sql
stable
as $$
  select not exists (
    select 1
    from public.appointments a
    join public.services s on s.id = a.service_id
    where a.status = 'confirmed'
      and tstzrange(a.date, a.date + (s.duration || ' minutes')::interval)
          && tstzrange(p_date, p_date + (p_duration || ' minutes')::interval)
  );
$$;

-- ───────────────────────────────────────────
-- STORAGE: buckets para avatar e logo
-- (fiel ao banco de produção)
--   avatars: público, sem limites
--   logos:   público, máx. 2MB, apenas jpeg/png/webp
-- ───────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, null, null),
  ('logos',   'logos',   true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ── avatars ──────────────────────────────────
-- ATENÇÃO: avatars_all libera ALL para o role `public` (inclui anon).
-- É o estado atual do banco; revise se quiser restringir uploads.
drop policy if exists "avatars_all" on storage.objects;
create policy "avatars_all"
  on storage.objects for all
  to public
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');

drop policy if exists "avatars_auth_all" on storage.objects;
create policy "avatars_auth_all"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'avatars')
  with check (bucket_id = 'avatars');

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  to anon
  using (bucket_id = 'avatars');

-- ── logos ────────────────────────────────────
drop policy if exists "logos_auth_all" on storage.objects;
create policy "logos_auth_all"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'logos')
  with check (bucket_id = 'logos');

drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read"
  on storage.objects for select
  to anon
  using (bucket_id = 'logos');
