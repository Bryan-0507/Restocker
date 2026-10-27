import { z } from "zod";

// Contrato de salida de la llamada multimodal. El mismo esquema va a Gemini como JSON Schema
// (response schema) y se vuelve a validar aquí: Gemini garantiza la forma, no que los valores
// tengan sentido, y descarta en silencio restricciones como minLength.
//
// Orden de campos a propósito: primero la evidencia (raw_text, product_mention, lo mencionado), luego la decisión
// (producto, tipo, cantidad convertida), después la nota y al final la confianza. Al implementar
// la llamada, comprobar que Gemini respeta este orden (antes ordenaba alfabético sin propertyOrdering).

export const MOVEMENT_TYPES = ["entrada", "uso", "perdida", "ajuste"] as const;

// La confianza va en tres niveles y no como número: la confianza verbalizada como número sale
// sobreconfiada y copia los valores de los ejemplos. Se guarda como número con este mapa.
export const CONFIDENCE_LEVELS = ["alta", "media", "baja"] as const;
export const CONFIDENCE_SCORE: Record<(typeof CONFIDENCE_LEVELS)[number], number> = {
  alta: 0.95,
  media: 0.75,
  baja: 0.4,
};

// Por qué se rechaza una entrada. Es enum y no solo texto para poder medir en el eval qué tipo
// de entrada sin sentido se detecta bien y cuál no.
export const REJECTION_CATEGORIES = [
  "sin_relacion",
  "sin_sentido",
  "ilegible",
  "inaudible",
  "consulta",
  "sin_movimiento",
  "instrucciones",
] as const;

// Tope de propuestas por captura; Gemini sí respeta maxItems.
const MAX_ITEMS = 60;

const inputVerdictFields = {
  transcription: z
    .string()
    .nullable()
    .describe("Solo para audio, sea relevante o no: transcripción literal en español. Para foto y texto, null."),
  is_relevant: z
    .boolean()
    .describe("true solo si de esta entrada sale al menos una propuesta de movimiento; si no, false."),
  rejection_category: z
    .enum(REJECTION_CATEGORIES)
    .nullable()
    .describe("Si is_relevant es false, la categoría de rechazo según las reglas. Si es true, null."),
  rejection_reason: z
    .string()
    .nullable()
    .describe("Si is_relevant es false, qué se recibió y por qué no sirve, en una frase para la persona. Si es true, null."),
};

const rawText = z
  .string()
  .describe("La evidencia: la frase literal del texto o del audio, o la línea del ticket tal como se lee.");

// La palabra con la que se reconoció el producto. Si la persona corrige el producto en la
// revisión, esta palabra se guarda como alias aprendido del producto correcto.
const productMention = z
  .string()
  .describe(
    "La palabra o frase exacta, tomada de raw_text, con la que identificaste el producto ('mochiko', 'fresitas', 'AZUCAR BLANCA'). Sin cantidad ni unidad.",
  );

const itemFields = {
  suggested_product_name: z
    .string()
    .nullable()
    .describe("Solo si product_id es null: cómo nombrar el producto nuevo, en singular y sin cantidad. Si no, null."),
  type: z.enum(MOVEMENT_TYPES).describe("entrada, uso, perdida o ajuste, según las reglas de clasificación."),
  quantity_mentioned: z
    .number()
    .nullable()
    .describe("El número tal como se dijo o se vio, antes de convertir. null si no hubo número."),
  unit_mentioned: z
    .string()
    .nullable()
    .describe("La unidad tal como se dijo o se vio ('libras', 'bolsas', 'g'). null si no se mencionó."),
  quantity: z
    .number()
    .nullable()
    .describe(
      "Cantidad positiva convertida a la unidad del producto y redondeada a 3 decimales. En ajuste, el total contado. null si no se puede saber o convertir.",
    ),
  review_note: z
    .string()
    .nullable()
    .describe("Una frase para quien revisa si algo quedó dudoso (conversión, producto ambiguo, letra ilegible). null si todo está claro."),
  confidence: z
    .enum(CONFIDENCE_LEVELS)
    .describe("Qué tan probable es que la persona confirme esta propuesta sin editarla: alta, media o baja."),
};

// Esquema de cada llamada: los ids que puede devolver el modelo son enums con los alias cortos
// de esta captura (p1…pn, e1…en), así no puede inventar ni copiar mal un UUID, y hay exactamente
// un veredicto por entrada.
export function buildCaptureResponseSchema(productAliases: string[], inputAliases: string[]) {
  const inputId = z.enum(inputAliases as [string, ...string[]]).describe("El id de la entrada, como en <entrada id=...>.");
  const productId = (
    productAliases.length > 0 ? z.enum(productAliases as [string, ...string[]]).nullable() : z.null()
  ).describe("El id de un producto del <catalogo> que coincide por nombre o alias. null si ninguno coincide con seguridad.");

  const inputs = z
    .array(z.object({ input_id: inputId, ...inputVerdictFields }))
    .min(inputAliases.length)
    .max(inputAliases.length)
    .describe("Un veredicto por cada entrada recibida, en el mismo orden.");

  // Dos formas de respuesta. "rechazada" no trae propuestas: solo el veredicto de cada entrada y
  // un mensaje para la persona. Así la app muestra un error claro en lugar de una revisión vacía.
  return z.discriminatedUnion("status", [
    z.object({
      inputs,
      status: z.literal("aceptada").describe("Al menos una entrada produjo una propuesta de movimiento."),
      items: z
        .array(z.object({ input_id: inputId, raw_text: rawText, product_mention: productMention, product_id: productId, ...itemFields }))
        .min(1)
        .max(MAX_ITEMS)
        .describe("Una propuesta por cada producto y movimiento detectado en las entradas relevantes."),
    }),
    z.object({
      inputs,
      status: z.literal("rechazada").describe("Ninguna entrada describe un movimiento de inventario."),
      message: z
        .string()
        .describe(
          "Mensaje para la persona, en segunda persona y en una o dos frases: qué recibiste, por qué no se puede registrar y qué puede mandar en su lugar.",
        ),
    }),
  ]);
}

export type CaptureResponse = z.infer<ReturnType<typeof buildCaptureResponseSchema>>;

// Zod genera palabras que Gemini no documenta ($schema, oneOf para la unión, const para los
// literales); se cambian por sus equivalentes soportados (anyOf, enum de un valor).
// El tope de propuestas (maxItems: MAX_ITEMS) tampoco se manda: Gemini lo convierte en una
// gramática con demasiados estados y rechaza el esquema (400). Lo sigue validando zod.
function toGeminiSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toGeminiSchema);
  if (node === null || typeof node !== "object") return node;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "$schema") continue;
    if (key === "maxItems" && value === MAX_ITEMS) continue;
    if (key === "oneOf") result.anyOf = toGeminiSchema(value);
    else if (key === "const") result.enum = [value];
    else result[key] = toGeminiSchema(value);
  }
  return result;
}

// JSON Schema para el parámetro de esquema de respuesta de Gemini.
export function buildCaptureResponseJsonSchema(productAliases: string[], inputAliases: string[]) {
  return toGeminiSchema(z.toJSONSchema(buildCaptureResponseSchema(productAliases, inputAliases))) as Record<
    string,
    unknown
  >;
}

export type CaptureVerdict = CaptureResponse["inputs"][number];

// Valida la respuesta del modelo: la forma con zod y, aparte, que sea coherente consigo misma
// (Gemini cumple el esquema, no estas reglas). Devuelve el primer problema para guardarlo en
// raw_response y marcar la captura como error.
export function parseCaptureResponse(raw: unknown, productAliases: string[], inputAliases: string[]) {
  const parsed = buildCaptureResponseSchema(productAliases, inputAliases).safeParse(raw);
  if (!parsed.success) return { ok: false as const, problem: parsed.error.issues[0]?.message ?? "Respuesta inválida" };

  const response = parsed.data;
  const relevant = new Set(response.inputs.filter((input) => input.is_relevant).map((input) => input.input_id));

  for (const input of response.inputs) {
    if (input.is_relevant === (input.rejection_category !== null)) {
      return { ok: false as const, problem: `La entrada ${input.input_id} no es coherente entre is_relevant y rejection_category` };
    }
  }

  if (response.status === "rechazada" && relevant.size > 0) {
    return { ok: false as const, problem: "Respuesta rechazada con entradas marcadas como relevantes" };
  }

  if (response.status === "aceptada") {
    // Una propuesta que viene de una entrada rechazada no se muestra: el rechazo manda.
    const items = response.items.filter((item) => relevant.has(item.input_id));
    if (items.length === 0) return { ok: false as const, problem: "Respuesta aceptada sin propuestas de entradas relevantes" };
    return { ok: true as const, response: { ...response, items } };
  }

  return { ok: true as const, response };
}
