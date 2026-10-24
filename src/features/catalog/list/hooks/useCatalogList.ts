"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentSession } from "@/features/shared/hooks/useCurrentSession";
import { addAlias, deactivateProduct, getCatalog, removeAlias } from "../../catalog-api";
import { catalogListKey, inventoryListKey } from "../../shared/catalog-query-keys";

export function useCatalogList() {
  const queryClient = useQueryClient();
  const { session, isAdmin } = useCurrentSession();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: catalogListKey,
    queryFn: getCatalog,
  });

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: catalogListKey }),
      queryClient.invalidateQueries({ queryKey: inventoryListKey }),
    ]);
  }

  const deactivateMutation = useMutation({
    mutationFn: deactivateProduct,
    onSuccess: async () => {
      await invalidate();
      toast.success("Producto quitado del catálogo");
    },
    onError: (err) => toast.error(err.message),
  });

  const addAliasMutation = useMutation({
    mutationFn: ({ productId, alias }: { productId: string; alias: string }) =>
      addAlias({ productId, alias, businessId: session!.business!.id }),
    onSuccess: invalidate,
    onError: (err) => toast.error(err.message),
  });

  const removeAliasMutation = useMutation({
    mutationFn: removeAlias,
    onSuccess: invalidate,
    onError: (err) => toast.error(err.message),
  });

  return {
    items: data ?? [],
    isLoading,
    error,
    refetch,
    canEdit: isAdmin,
    deactivateProduct: (id: string) => deactivateMutation.mutate(id),
    isDeactivating: deactivateMutation.isPending,
    addAlias: (productId: string, alias: string) => addAliasMutation.mutate({ productId, alias }),
    isAddingAlias: addAliasMutation.isPending,
    removeAlias: (aliasId: string) => removeAliasMutation.mutate(aliasId),
  };
}
