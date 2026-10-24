"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useRevertMovement } from "@/features/shared/movements/useRevertMovement";
import { queryKeys } from "@/features/shared/query-keys";
import { getHistory } from "../../history-api";
import type { HistoryKind } from "../../shared/types/history-entry";

// Línea de tiempo paginada (scroll infinito) con filtro por tipo y, opcional, por producto.
export function useHistoryList({ productId }: { productId?: string } = {}) {
  const [kind, setKind] = useState<HistoryKind>("todo");

  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    // Empieza con queryKeys.history: cualquier cambio de stock o de catálogo la invalida.
    queryKey: [...queryKeys.history, { kind, productId }],
    queryFn: ({ pageParam }) => getHistory({ kind, productId, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  const entries = useMemo(() => data?.pages.flatMap((page) => page.entries) ?? [], [data]);
  const { revertMovement, revertingId } = useRevertMovement();

  return {
    entries,
    revertMovement,
    revertingId,
    kind,
    setKind,
    isLoading,
    error,
    refetch,
    loadMore: () => fetchNextPage(),
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
  };
}
