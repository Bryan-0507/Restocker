import { z } from "zod";
import { BUSINESS_CATEGORY_OPTIONS } from "@/features/shared/utils/business-categories";

const categories = BUSINESS_CATEGORY_OPTIONS.map((option) => option.value) as [string, ...string[]];

export const businessSchema = z
  .object({
    name: z.string().trim().min(2, "Escribe el nombre de tu negocio."),
    category: z.enum(categories, "Elige el giro de tu negocio."),
    categoryOther: z.string().trim().optional(),
  })
  .refine((values) => values.category !== "otro" || (values.categoryOther?.length ?? 0) > 1, {
    path: ["categoryOther"],
    message: "Cuéntanos a qué se dedica tu negocio.",
  });

export type BusinessValues = z.infer<typeof businessSchema>;
