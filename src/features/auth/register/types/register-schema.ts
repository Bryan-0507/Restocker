import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Escribe tu nombre completo."),
  email: z.email("Escribe un correo válido."),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres."),
});

export type RegisterValues = z.infer<typeof registerSchema>;
