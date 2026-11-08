"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentSession } from "@/features/shared/hooks/useCurrentSession";
import { queryKeys } from "@/features/shared/query-keys";
import { createProduct, uploadProductImage } from "../../catalog-api";
import type { CreateProductInput } from "../../shared/types/catalog-product";

// Lógica de "Nuevo producto". El formulario (react-hook-form + zod) se arma sobre este hook.
// La foto se sube después de crear el producto, porque su ruta lleva el id.
export function useCreateProduct({ onCreated }: { onCreated?: (id: string) => void } = {}) {
  const queryClient = useQueryClient();
  const { session } = useCurrentSession();

  const mutation = useMutation({
    mutationFn: async ({ input, image }: { input: CreateProductInput; image?: File }) => {
      const id = await createProduct(input);
      if (!image) return { id, imageFailed: false };

      try {
        await uploadProductImage({ productId: id, businessId: session!.business!.id, file: image });
        return { id, imageFailed: false };
      } catch {
        // El producto ya existe; la foto se puede reintentar desde su detalle.
        return { id, imageFailed: true };
      }
    },
    onSuccess: async ({ id, imageFailed }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.catalog }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
        queryClient.invalidateQueries({ queryKey: queryKeys.history }),
      ]);
      if (imageFailed) toast.warning("Producto agregado, pero la foto no se subió. Agrégala desde el producto.");
      else toast.success("Producto agregado");
      onCreated?.(id);
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    createProduct: (input: CreateProductInput, image?: File) => mutation.mutate({ input, image }),
    isPending: mutation.isPending,
  };
}
