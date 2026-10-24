import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const PRODUCT_IMAGES_BUCKET = "product-images";

// Lo que acepta el selector de archivos. Lo que se sube siempre es WebP comprimido.
export const PRODUCT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/heic";

const MAX_DIMENSION = 800;
const TARGET_BYTES = 150 * 1024;
const INITIAL_QUALITY = 0.8;
const MIN_QUALITY = 0.4;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function toBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No pudimos procesar la imagen."))), "image/webp", quality);
  });
}

// Comprime en el navegador antes de subir: redimensiona a 800 px (lado más largo), pasa a WebP
// y baja la calidad hasta quedar en ~150 KB. Una foto de celular de 3–8 MB queda en KB.
export async function compressProductImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen.");

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("No pudimos leer la imagen. Prueba con una foto JPG o PNG.");
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let quality = INITIAL_QUALITY;
  let blob = await toBlob(canvas, quality);
  while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
    quality = Math.round((quality - 0.1) * 10) / 10;
    blob = await toBlob(canvas, quality);
  }

  return blob;
}

// El bucket es privado: firma varias rutas en una sola llamada y devuelve ruta → URL (1 h).
export async function signProductImages(supabase: SupabaseClient<Database>, paths: (string | null)[]) {
  const unique = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  const signed = new Map<string, string>();
  if (unique.length === 0) return signed;

  const { data } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);
  data?.forEach((url) => {
    if (url.path && url.signedUrl) signed.set(url.path, url.signedUrl);
  });

  return signed;
}
