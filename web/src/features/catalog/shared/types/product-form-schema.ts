import { z } from "zod";

const UNITS = ["unidad", "kg", "g", "lb", "oz", "l", "ml"] as const;

// Campos comunes a crear y editar.
export const productFieldsSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del producto."),
  unit: z.enum(UNITS, "Elige la unidad en la que lo cuentas."),
  minimum: z.number("Escribe un número.").min(0, "El mínimo no puede ser negativo."),
  description: z.string().trim().max(300, "Máximo 300 caracteres.").optional(),
});

export type ProductFieldsValues = z.infer<typeof productFieldsSchema>;

export const newProductSchema = productFieldsSchema.extend({
  initialQuantity: z.number("Escribe un número.").min(0, "No puede ser negativa.").optional(),
  aliases: z.array(z.string()),
});

export type NewProductValues = z.infer<typeof newProductSchema>;
