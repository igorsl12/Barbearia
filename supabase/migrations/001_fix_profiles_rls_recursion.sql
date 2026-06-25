-- =============================================
-- FIX: recursão infinita nas policies de profiles
-- =============================================
-- Sintoma: usuário autentica mas não fica logado e não
-- consegue agendar, porque toda leitura de profiles dispara
-- "infinite recursion detected in policy for relation profiles".
--
-- Causa: as policies de admin consultavam public.profiles
-- dentro da própria policy de profiles.
--
-- Solução: isolar a checagem de admin numa função
-- SECURITY DEFINER (que ignora o RLS) e usá-la nas policies.
--
-- Execute este script inteiro no SQL Editor do Supabase.
-- =============================================

-- 1) Função auxiliar que ignora o RLS (quebra a recursão)
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

-- 2) profiles
drop policy if exists "Admins leem todos os perfis" on public.profiles;
create policy "Admins leem todos os perfis"
  on public.profiles for select
  using (public.is_admin());

-- 3) services
drop policy if exists "Todos leem serviços ativos" on public.services;
create policy "Todos leem serviços ativos"
  on public.services for select
  using (active = true or public.is_admin());

drop policy if exists "Admins gerenciam serviços" on public.services;
create policy "Admins gerenciam serviços"
  on public.services for all
  using (public.is_admin());

-- 4) business_config
drop policy if exists "Admins editam configuração" on public.business_config;
create policy "Admins editam configuração"
  on public.business_config for all
  using (public.is_admin());

-- 5) appointments
drop policy if exists "Admins gerenciam todos os agendamentos" on public.appointments;
create policy "Admins gerenciam todos os agendamentos"
  on public.appointments for all
  using (public.is_admin());
