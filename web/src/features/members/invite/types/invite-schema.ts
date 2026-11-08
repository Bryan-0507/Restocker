import { z } from "zod";

export const inviteSchema = z.object({
  email: z.email("Escribe un correo válido."),
  role: z.enum(["base", "admin"]),
});

export type InviteValues = z.infer<typeof inviteSchema>;
