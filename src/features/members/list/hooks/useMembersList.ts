"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/features/shared/query-keys";
import type { Role } from "@/features/shared/types/inventory";
import { getMembers, removeMember, setMemberRole } from "../../members-api";

export function useMembersList() {
  const queryClient = useQueryClient();

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

  return {
    members: data ?? [],
    isLoading,
    error,
    refetch,
    setRole: (memberId: string, role: Role) => roleMutation.mutate({ memberId, role }),
    removeMember: (memberId: string) => removeMutation.mutate(memberId),
    // Para deshabilitar solo la fila que se está modificando.
    busyMemberId: roleMutation.isPending
      ? roleMutation.variables?.memberId
      : removeMutation.isPending
        ? removeMutation.variables
        : null,
  };
}
