import "server-only";
import { GoogleGenAI } from "@google/genai";
import { buildUserPrompt, PROMPT_VERSION, SYSTEM_INSTRUCTION, type PromptCatalogProduct, type PromptInput } from "./capture-prompt";
import { buildCaptureResponseJsonSchema, parseCaptureResponse, type CaptureResponse } from "./capture-response-schema";

// Configuración de la llamada; vive solo en el servidor (docs/decisiones-captura.md, punto 8).
// Gemini 3.6+ ignora temperature, top_p y top_k, así que no se mandan.
export const CAPTURE_MODEL = process.env.GEMINI_CAPTURE_MODEL || "gemini-3.8-flash";
// Si el modelo principal está saturado (503) o se pasó el límite de la API gratuita (429), el
// reintento usa este. Cada captura guarda el modelo que de verdad respondió.
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";
const SATURATED_STATUSES = new Set([429, 503]);
const THINKING_LEVEL = "low";
// Alta para que se lea el texto de los tickets; cuesta más tokens por foto.
const IMAGE_RESOLUTION = "high";
const MAX_OUTPUT_TOKENS = 8192;
// Un reintento automático ante una falla técnica o una respuesta inválida (punto 5).
const MAX_ATTEMPTS = 2;
// Tope por llamada: dos intentos caben holgados en los 300 s de una función de Vercel.
const REQUEST_TIMEOUT_MS = 60_000;

// Precio de la API de pago por millón de tokens (ai.google.dev/pricing, oct 2026). Se usa en la
// API gratuita igual, para reportar cuánto costaría cada captura. El thinking se cobra como salida.
const PRICE_PER_MILLION: Record<string, { input: number; output: number }> = {
  "gemini-3.8-flash": { input: 0.75, output: 3.75 },
  "gemini-3.5-flash-lite": { input: 0.3, output: 2.5 },
};

export type CaptureMedia = { inputId: string; type: "foto" | "audio"; mimeType: string; base64: string };

export type CaptureRunMetrics = {
  model: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  costUsd: number | null;
};

export type CaptureRunResult =
  | {
      ok: true;
      response: CaptureResponse;
      raw: unknown;
      metrics: CaptureRunMetrics;
      productIdByAlias: Map<string, string>;
      inputIdByAlias: Map<string, string>;
    }
  | { ok: false; problem: string; raw: unknown; metrics: CaptureRunMetrics };

let client: GoogleGenAI | null = null;
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY en el entorno del servidor");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

function costOf(model: string, inputTokens: number | null, outputTokens: number | null) {
  const price = PRICE_PER_MILLION[model];
  if (!price || inputTokens === null || outputTokens === null) return null;
  return Number(((inputTokens * price.input + outputTokens * price.output) / 1_000_000).toFixed(6));
}

// Procesa una captura: arma el prompt, llama a Gemini y valida la respuesta. Reintenta una vez
// si la llamada falla o la respuesta no pasa la validación. Las métricas son las del último intento.
export async function runCaptureModel({
  businessName,
  businessCategory,
  products,
  inputs,
  media,
}: {
  businessName: string;
  businessCategory: string;
  products: PromptCatalogProduct[];
  inputs: PromptInput[];
  media: CaptureMedia[];
}): Promise<CaptureRunResult> {
  const prompt = buildUserPrompt({ businessName, businessCategory, products, inputs });
  const mediaById = new Map(media.map((file) => [file.inputId, file]));

  // Las partes van en el orden del prompt: cada archivo justo después de su marcador.
  const input = prompt.parts.map((part) => {
    if (part.kind === "text") return { type: "text" as const, text: part.text };
    const file = mediaById.get(part.inputId);
    if (!file) throw new Error(`Falta el archivo de la entrada ${part.inputId}`);
    return file.type === "foto"
      ? { type: "image" as const, data: file.base64, mime_type: file.mimeType, resolution: IMAGE_RESOLUTION }
      : { type: "audio" as const, data: file.base64, mime_type: file.mimeType };
  });

  const schema = buildCaptureResponseJsonSchema(prompt.productAliases, prompt.inputAliases);

  // Un intento con un modelo. saturated dice si la falla fue por demanda (503) o límite (429).
  async function attemptWith(model: string): Promise<{ result: CaptureRunResult; saturated: boolean }> {
    const startedAt = performance.now();
    const metrics: CaptureRunMetrics = {
      model,
      promptVersion: PROMPT_VERSION,
      inputTokens: null,
      outputTokens: null,
      latencyMs: 0,
      costUsd: null,
    };

    try {
      const interaction = await getClient().interactions.create({
        model,
        system_instruction: SYSTEM_INSTRUCTION,
        input,
        response_format: { type: "text", mime_type: "application/json", schema },
        generation_config: { thinking_level: THINKING_LEVEL, max_output_tokens: MAX_OUTPUT_TOKENS },
        // No se guarda la conversación del lado de Google.
        store: false,
      },
      // Los reintentos los maneja este ciclo; los del SDK esperan con backoff y alargan la espera.
      { timeout_ms: REQUEST_TIMEOUT_MS, retries: { strategy: "none" } },
      );

      metrics.latencyMs = Math.round(performance.now() - startedAt);
      const usage = interaction.usage;
      metrics.inputTokens = usage?.total_input_tokens ?? null;
      metrics.outputTokens =
        usage?.total_output_tokens === undefined ? null : usage.total_output_tokens + (usage.total_thought_tokens ?? 0);
      metrics.costUsd = costOf(model, metrics.inputTokens, metrics.outputTokens);

      if (interaction.status !== "completed" || !interaction.output_text) {
        const raw = { status: interaction.status, errors: interaction.errors ?? null, output_text: interaction.output_text ?? null };
        return { result: { ok: false, problem: `La llamada terminó con estado ${interaction.status}`, raw, metrics }, saturated: false };
      }

      let raw: unknown;
      try {
        raw = JSON.parse(interaction.output_text);
      } catch {
        const result = { ok: false as const, problem: "La respuesta no es JSON", raw: { output_text: interaction.output_text }, metrics };
        return { result, saturated: false };
      }

      const parsed = parseCaptureResponse(raw, prompt.productAliases, prompt.inputAliases);
      if (!parsed.ok) return { result: { ok: false, problem: parsed.problem, raw, metrics }, saturated: false };

      const result = {
        ok: true as const,
        response: parsed.response,
        raw,
        metrics,
        productIdByAlias: prompt.productIdByAlias,
        inputIdByAlias: prompt.inputIdByAlias,
      };
      return { result, saturated: false };
    } catch (error) {
      metrics.latencyMs = Math.round(performance.now() - startedAt);
      const status = (error as { status?: unknown }).status;
      const problem = error instanceof Error ? error.message : "Falla al llamar a Gemini";
      return {
        result: { ok: false, problem, raw: null, metrics },
        saturated: typeof status === "number" && SATURATED_STATUSES.has(status),
      };
    }
  }

  // Hasta MAX_ATTEMPTS intentos. Desde que el principal sale saturado se usa el respaldo, y si
  // eso pasa en el último intento, se da uno más para que el respaldo alcance a responder.
  const problems: { model: string; problem: string }[] = [];
  let useFallback = false;

  for (let attempt = 1; ; attempt++) {
    const model: string = useFallback ? FALLBACK_MODEL : CAPTURE_MODEL;
    const { result, saturated } = await attemptWith(model);
    if (result.ok) return result;

    problems.push({ model, problem: result.problem });
    const switchToFallback: boolean = saturated && model !== FALLBACK_MODEL;
    useFallback ||= switchToFallback;

    if (attempt >= MAX_ATTEMPTS && !switchToFallback) {
      // raw guarda qué falló en cada intento, para revisarlo en captures.raw_response.
      return { ...result, raw: { attempts: problems, last: result.raw } };
    }
  }
}
