"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateProduct } from "../../catalog-api";
import { queryKeys } from "@/features/shared/query-keys";
import type { UpdateProductChanges } from "../../shared/types/catalog-product";

// Lógica de "Editar producto": manda solo los campos que cambiaron (PATCH).
export function useUpdateProduct({ onUpdated }: { onUpdated?: () => void } = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: UpdateProductChanges }) => updateProduct(id, changes),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
        queryClient.invalidateQueries({ queryKey: queryKeys.history }),
      ]);
      toast.success("Cambios guardados");
      onUpdated?.();
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    updateProduct: (id: string, changes: UpdateProductChanges) => mutation.mutate({ id, changes }),
    isPending: mutation.isPending,
  };
}
