"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/features/shared/query-keys";
import type { Role } from "@/features/shared/types/inventory";
import { getMembers, removeMember, setMemberRole } from "../../members-api";

export function useMembersList() {
  const queryClient = useQueryClient();
  // Quitar a alguien pide confirmación en su propia fila.
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.members,
    queryFn: getMembers,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.members });

  const roleMutation = useMutation({
    mutationFn: setMemberRole,
    onSuccess: async () => {
      await invalidate();
      toast.success("Rol actualizado");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: async ({ cancelledInvitation }) => {
      await invalidate();
      toast.success(cancelledInvitation ? "Invitación cancelada" : "Miembro quitado del negocio");
    },
    onError: (err) => toast.error(err.message),
  });

  const members = data ?? [];

  return {
    members,
    // Solo tú en el equipo: se invita a sumar gente en vez de mostrar una lista de uno.
    isAlone: !isLoading && !error && members.length <= 1,
    isLoading,
    error,
    refetch,
    setRole: (memberId: string, role: Role) => roleMutation.mutate({ memberId, role }),
    confirmingRemoveId,
    askRemove: setConfirmingRemoveId,
    cancelRemove: () => setConfirmingRemoveId(null),
    confirmRemove: (memberId: string) => {
      removeMutation.mutate(memberId);
      setConfirmingRemoveId(null);
    },
    // Para deshabilitar solo la fila que se está modificando.
    busyMemberId: roleMutation.isPending
      ? roleMutation.variables?.memberId
      : removeMutation.isPending
        ? removeMutation.variables
        : null,
  };
}
