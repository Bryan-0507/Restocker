"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { History, RotateCw, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/features/shared/components/page-header";
import { SegmentedControl } from "@/features/shared/components/segmented-control";
import { HISTORY_FILTERS, useHistoryList } from "../hooks/useHistoryList";
import { HistoryListSkeleton } from "./history-list-skeleton";
import { HistoryRow } from "./history-row";

const emptyCopy = {
  todo: "Aquí verás cada entrada, uso, pérdida y cambio del catálogo, con quién lo hizo.",
  movimiento: "Todavía no se ha registrado ningún movimiento de stock.",
  catalogo: "Todavía no hay cambios en el catálogo.",
};

export function HistoryList({ productId }: { productId?: string }) {
  const history = useHistoryList({ productId });

  return (
    // Columna angosta: una línea de tiempo se lee mejor que a todo el ancho.
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <PageHeader title="Historial" />

      <div className="flex flex-col gap-3">
        <SegmentedControl label="Filtrar historial" options={HISTORY_FILTERS} value={history.kind} onChange={history.setKind} />

        {productId && (
          <Link
            href="/historial"
            className="flex items-center gap-2 self-start rounded-full bg-secondary py-1.5 pl-3 pr-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            Solo: {history.productName ?? "este producto"}
            <X className="size-4" aria-label="Quitar filtro de producto" />
          </Link>
        )}
      </div>

      {history.isLoading && <HistoryListSkeleton />}

      {history.error && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-card bg-card px-6 py-10 text-center">
          <p className="font-medium">{history.error.message}</p>
          <Button variant="secondary" size="touch" onClick={() => history.refetch()}>
            <RotateCw aria-hidden />
            Reintentar
          </Button>
        </div>
      )}

      {history.isEmpty && (
        <div className="flex flex-col items-center gap-4 rounded-card bg-card px-6 py-12 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <History className="size-8" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-2xl font-bold">Aún no hay historial</p>
            <p className="max-w-sm text-sm text-muted-foreground">{emptyCopy[history.kind]}</p>
          </div>
          {history.kind !== "catalogo" && (
            <Link href="/" className={buttonVariants({ variant: "secondary", size: "touch" })}>
              Ir al inventario
            </Link>
          )}
        </div>
      )}

      {history.days.map((day) => (
        <section key={day.key} aria-label={day.label} className="flex flex-col gap-2">
          <h2 className="px-1 text-sm font-medium text-muted-foreground">{day.label}</h2>
          <ul className="flex flex-col gap-2">
            {day.entries.map((entry) => (
              <HistoryRow
                key={`${entry.kind}-${entry.id}`}
                entry={entry}
                revert={{
                  isConfirming: history.confirmingId === entry.id,
                  isReverting: history.revertingId === entry.id,
                  onAsk: () => history.askRevert(entry.id),
                  onCancel: history.cancelRevert,
                  onConfirm: () => history.confirmRevert(entry.id),
                }}
              />
            ))}
          </ul>
        </section>
      ))}

      {history.isLoadingMore && <HistoryListSkeleton rows={2} />}

      {/* El final de la lista carga solo; el botón queda por si el navegador no lo detecta. */}
      {history.hasMore && !history.isLoadingMore && (
        <LoadMore onLoad={history.loadMore} />
      )}
    </div>
  );
}

// Carga la siguiente página cuando el final de la lista entra en pantalla.
function LoadMore({ onLoad }: { onLoad: () => void }) {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && onLoad(), { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [onLoad]);

  return (
    <div ref={sentinel} className="flex justify-center">
      <Button variant="ghost" size="touch" onClick={onLoad} className="text-muted-foreground">
        Ver más
      </Button>
    </div>
  );
}
