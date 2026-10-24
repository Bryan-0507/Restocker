"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentSession } from "@/features/shared/hooks/useCurrentSession";
import { queryKeys } from "@/features/shared/query-keys";
import { addAlias, deactivateProduct, getCatalog, reactivateProduct, removeAlias } from "../../catalog-api";

export function useCatalogList() {
  const queryClient = useQueryClient();
  const { session } = useCurrentSession();
  const [showInactive, setShowInactive] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    // La llave empieza con queryKeys.catalog, así que invalidar el catálogo también refresca esta vista.
    queryKey: [...queryKeys.catalog, { includeInactive: showInactive }],
    queryFn: () => getCatalog({ includeInactive: showInactive }),
  });

  // Todo cambio al catálogo aparece en el inventario y en el historial.
  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog }),
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
      queryClient.invalidateQueries({ queryKey: queryKeys.history }),
    ]);
  }

  const deactivateMutation = useMutation({
    mutationFn: deactivateProduct,
    onSuccess: async () => {
      await invalidate();
      toast.success("Producto desactivado");
    },
    onError: (err) => toast.error(err.message),
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateProduct,
    onSuccess: async () => {
      await invalidate();
      toast.success("Producto reactivado");
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
    // Cualquier miembro del negocio opera el catálogo.
    canEdit: Boolean(session?.business),
    showInactive,
    setShowInactive,
    deactivateProduct: (id: string) => deactivateMutation.mutate(id),
    reactivateProduct: (id: string) => reactivateMutation.mutate(id),
    isTogglingActive: deactivateMutation.isPending || reactivateMutation.isPending,
    addAlias: (productId: string, alias: string) => addAliasMutation.mutate({ productId, alias }),
    isAddingAlias: addAliasMutation.isPending,
    removeAlias: (aliasId: string) => removeAliasMutation.mutate(aliasId),
  };
}
