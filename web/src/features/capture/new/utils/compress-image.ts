// Comprime una foto en el navegador antes de subirla: lado mayor de 1600 px, suficiente para
// leer un ticket, en JPEG. Baja la calidad hasta quedar bajo el límite del servidor (1 MB).
const MAX_SIDE = 1600;
const MAX_BYTES = 950_000;
const QUALITIES = [0.82, 0.72, 0.6, 0.5];

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bitmap) throw new Error(`No pudimos abrir la foto "${file.name}". Prueba con otra.`);

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of QUALITIES) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= MAX_BYTES) return blob;
  }

  throw new Error(`La foto "${file.name}" es demasiado pesada. Prueba con otra.`);
}
