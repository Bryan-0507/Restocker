import { z } from "zod";

export const welcomeSchema = z.object({
  fullName: z.string().trim().min(2, "Escribe tu nombre completo."),
  password: z.string().min(8, "La contraseña necesita al menos 8 caracteres."),
});

export type WelcomeValues = z.infer<typeof welcomeSchema>;
