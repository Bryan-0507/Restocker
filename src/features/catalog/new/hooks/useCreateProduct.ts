"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createProduct } from "../../catalog-api";
import { queryKeys } from "@/features/shared/query-keys";
import type { CreateProductInput } from "../../shared/types/catalog-product";

// Lógica de "Nuevo producto". El formulario (react-hook-form + zod) se arma sobre este hook.
export function useCreateProduct({ onCreated }: { onCreated?: (id: string) => void } = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: async (id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
        queryClient.invalidateQueries({ queryKey: queryKeys.history }),
      ]);
      toast.success("Producto agregado");
      onCreated?.(id);
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    createProduct: mutation.mutate,
    isPending: mutation.isPending,
  };
}
