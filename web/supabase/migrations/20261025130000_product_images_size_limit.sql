-- Las imágenes se comprimen en el navegador (WebP, ≤ 800 px, ~150 KB) antes de subir.
-- El límite del bucket queda en 1 MB como respaldo por si algo sin comprimir llega.

update storage.buckets
set file_size_limit = 1024 * 1024
where id = 'product-images';
