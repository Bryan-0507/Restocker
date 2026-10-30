import { z } from "zod";

// Esquema mínimo de la línea base: solo movimientos, sin veredicto por entrada ni rechazo.
export function buildCaptureResponseJsonSchema(productAliases: string[], inputAliases: string[]) {
  return z.toJSONSchema(
    z.object({
      items: z.array(
        z.object({
          input_id: z.enum(inputAliases as [string, ...string[]]),
          product_id: z.enum(productAliases as [string, ...string[]]).nullable(),
          type: z.enum(["entrada", "uso", "perdida", "ajuste"]),
          quantity: z.number().nullable(),
        }),
      ),
    }),
  );
}
