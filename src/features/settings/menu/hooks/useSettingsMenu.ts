import { Building2, UserRound, Users, type LucideIcon } from "lucide-react";
import { useCurrentSession } from "@/features/shared/hooks/useCurrentSession";

type Option = { label: string; description: string; icon: LucideIcon; adminOnly?: boolean };

const options: Option[] = [
  { label: "Mi perfil", description: "Nombre, correo y contraseña", icon: UserRound },
  { label: "Miembros e invitaciones", description: "Invita a tu equipo y define su rol", icon: Users, adminOnly: true },
  { label: "Mi negocio", description: "Nombre, giro y unidades", icon: Building2, adminOnly: true },
];

export function useSettingsMenu() {
  const { user, isAdmin } = useCurrentSession();
  return {
    user,
    roleLabel: isAdmin ? "Administrador" : "Usuario",
    options: options.filter((option) => !option.adminOnly || isAdmin),
  };
}
