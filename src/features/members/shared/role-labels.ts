import type { Role } from "@/features/shared/types/inventory";

export const ROLE_LABEL: Record<Role, string> = {
  base: "Trabajador",
  admin: "Administrador",
};

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "base", label: ROLE_LABEL.base },
  { value: "admin", label: ROLE_LABEL.admin },
];
