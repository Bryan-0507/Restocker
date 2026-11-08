import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";
import { signProductImages } from "@/features/shared/utils/product-images";
import type { CaptureContext, CaptureResult, PreparedInput } from "./new/types/capture-draft";
import type { ReviewData, ReviewDecision } from "./review/types/review-data";

// GET: lo que decide qué muestra Capturar: si hay catálogo y si hay una captura por revisar.
export async function getCaptureContext(): Promise<CaptureContext> {
  const supabase = createClient();

  const [{ count, error: productsError }, { data: pending, error: pendingError }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("captures")
      .select("id, created_at, capture_items(count)")
      .in("status", ["procesando", "en_revision"])
      .maybeSingle(),
  ]);

  if (productsError || pendingError) throw new Error("No pudimos preparar Capturar. Intenta de nuevo.");

  return {
    productCount: count ?? 0,
    pendingCapture: pending
      ? { id: pending.id, proposals: pending.capture_items[0]?.count ?? 0, createdAt: pending.created_at }
      : null,
  };
}

// Sube fotos y audio al bucket privado, en la carpeta de la captura. La ruta del servidor los
// descarga de ahí: así la petición no pasa el límite de tamaño de Vercel.
export async function uploadCaptureFiles(inputs: PreparedInput[]) {
  const supabase = createClient();

  await Promise.all(
    inputs.map(async (input) => {
      if (input.type === "texto") return;
      const { error } = await supabase.storage
        .from("captures")
        .upload(input.path, input.blob, { contentType: input.blob.type, upsert: false });
      if (error) throw new CaptureRequestError("No pudimos subir tus archivos. Revisa tu conexión e intenta de nuevo.");
    }),
  );
}

// Error de la captura con el código de la ruta (catalogo_vacio, captura_pendiente, limite_diario,
// error_modelo), para que la vista decida qué ofrecer.
export class CaptureRequestError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

// POST: procesa la captura con Gemini y la guarda (ver src/app/api/captures/route.ts).
export async function processCapture(captureId: string, inputs: PreparedInput[]): Promise<CaptureResult> {
  const response = await fetch("/api/captures", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      captureId,
      inputs: inputs.map((input) =>
        input.type === "texto"
          ? { id: input.id, type: "texto", text: input.text }
          : { id: input.id, type: input.type, path: input.path },
      ),
    }),
  }).catch(() => null);

  if (!response) throw new CaptureRequestError("Se perdió la conexión. Intenta de nuevo.");

  const body = (await response.json().catch(() => null)) as
    | (CaptureResult & { error?: undefined })
    | { error: string; code?: string }
    | null;

  if (!response.ok || !body || body.error !== undefined) {
    const failure = body && "error" in body && body.error ? body : null;
    throw new CaptureRequestError(failure?.error ?? "No pudimos procesar la captura. Intenta de nuevo.", failure?.code);
  }

  return body;
}

// GET: la captura por revisar con sus propuestas en orden, sus entradas y el catálogo activo
// (para elegir otro producto y calcular cómo quedará el stock).
export async function getCaptureReview(captureId: string): Promise<ReviewData> {
  const supabase = createClient();

  const [{ data: capture, error: captureError }, { data: products, error: productsError }] = await Promise.all([
    supabase
      .from("captures")
      .select(
        "id, created_at, capture_inputs(id, type, is_relevant, rejection_reason, storage_path, position), capture_items(id, input_id, raw_text, product_mention, llm_product_id, suggested_product_name, llm_type, llm_quantity, quantity_mentioned, unit_mentioned, review_note, position)",
      )
      .eq("id", captureId)
      .eq("status", "en_revision")
      .maybeSingle(),
    supabase
      .from("products")
      .select("id, name, unit, current_quantity, minimum_quantity, image_path")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (captureError || productsError) throw new Error("No pudimos cargar la revisión. Intenta de nuevo.");
  if (!capture) throw new Error("Esta captura ya se revisó.");

  const signed = await signProductImages(supabase, (products ?? []).map((product) => product.image_path));
  const inputs = [...capture.capture_inputs].sort((a, b) => a.position - b.position);
  const inputType = new Map(inputs.map((input) => [input.id, input.type]));

  return {
    captureId: capture.id,
    createdAt: capture.created_at,
    inputs: inputs.map((input) => ({
      id: input.id,
      type: input.type,
      isRelevant: input.is_relevant ?? false,
      rejectionReason: input.rejection_reason,
      storagePath: input.storage_path,
    })),
    items: [...capture.capture_items]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        id: item.id,
        inputType: (item.input_id && inputType.get(item.input_id)) || "texto",
        rawText: item.raw_text,
        mention: item.product_mention,
        productId: item.llm_product_id,
        suggestedName: item.suggested_product_name,
        type: item.llm_type,
        quantity: item.llm_quantity === null ? null : Number(item.llm_quantity),
        quantityMentioned: item.quantity_mentioned === null ? null : Number(item.quantity_mentioned),
        unitMentioned: item.unit_mentioned,
        note: item.review_note,
      })),
    products: (products ?? []).map((product) => ({
      id: product.id,
      name: product.name,
      unit: product.unit,
      quantity: Number(product.current_quantity),
      minimum: Number(product.minimum_quantity),
      imageUrl: product.image_path ? (signed.get(product.image_path) ?? null) : null,
    })),
  };
}

// Los archivos de las entradas usadas se borran al cerrar la revisión; los de entradas
// rechazadas se quedan para medir el rechazo (docs/decisiones-captura.md, puntos 3 y 9).
// Si el borrado falla, la revisión ya quedó guardada: no se le muestra error a la persona.
async function removeUsedFiles(review: ReviewData) {
  const paths = review.inputs
    .filter((input) => input.isRelevant && input.storagePath)
    .map((input) => input.storagePath!);
  if (paths.length > 0) await createClient().storage.from("captures").remove(paths);
}

// POST: registra lo aceptado en una sola transacción (función confirm_capture).
export async function confirmCaptureReview(review: ReviewData, decisions: ReviewDecision[]): Promise<number> {
  const { data, error } = await createClient().rpc("confirm_capture", {
    p_capture_id: review.captureId,
    p_decisions: decisions.map((decision) =>
      decision.action === "aceptar"
        ? {
            item_id: decision.itemId,
            action: "aceptar",
            product_id: decision.productId,
            type: decision.type,
            quantity: decision.quantity,
          }
        : { item_id: decision.itemId, action: "descartar" },
    ) as Json,
  });

  // Los mensajes de la función ya vienen en español y dicen qué propuesta falló.
  if (error) throw new Error(error.message || "No pudimos registrar la revisión.");
  await removeUsedFiles(review).catch(() => null);
  return data;
}

// DELETE: descarta la captura completa sin registrar nada (función discard_capture).
export async function discardCaptureReview(review: ReviewData) {
  const { error } = await createClient().rpc("discard_capture", { p_capture_id: review.captureId });
  if (error) throw new Error(error.message || "No pudimos descartar la captura.");
  await removeUsedFiles(review).catch(() => null);
}
