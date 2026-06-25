-- =============================================
-- FIX: perfis não estão sendo criados (login Google/email
-- autentica mas o usuário fica deslogado por não ter perfil)
-- =============================================
-- Execute este script inteiro no SQL Editor do Supabase.
-- =============================================

-- 1) Permitir que o próprio usuário crie seu perfil
--    (rede de segurança caso o trigger não rode).
drop policy if exists "Usuários criam o próprio perfil" on public.profiles;
create policy "Usuários criam o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2) (Re)criar a função + trigger que cria o perfil no cadastro.
--    Idempotente: pode rodar quantas vezes precisar.
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

-- 3) Backfill: cria perfil para todos os usuários que já existem
--    em auth.users mas estão sem perfil (resolve quem já tentou logar).
insert into public.profiles (id, email, full_name, avatar_url, role)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  coalesce(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture'
  ),
  'client'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 4) Conferência: deve retornar 0 linhas (todos têm perfil agora).
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
