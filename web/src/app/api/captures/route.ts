import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { BUSINESS_CATEGORY_OPTIONS } from "@/features/shared/utils/business-categories";
import { runCaptureModel, type CaptureMedia } from "@/features/capture/shared/llm/capture-model";
import type { PromptInput } from "@/features/capture/shared/llm/capture-prompt";
import { CONFIDENCE_SCORE } from "@/features/capture/shared/llm/capture-response-schema";

// Límites de docs/decisiones-captura.md (punto 1) y del tamaño de la llamada (20 MB en total).
const MAX_PHOTOS = 10;
const MAX_TEXT_LENGTH = 12_000;
const MAX_PHOTO_BYTES = 1_000_000;
const MAX_AUDIO_BYTES = 2_000_000;
const DAILY_LIMIT = 50;
// Guatemala no cambia de horario: el día empieza a las 06:00 UTC.
const BUSINESS_UTC_OFFSET_HOURS = -6;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
// Chrome graba audio/webm; Safari, audio/mp4, que Gemini acepta como m4a.
const AUDIO_TYPES: Record<string, string> = {
  "audio/webm": "audio/webm",
  "audio/mp4": "audio/m4a",
  "audio/m4a": "audio/m4a",
  "audio/x-m4a": "audio/m4a",
  "audio/aac": "audio/aac",
  "audio/mpeg": "audio/mpeg",
  "audio/mp3": "audio/mp3",
  "audio/ogg": "audio/ogg",
  "audio/wav": "audio/wav",
};

const captureSchema = z.object({
  captureId: z.uuid(),
  inputs: z
    .array(
      z.discriminatedUnion("type", [
        z.object({ id: z.uuid(), type: z.literal("texto"), text: z.string().trim().min(1).max(MAX_TEXT_LENGTH) }),
        z.object({ id: z.uuid(), type: z.enum(["foto", "audio"]), path: z.string().min(1) }),
      ]),
    )
    .min(1),
});

type CaptureInput = z.infer<typeof captureSchema>["inputs"][number];

function error(status: number, message: string, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

function startOfBusinessDay() {
  const offsetMs = BUSINESS_UTC_OFFSET_HOURS * 60 * 60 * 1000;
  const local = new Date(Date.now() + offsetMs);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - offsetMs).toISOString();
}

// POST: procesa una captura. El navegador ya subió fotos y audio a Storage en
// <business_id>/<captureId>/...; aquí se descargan, se mandan a Gemini junto con el catálogo y,
// según la respuesta, se guarda la captura para revisar, la rechazada o el error.
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return error(401, "Tu sesión expiró. Inicia sesión de nuevo.");

  const parsed = captureSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error(400, "La captura no tiene un formato válido.");

  const { captureId, inputs } = parsed.data;
  const photos = inputs.filter((input) => input.type === "foto");
  const audios = inputs.filter((input) => input.type === "audio");
  const texts = inputs.filter((input) => input.type === "texto");

  if (photos.length > MAX_PHOTOS || audios.length > 1 || texts.length > 1) {
    return error(400, `Puedes mandar hasta ${MAX_PHOTOS} fotos, un audio y un texto por captura.`);
  }

  const { data: profile } = await supabase.from("profiles").select("business_id").eq("id", auth.user.id).single();
  const businessId = profile?.business_id;
  if (!businessId) return error(403, "Necesitas pertenecer a un negocio para capturar.");

  const folder = `${businessId}/${captureId}/`;
  const files = inputs.filter((input) => input.type !== "texto");
  if (files.some((input) => !input.path.startsWith(folder))) {
    return error(400, "Los archivos de la captura no están en la carpeta correcta.");
  }

  const removeFiles = () =>
    files.length > 0 ? supabase.storage.from("captures").remove(files.map((input) => input.path)) : null;

  const [{ data: business }, { data: products }, { data: pending }, { count: todayCount }] = await Promise.all([
    supabase.from("businesses").select("name, category, category_other").eq("id", businessId).single(),
    supabase
      .from("products")
      .select("id, name, unit, current_quantity, product_aliases(alias)")
      .eq("is_active", true)
      .order("name"),
    supabase.from("captures").select("id").in("status", ["procesando", "en_revision"]).limit(1),
    supabase.from("captures").select("id", { count: "exact", head: true }).gte("created_at", startOfBusinessDay()),
  ]);

  if (!business || !products) {
    return error(500, "No pudimos leer tu negocio. Intenta de nuevo.");
  }

  if (products.length === 0) {
    await removeFiles();
    return error(409, "Agrega productos a tu catálogo antes de capturar.", "catalogo_vacio");
  }

  if (pending && pending.length > 0) {
    await removeFiles();
    return error(409, "Hay una captura pendiente de revisar; revísala primero.", "captura_pendiente");
  }

  if ((todayCount ?? 0) >= DAILY_LIMIT) {
    await removeFiles();
    return error(429, `Llegaron al límite de ${DAILY_LIMIT} capturas por hoy. Mañana puedes seguir.`, "limite_diario");
  }

  // Descarga los archivos ya subidos y revisa tipo y tamaño antes de llamar a Gemini.
  const media: CaptureMedia[] = [];
  for (const input of files) {
    const { data: blob } = await supabase.storage.from("captures").download(input.path);
    if (!blob) {
      await removeFiles();
      return error(400, "No encontramos uno de los archivos. Vuelve a intentarlo.");
    }

    const baseType = blob.type.split(";")[0]!.trim().toLowerCase();
    const mimeType = input.type === "foto" ? (IMAGE_TYPES.has(baseType) ? baseType : null) : (AUDIO_TYPES[baseType] ?? null);
    const maxBytes = input.type === "foto" ? MAX_PHOTO_BYTES : MAX_AUDIO_BYTES;

    if (!mimeType || blob.size > maxBytes) {
      await removeFiles();
      return error(
        400,
        input.type === "foto" ? "Una de las fotos no tiene un formato o tamaño válido." : "El audio no tiene un formato o tamaño válido.",
      );
    }

    media.push({
      inputId: input.id,
      type: input.type,
      mimeType,
      base64: Buffer.from(await blob.arrayBuffer()).toString("base64"),
    });
  }

  const businessCategory =
    business.category === "otro"
      ? (business.category_other ?? "otro")
      : (BUSINESS_CATEGORY_OPTIONS.find((option) => option.value === business.category)?.label ?? business.category);

  const promptInputs: PromptInput[] = inputs.map((input) =>
    input.type === "texto" ? { id: input.id, type: "texto", text: input.text } : { id: input.id, type: input.type },
  );

  const result = await runCaptureModel({
    businessName: business.name,
    businessCategory,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      unit: product.unit,
      quantity: Number(product.current_quantity),
      aliases: product.product_aliases.map((row) => row.alias),
    })),
    inputs: promptInputs,
    media,
  });

  // Los tipos generados no admiten null en argumentos sin default, pero create_capture sí:
  // si Gemini no reportó tokens, la métrica queda vacía en lugar de inventar un cero.
  const metricsArgs = {
    p_capture_id: captureId,
    p_model: result.metrics.model,
    p_prompt_version: result.metrics.promptVersion,
    p_input_tokens: result.metrics.inputTokens as number,
    p_output_tokens: result.metrics.outputTokens as number,
    p_latency_ms: result.metrics.latencyMs,
    p_cost_usd: result.metrics.costUsd as number,
  };

  // Falla técnica tras el reintento: se registra sin entradas y los archivos se borran; el
  // navegador conserva lo cargado para volver a intentarlo.
  if (!result.ok) {
    await removeFiles();
    await supabase.rpc("create_capture", {
      ...metricsArgs,
      p_status: "error",
      p_raw_response: { problem: result.problem, response: result.raw } as Json,
    });
    return error(502, "No pudimos procesar la captura. Intenta de nuevo.", "error_modelo");
  }

  const { response } = result;
  const verdictByInputId = new Map(response.inputs.map((verdict) => [result.inputIdByAlias.get(verdict.input_id)!, verdict]));

  const toDbInput = (input: CaptureInput) => {
    const verdict = verdictByInputId.get(input.id);
    return {
      id: input.id,
      type: input.type,
      storage_path: input.type === "texto" ? null : input.path,
      text_content: input.type === "texto" ? input.text : null,
      transcription: verdict?.transcription ?? null,
      is_relevant: verdict?.is_relevant ?? null,
      rejection_category: verdict?.rejection_category ?? null,
      rejection_reason: verdict?.rejection_reason ?? null,
    };
  };

  const items =
    response.status === "aceptada"
      ? response.items.map((item) => ({
          input_id: result.inputIdByAlias.get(item.input_id)!,
          raw_text: item.raw_text,
          product_mention: item.product_mention,
          product_id: item.product_id ? (result.productIdByAlias.get(item.product_id) ?? null) : null,
          suggested_product_name: item.suggested_product_name,
          type: item.type,
          quantity_mentioned: item.quantity_mentioned,
          unit_mentioned: item.unit_mentioned,
          quantity: item.quantity,
          review_note: item.review_note,
          confidence: CONFIDENCE_SCORE[item.confidence],
        }))
      : [];

  // Las rechazadas también se guardan, con sus archivos, para medir qué tan bien rechaza (punto 9).
  const { error: saveError } = await supabase.rpc("create_capture", {
    ...metricsArgs,
    p_status: response.status === "aceptada" ? "en_revision" : "rechazada",
    p_raw_response: result.raw as Json,
    p_rejection_message: response.status === "rechazada" ? response.message : undefined,
    p_inputs: inputs.map(toDbInput) as Json,
    p_items: items as Json,
  });

  if (saveError) {
    await removeFiles();
    if (saveError.code === "23505") {
      return error(409, "Alguien acaba de enviar una captura; revísala primero.", "captura_pendiente");
    }
    return error(500, "No pudimos guardar la captura. Intenta de nuevo.");
  }

  if (response.status === "rechazada") {
    return NextResponse.json({
      status: "rechazada",
      captureId,
      message: response.message,
      inputs: inputs.map((input) => ({
        id: input.id,
        category: verdictByInputId.get(input.id)?.rejection_category ?? null,
        reason: verdictByInputId.get(input.id)?.rejection_reason ?? null,
      })),
    });
  }

  return NextResponse.json({ status: "en_revision", captureId }, { status: 201 });
}
