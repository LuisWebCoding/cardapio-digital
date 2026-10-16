-- Execute no SQL Editor do SEU projeto Supabase.
-- Não cadastra usuários nem publica dados automaticamente.
begin;

create table if not exists public.restaurant_menus (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  owner_id uuid not null references auth.users(id),
  data jsonb not null check (
    jsonb_typeof(data) = 'object'
    and data ?& array['nome', 'subtitulo', 'logo', 'banner', 'corPrincipal', 'categorias']
    and jsonb_typeof(data -> 'categorias') = 'array'
    and jsonb_typeof(data -> 'nome') = 'string'
    and octet_length(data::text) < 2000000
  ),
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

alter table public.restaurant_menus enable row level security;

-- Nenhum usuário do navegador pode criar/excluir restaurantes ou trocar o dono.
revoke all on public.restaurant_menus from anon, authenticated;
grant select (id, data, revision, updated_at) on public.restaurant_menus to anon, authenticated;
grant update (data) on public.restaurant_menus to authenticated;

drop policy if exists menu_public_read on public.restaurant_menus;
create policy menu_public_read on public.restaurant_menus
  for select to anon, authenticated using (true);

drop policy if exists menu_owner_update on public.restaurant_menus;
create policy menu_owner_update on public.restaurant_menus
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- A revisão é controlada pelo servidor, não pelo navegador.
create or replace function public.menu_bump_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists restaurant_menu_revision on public.restaurant_menus;
create trigger restaurant_menu_revision before update on public.restaurant_menus
  for each row execute function public.menu_bump_revision();
revoke all on function public.menu_bump_revision() from public, anon, authenticated;

-- Retorna somente se o usuário atual é o dono; não expõe o owner_id na API.
create or replace function public.can_manage_menu(menu_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.restaurant_menus
    where id = menu_id and owner_id = (select auth.uid())
  );
$$;
revoke all on function public.can_manage_menu(text) from public, anon;
grant execute on function public.can_manage_menu(text) to authenticated;

commit;
