-- =============================================
-- Barbearia — Schema Supabase (PostgreSQL)
-- Execute este script no SQL Editor do Supabase
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
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuários leem o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários atualizam o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins leem todos os perfis"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

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

create policy "Todos leem serviços ativos"
  on public.services for select
  using (active = true or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "Admins gerenciam serviços"
  on public.services for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

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
  id            uuid primary key default uuid_generate_v4(),
  opening_time  time not null default '09:00',
  closing_time  time not null default '18:00',
  slot_interval int  not null default 30 -- minutos
);

alter table public.business_config enable row level security;

create policy "Todos leem configuração"
  on public.business_config for select
  using (true);

create policy "Admins editam configuração"
  on public.business_config for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Configuração inicial
insert into public.business_config (opening_time, closing_time, slot_interval)
values ('09:00', '18:00', 30)
on conflict do nothing;

-- ───────────────────────────────────────────
-- TABELA: appointments
-- ───────────────────────────────────────────
create table if not exists public.appointments (
  id         uuid primary key default uuid_generate_v4(),
  client_id  uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.services(id),
  date       timestamptz not null,
  status     text not null default 'pending'
             check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

alter table public.appointments enable row level security;

create policy "Clientes leem próprios agendamentos"
  on public.appointments for select
  using (auth.uid() = client_id);

create policy "Clientes criam agendamentos"
  on public.appointments for insert
  with check (auth.uid() = client_id);

create policy "Clientes cancelam próprios agendamentos"
  on public.appointments for update
  using (auth.uid() = client_id and status = 'pending');

create policy "Admins gerenciam todos os agendamentos"
  on public.appointments for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Índice para busca por data (performance)
create index if not exists appointments_date_idx on public.appointments (date);
create index if not exists appointments_client_idx on public.appointments (client_id);

-- ───────────────────────────────────────────
-- TRIGGER: criar perfil ao registrar usuário
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
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
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
