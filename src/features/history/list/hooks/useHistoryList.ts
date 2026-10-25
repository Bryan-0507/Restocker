"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useRevertMovement } from "@/features/shared/movements/useRevertMovement";
import { queryKeys } from "@/features/shared/query-keys";
import { getHistory } from "../../history-api";
import type { HistoryEntry, HistoryKind } from "../../shared/types/history-entry";
import { dayKey, formatDay } from "../utils/describe-entry";

export const HISTORY_FILTERS: { value: HistoryKind; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "movimiento", label: "Movimientos" },
  { value: "catalogo", label: "Catálogo" },
];

// Línea de tiempo paginada (scroll infinito) con filtro por tipo y, opcional, por producto.
export function useHistoryList({ productId }: { productId?: string } = {}) {
  const [kind, setKind] = useState<HistoryKind>("todo");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    // Empieza con queryKeys.history: cualquier cambio de stock o de catálogo la invalida.
    queryKey: [...queryKeys.history, { kind, productId }],
    queryFn: ({ pageParam }) => getHistory({ kind, productId, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  const entries = useMemo(() => data?.pages.flatMap((page) => page.entries) ?? [], [data]);

  // Agrupadas por día; el orden ya viene del más reciente al más antiguo.
  const days = useMemo(() => {
    const groups: { key: string; label: string; entries: HistoryEntry[] }[] = [];
    for (const entry of entries) {
      const key = dayKey(entry.createdAt);
      const last = groups.at(-1);
      if (last?.key === key) last.entries.push(entry);
      else groups.push({ key, label: formatDay(entry.createdAt), entries: [entry] });
    }
    return groups;
  }, [entries]);

  const { revertMovement, revertingId } = useRevertMovement();

  return {
    days,
    kind,
    setKind: (next: HistoryKind) => {
      setKind(next);
      setConfirmingId(null);
    },
    isLoading,
    error,
    refetch,
    isEmpty: !isLoading && !error && entries.length === 0,
    // Nombre del producto filtrado, para el chip "Solo: …".
    productName: productId ? (entries[0]?.product.name ?? null) : null,
    hasMore: Boolean(hasNextPage),
    isLoadingMore: isFetchingNextPage,
    loadMore: () => {
      if (!isFetchingNextPage) fetchNextPage();
    },
    // Deshacer pide confirmación en la misma fila: puede tratarse de algo de hace días.
    confirmingId,
    askRevert: setConfirmingId,
    cancelRevert: () => setConfirmingId(null),
    confirmRevert: (movementId: string) => {
      revertMovement(movementId);
      setConfirmingId(null);
    },
    revertingId,
  };
}
