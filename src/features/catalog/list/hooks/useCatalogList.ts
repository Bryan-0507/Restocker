"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCurrentSession } from "@/features/shared/hooks/useCurrentSession";
import { queryKeys } from "@/features/shared/query-keys";
import { addAlias, deactivateProduct, getCatalog, reactivateProduct, removeAlias } from "../../catalog-api";

// Sin acentos ni mayúsculas, para que "azucar" encuentre "Azúcar".
function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function useCatalogList() {
  const queryClient = useQueryClient();
  const { session } = useCurrentSession();
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  // Qué hoja está abierta: un producto para editar, "new" para crear, o ninguna.
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    // La llave empieza con queryKeys.catalog, así que invalidar el catálogo también refresca esta vista.
    queryKey: [...queryKeys.catalog, { includeInactive: showInactive }],
    queryFn: () => getCatalog({ includeInactive: showInactive }),
  });

  const items = useMemo(() => data ?? [], [data]);

  // Busca por nombre o por cualquiera de sus alias.
  const filteredItems = useMemo(() => {
    const term = normalize(search);
    if (!term) return items;
    return items.filter(
      (product) =>
        normalize(product.name).includes(term) || product.aliases.some((alias) => normalize(alias.alias).includes(term)),
    );
  }, [items, search]);

  // Se deriva de la lista para que la hoja muestre siempre los datos frescos (por ejemplo, tras agregar un alias).
  const selectedProduct = useMemo(
    () => (selectedId && selectedId !== "new" ? (items.find((product) => product.id === selectedId) ?? null) : null),
    [items, selectedId],
  );

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
      setSelectedId(null);
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
    items,
    filteredItems,
    isLoading,
    error,
    refetch,
    search,
    setSearch,
    // Cualquier miembro del negocio opera el catálogo.
    canEdit: Boolean(session?.business),
    showInactive,
    setShowInactive,
    selectedProduct,
    isCreating: selectedId === "new",
    openProduct: (id: string) => setSelectedId(id),
    openNew: () => setSelectedId("new"),
    closeSheet: () => setSelectedId(null),
    deactivateProduct: (id: string) => deactivateMutation.mutate(id),
    reactivateProduct: (id: string) => reactivateMutation.mutate(id),
    isTogglingActive: deactivateMutation.isPending || reactivateMutation.isPending,
    addAlias: (productId: string, alias: string) => addAliasMutation.mutate({ productId, alias }),
    isAddingAlias: addAliasMutation.isPending,
    removeAlias: (aliasId: string) => removeAliasMutation.mutate(aliasId),
  };
}
