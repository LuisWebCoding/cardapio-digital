-- Execute UMA VEZ no SQL Editor, após schema.sql.
-- Bucket dedicado a fotos públicas do cardápio (não envie arquivos privados).
-- Pode ser reexecutado; não remove fotos existentes.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images', 'menu-images', true, 2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- A pasta inicial é o id do restaurante. Só o dono cadastrado pode enviar.
-- URLs públicas de fotos podem ser lidas sem sessão pelo endpoint público do Storage.
-- Não concedemos listagem, sobrescrita ou exclusão pelo aplicativo.
drop policy if exists menu_photos_owner_insert on storage.objects;
create policy menu_photos_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'menu-images'
  and public.can_manage_menu((storage.foldername(name))[1])
  and array_length(storage.foldername(name), 1) = 1
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

commit;
