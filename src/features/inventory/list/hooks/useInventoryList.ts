"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getInventory } from "../../inventory-api";
import { queryKeys } from "@/features/shared/query-keys";

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Inventario agrupado: primero lo que hay que comprar (agotado antes que bajo), luego lo que está al día.
export function useInventoryList() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.inventory,
    queryFn: getInventory,
  });

  const products = useMemo(() => data?.products ?? [], [data]);

  const filtered = useMemo(() => {
    const query = normalize(search);
    if (!query) return products;
    return products.filter((product) => normalize(product.name).includes(query));
  }, [products, search]);

  const toRestock = useMemo(
    () =>
      filtered
        .filter((product) => product.needsRestock)
        // Agotados primero; entre iguales, el que está más lejos de su mínimo.
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === "out" ? -1 : 1;
          return a.quantity / (a.minimum || 1) - b.quantity / (b.minimum || 1);
        }),
    [filtered],
  );
  // Conteos sobre todo el inventario, no sobre la búsqueda: el resumen no cambia al filtrar.
  const counts = useMemo(
    () => ({
      out: products.filter((product) => product.status === "out").length,
      low: products.filter((product) => product.status === "low").length,
    }),
    [products],
  );
  const upToDate = useMemo(() => filtered.filter((product) => !product.needsRestock), [filtered]);

  return {
    isLoading,
    error,
    refetch,
    isEmpty: !isLoading && !error && products.length === 0,
    noResults: products.length > 0 && filtered.length === 0,
    pendingCapture: data?.stats.pendingCapture ?? null,
    search,
    setSearch,
    counts,
    toRestock,
    upToDate,
    // Se busca en la data viva para que la hoja muestre el stock actualizado tras registrar.
    selectedProduct: products.find((product) => product.id === selectedId) ?? null,
    openProduct: setSelectedId,
    closeProduct: () => setSelectedId(null),
  };
}
