import { z } from "zod";

// Contrato de salida de la llamada multimodal. El mismo esquema va a Gemini como JSON Schema
// (response schema) y se vuelve a validar aquí: Gemini garantiza la forma, no que los valores
// tengan sentido, y descarta en silencio restricciones como minLength.
//
// Orden de campos a propósito: primero la evidencia (raw_text, lo mencionado), luego la decisión
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

// Tope de propuestas por captura; Gemini sí respeta maxItems.
const MAX_ITEMS = 60;

const inputVerdictFields = {
  transcription: z
    .string()
    .nullable()
    .describe("Solo para audio, sea relevante o no: transcripción literal en español. Para foto y texto, null."),
  is_relevant: z
    .boolean()
    .describe("true si la entrada habla de existencias del negocio; false si no tiene que ver con inventario."),
  rejection_reason: z
    .string()
    .nullable()
    .describe("Si is_relevant es false, por qué en una frase corta para la persona. Si es true, null."),
};

const rawText = z
  .string()
  .describe("La evidencia: la frase literal del texto o del audio, o la línea del ticket tal como se lee.");

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

  return z.object({
    inputs: z
      .array(z.object({ input_id: inputId, ...inputVerdictFields }))
      .min(inputAliases.length)
      .max(inputAliases.length)
      .describe("Un veredicto por cada entrada recibida, en el mismo orden."),
    items: z
      .array(z.object({ input_id: inputId, raw_text: rawText, product_id: productId, ...itemFields }))
      .max(MAX_ITEMS)
      .describe("Una propuesta por cada producto y movimiento detectado. Vacío si nada es relevante."),
  });
}

export type CaptureResponse = z.infer<ReturnType<typeof buildCaptureResponseSchema>>;

// JSON Schema para el parámetro de esquema de respuesta de Gemini.
export function buildCaptureResponseJsonSchema(productAliases: string[], inputAliases: string[]) {
  return z.toJSONSchema(buildCaptureResponseSchema(productAliases, inputAliases));
}
