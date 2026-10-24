"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, UserRound, Users, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCurrentSession } from "@/features/shared/hooks/useCurrentSession";
import { signOut } from "@/features/shared/session/session-api";

type Option = { label: string; description: string; icon: LucideIcon; adminOnly?: boolean };

const options: Option[] = [
  { label: "Mi perfil", description: "Nombre, correo y contraseña", icon: UserRound },
  { label: "Miembros e invitaciones", description: "Invita a tu equipo y define su rol", icon: Users, adminOnly: true },
  { label: "Mi negocio", description: "Nombre, giro y unidades", icon: Building2, adminOnly: true },
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
    roleLabel: session ? (isAdmin ? "Administrador" : "Usuario") : "",
    options: options.filter((option) => !option.adminOnly || isAdmin),
    onSignOut: () => signOutMutation.mutate(),
    isSigningOut: signOutMutation.isPending,
  };
}
