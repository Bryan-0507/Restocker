-- Imágenes de productos: cualquier miembro las sube, reemplaza y quita (igual que el catálogo).
-- Además el bucket solo acepta imágenes de hasta 5 MB.

drop policy "Admin sube imágenes de productos" on storage.objects;
drop policy "Admin reemplaza imágenes de productos" on storage.objects;

create policy "Miembros suben imágenes de productos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = public.current_business_id()::text
  );

create policy "Miembros reemplazan imágenes de productos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = public.current_business_id()::text
  );

create policy "Miembros quitan imágenes de productos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = public.current_business_id()::text
  );

update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'product-images';
