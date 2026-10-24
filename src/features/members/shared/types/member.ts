import type { Role } from "@/features/shared/types/inventory";

export type Member = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  joinedAt: string;
  // "invitado" mientras no haya entrado nunca (no ha aceptado la invitación).
  status: "activo" | "invitado";
  isCurrentUser: boolean;
};

export type InviteMemberInput = {
  email: string;
  role: Role;
};
