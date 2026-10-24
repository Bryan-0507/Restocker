"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, UserRound, Users, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCurrentSession } from "@/features/shared/hooks/useCurrentSession";
import { signOut } from "@/features/shared/session/session-api";

type Option = {
  label: string;
  description: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  href?: string;
  // Mientras no exista la pantalla, avisa con un toast en lugar de navegar.
  comingSoon?: string;
};

const options: Option[] = [
  {
    label: "Mi perfil",
    description: "Nombre, correo y contraseña",
    icon: UserRound,
    comingSoon: "Pronto podrás cambiar tu nombre, correo y contraseña.",
  },
  {
    label: "Miembros e invitaciones",
    description: "Invita a tu equipo y define su rol",
    icon: Users,
    adminOnly: true,
    href: "/ajustes/miembros",
  },
  {
    label: "Mi negocio",
    description: "Nombre y giro",
    icon: Building2,
    adminOnly: true,
    comingSoon: "Pronto podrás editar el nombre y el giro de tu negocio.",
  },
];

export function useSettingsMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, isAdmin } = useCurrentSession();

  const signOutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    session,
    roleLabel: session ? (isAdmin ? "Administrador" : "Trabajador") : "",
    options: options.filter((option) => !option.adminOnly || isAdmin),
    onSelectOption: (option: Option) => {
      if (option.href) router.push(option.href);
      else if (option.comingSoon) toast.info(`${option.label} está en construcción`, { description: option.comingSoon });
    },
    onSignOut: () => signOutMutation.mutate(),
    isSigningOut: signOutMutation.isPending,
  };
}
