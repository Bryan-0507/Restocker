"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerManualMovement } from "../../inventory-api";
import { queryKeys } from "@/features/shared/query-keys";
import type { ManualMovementInput } from "../../shared/types/inventory-data";

const successMessage: Record<ManualMovementInput["type"], string> = {
  entrada: "Entrada registrada",
  uso: "Uso registrado",
  perdida: "Pérdida registrada",
  ajuste: "Stock ajustado",
};

// Lógica del movimiento manual. El formulario (tipo + cantidad) se arma sobre este hook.
export function useManualMovement({ onDone }: { onDone?: () => void } = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: registerManualMovement,
    onSuccess: async (_id, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog }),
        queryClient.invalidateQueries({ queryKey: queryKeys.history }),
      ]);
      toast.success(successMessage[input.type]);
      onDone?.();
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    registerMovement: mutation.mutate,
    isPending: mutation.isPending,
  };
}
