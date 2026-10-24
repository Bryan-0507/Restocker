"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateProduct } from "../../catalog-api";
import { catalogListKey, inventoryListKey } from "../../shared/catalog-query-keys";
import type { UpdateProductChanges } from "../../shared/types/catalog-product";

// Lógica de "Editar producto": manda solo los campos que cambiaron (PATCH).
export function useUpdateProduct({ onUpdated }: { onUpdated?: () => void } = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: UpdateProductChanges }) => updateProduct(id, changes),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: catalogListKey }),
        queryClient.invalidateQueries({ queryKey: inventoryListKey }),
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
