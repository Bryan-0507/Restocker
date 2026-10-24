"use client";

import { BookOpen, Camera, Hand, Keyboard, Mic, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/shared/components/page-header";
import type { MovementType } from "@/features/shared/types/inventory";
import { formatQuantity } from "@/features/shared/utils/units";
import { useHistoryList } from "../hooks/useHistoryList";
import type { CatalogEventType, HistoryEntry, MovementSource } from "../../shared/types/history-entry";

const sourceIcon = { foto: Camera, audio: Mic, texto: Keyboard, manual: Hand } satisfies Record<MovementSource, unknown>;

const movementVariant = {
  entrada: "ok",
  uso: "secondary",
  perdida: "out",
  ajuste: "outline",
} as const satisfies Record<MovementType, string>;

const movementLabel: Record<MovementType, string> = {
  entrada: "Entrada",
  uso: "Uso",
  perdida: "Pérdida",
  ajuste: "Ajuste",
};

const catalogLabel: Record<CatalogEventType, string> = {
  producto_creado: "Producto creado",
  producto_editado: "Producto editado",
  producto_desactivado: "Producto desactivado",
  producto_reactivado: "Producto reactivado",
  alias_agregado: "Alias agregado",
  alias_quitado: "Alias quitado",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("es-GT", { dateStyle: "medium", timeStyle: "short" });
}

export function HistoryList() {
  const { entries, loadMore, hasMore, isLoadingMore, revertMovement, revertingId } = useHistoryList();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Historial" />

      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <HistoryRow
            key={`${entry.kind}-${entry.id}`}
            entry={entry}
            onRevert={revertMovement}
            isReverting={revertingId === entry.id}
          />
        ))}
      </ul>

      {hasMore && (
        <Button variant="secondary" size="touch" onClick={loadMore} disabled={isLoadingMore} className="self-center">
          {isLoadingMore ? "Cargando…" : "Ver más"}
        </Button>
      )}
    </div>
  );
}

function HistoryRow({
  entry,
  onRevert,
  isReverting,
}: {
  entry: HistoryEntry;
  onRevert: (movementId: string) => void;
  isReverting: boolean;
}) {
  const Icon = entry.kind === "movimiento" ? sourceIcon[entry.source] : BookOpen;

  return (
    <li className="flex items-center gap-3 rounded-card bg-card px-4 py-3.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-heading text-lg font-bold leading-tight">{entry.product.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {entry.performedBy.name} · {formatTime(entry.createdAt)}
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {entry.kind === "movimiento" ? (
          <>
            <span className="font-medium">
              {entry.quantity > 0 ? "+" : "−"}
              {formatQuantity(Math.abs(entry.quantity), entry.product.unit)}
            </span>
            <Badge variant={movementVariant[entry.type]}>{movementLabel[entry.type]}</Badge>

            {entry.revertedBy && <span className="text-xs text-muted-foreground">Deshecho</span>}
            {entry.revertsMovementId && <span className="text-xs text-muted-foreground">Deshace un movimiento</span>}

            {entry.canRevert && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRevert(entry.id)}
                disabled={isReverting}
                className="h-8 px-2 text-xs"
              >
                <Undo2 aria-hidden />
                {isReverting ? "Deshaciendo…" : "Deshacer"}
              </Button>
            )}
          </>
        ) : (
          <Badge variant="secondary">{catalogLabel[entry.type]}</Badge>
        )}
      </div>
    </li>
  );
}
