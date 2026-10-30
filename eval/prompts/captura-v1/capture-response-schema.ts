import { z } from "zod";

// Contrato de salida de la llamada multimodal. El mismo esquema va a Gemini como JSON Schema
// (response schema) y se vuelve a validar aquí: Gemini garantiza la forma, no que los valores
// tengan sentido, y descarta en silencio restricciones como minLength.
//
// Orden de campos a propósito: primero la evidencia (raw_text), luego la decisión (producto,
// tipo, cantidad) y al final la confianza; el modelo genera en ese orden.

export const MOVEMENT_TYPES = ["entrada", "uso", "perdida", "ajuste"] as const;

export const captureInputVerdictSchema = z.object({
  input_id: z.string().describe("El id de la entrada tal como aparece en <entrada id=...>."),
  is_relevant: z
    .boolean()
    .describe("true si la entrada habla de existencias del negocio; false si no tiene que ver con inventario."),
  rejection_reason: z
    .string()
    .nullable()
    .describe("Si is_relevant es false, por qué en una frase corta para la persona. Si es true, null."),
  transcription: z
    .string()
    .nullable()
    .describe("Solo para audio: transcripción literal en español. Para foto y texto, null."),
});

export const captureItemSchema = z.object({
  input_id: z.string().describe("De qué entrada sale esta propuesta."),
  raw_text: z
    .string()
    .describe(
      "La evidencia: la frase literal del texto o del audio, o lo que se ve en la foto (p. ej. 'ticket: Harina de arroz 2 kg').",
    ),
  product_id: z
    .string()
    .nullable()
    .describe("El id de un producto del <catalogo> que coincide por nombre o alias. null si ninguno coincide con seguridad."),
  suggested_product_name: z
    .string()
    .nullable()
    .describe("Solo si product_id es null: cómo nombrar el producto nuevo, en singular y sin cantidad. Si no, null."),
  type: z.enum(MOVEMENT_TYPES).describe("entrada, uso, perdida o ajuste, según las reglas de clasificación."),
  quantity: z
    .number()
    .nullable()
    .describe(
      "Cantidad positiva ya convertida a la unidad del producto. En ajuste, el total contado. null si no se puede saber o convertir.",
    ),
  unit_mentioned: z
    .string()
    .nullable()
    .describe("La unidad tal como se dijo o se vio ('libras', 'bolsas', 'g'). null si no se mencionó."),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Qué tan seguro estás de producto, tipo y cantidad juntos, de 0 a 1, según la escala de confianza."),
  review_note: z
    .string()
    .nullable()
    .describe("Una frase para quien revisa si algo quedó dudoso (conversión, producto ambiguo). null si todo está claro."),
});

export const captureResponseSchema = z.object({
  inputs: z.array(captureInputVerdictSchema).describe("Un veredicto por cada entrada recibida, en el mismo orden."),
  items: z
    .array(captureItemSchema)
    .describe("Una propuesta por cada producto y movimiento detectado. Vacío si nada es relevante."),
});

export type CaptureResponse = z.infer<typeof captureResponseSchema>;

// JSON Schema para el parámetro de esquema de respuesta de Gemini.
export const captureResponseJsonSchema = z.toJSONSchema(captureResponseSchema);
