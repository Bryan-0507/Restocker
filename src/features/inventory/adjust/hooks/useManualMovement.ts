"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerManualMovement } from "../../inventory-api";
import { useRevertMovement } from "@/features/shared/movements/useRevertMovement";
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
  const { revertMovement } = useRevertMovement();

  const mutation = useMutation({
    mutationFn: registerManualMovement,
    onSuccess: async (movementId, input) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog }),
        queryClient.invalidateQueries({ queryKey: queryKeys.history }),
      ]);
      // Deshacer al instante para el error inmediato (cantidad mal escrita, producto equivocado).
      toast.success(successMessage[input.type], {
        action: { label: "Deshacer", onClick: () => revertMovement(movementId) },
        duration: 6000,
      });
      onDone?.();
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    registerMovement: mutation.mutate,
    isPending: mutation.isPending,
  };
}
