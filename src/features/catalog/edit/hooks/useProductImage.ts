"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentSession } from "@/features/shared/hooks/useCurrentSession";
import { queryKeys } from "@/features/shared/query-keys";
import { PRODUCT_IMAGE_ACCEPT } from "@/features/shared/utils/product-images";
import { removeProductImage, uploadProductImage } from "../../catalog-api";

// Subir, reemplazar o quitar la imagen de un producto. La compresión pasa dentro de uploadProductImage.
export function useProductImage(productId: string) {
  const queryClient = useQueryClient();
  const { session } = useCurrentSession();

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog }),
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
      queryClient.invalidateQueries({ queryKey: queryKeys.history }),
    ]);
  }

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadProductImage({ productId, businessId: session!.business!.id, file }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Imagen actualizada");
    },
    onError: (error) => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: () => removeProductImage(productId),
    onSuccess: async () => {
      await invalidate();
      toast.success("Imagen quitada");
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    // Para el atributo accept del <input type="file">.
    accept: PRODUCT_IMAGE_ACCEPT,
    uploadImage: (file: File) => uploadMutation.mutate(file),
    removeImage: () => removeMutation.mutate(),
    isUploading: uploadMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
