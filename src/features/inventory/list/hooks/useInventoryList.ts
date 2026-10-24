"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getInventory } from "../../inventory-api";
import { queryKeys } from "@/features/shared/query-keys";

export function useInventoryList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.inventory,
    queryFn: getInventory,
  });

  const products = useMemo(() => data?.products ?? [], [data]);
  const toRestock = useMemo(() => products.filter((product) => product.needsRestock), [products]);

  return {
    products,
    stats: data?.stats,
    toRestock,
    isLoading,
    error,
    refetch,
  };
}
