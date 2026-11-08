"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/features/shared/query-keys";
import { revertMovement } from "./movements-api";

export function useRevertMovement() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: revertMovement,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog }),
        queryClient.invalidateQueries({ queryKey: queryKeys.history }),
      ]);
      toast.success("Movimiento deshecho");
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    revertMovement: (movementId: string) => mutation.mutate(movementId),
    isReverting: mutation.isPending,
    // Para deshabilitar solo la fila que se está deshaciendo.
    revertingId: mutation.isPending ? mutation.variables : null,
  };
}
