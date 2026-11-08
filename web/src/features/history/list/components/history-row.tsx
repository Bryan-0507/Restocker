"use client";

import {
  Archive,
  ArchiveRestore,
  ArrowDownToLine,
  ArrowUpFromLine,
  Camera,
  Keyboard,
  type LucideIcon,
  Mic,
  PackagePlus,
  PackageX,
  Pencil,
  Scale,
  Tag,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MovementType } from "@/features/shared/types/inventory";
import { cn } from "@/lib/utils";
import type { CatalogEventType, HistoryEntry, MovementEntry, MovementSource } from "../../shared/types/history-entry";
import { describeCatalogEntry, formatTime, movementLabel, sourceLabel } from "../utils/describe-entry";

// El ícono dice qué pasó (entró, se usó, se perdió); el medio va aparte, en texto.
const movementIcon: Record<MovementType, { icon: LucideIcon; tone: string }> = {
  entrada: { icon: ArrowDownToLine, tone: "bg-secondary text-secondary-foreground" },
  uso: { icon: ArrowUpFromLine, tone: "bg-status-low text-status-low-foreground" },
  perdida: { icon: PackageX, tone: "bg-status-out text-status-out-foreground" },
  ajuste: { icon: Scale, tone: "bg-status-review text-status-review-foreground" },
};

const catalogIcon: Record<CatalogEventType, LucideIcon> = {
  producto_creado: PackagePlus,
  producto_editado: Pencil,
  producto_desactivado: Archive,
  producto_reactivado: ArchiveRestore,
  alias_agregado: Tag,
  alias_quitado: Tag,
};

const sourceIcon: Partial<Record<MovementSource, LucideIcon>> = { foto: Camera, audio: Mic, texto: Keyboard };

type RevertProps = {
  isConfirming: boolean;
  isReverting: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function HistoryRow({ entry, revert }: { entry: HistoryEntry; revert: RevertProps }) {
  if (entry.kind === "catalogo") {
    const Icon = catalogIcon[entry.type];
    return (
      <li className="flex items-center gap-3 rounded-card bg-card px-4 py-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-heading text-lg font-bold leading-tight">{entry.product.name}</span>
          <span className="text-xs text-muted-foreground">
            {describeCatalogEntry(entry)} · {entry.performedBy.name} · {formatTime(entry.createdAt)}
          </span>
        </div>
      </li>
    );
  }

  return <MovementRow entry={entry} revert={revert} />;
}

function MovementRow({ entry, revert }: { entry: MovementEntry; revert: RevertProps }) {
  const { icon: Icon, tone } = movementIcon[entry.type];
  const SourceIcon = sourceIcon[entry.source];
  const isReverted = Boolean(entry.revertedBy);
  const amount = Number(Math.abs(entry.quantity).toFixed(3));
  const unit = entry.product.unit === "unidad" ? (amount === 1 ? "unidad" : "unidades") : entry.product.unit;

  return (
    <li className="flex flex-col rounded-card bg-card">
      {/* Deshecho: atenuado y tachado, para que no se lea como un movimiento vigente. */}
      <div className={cn("flex items-center gap-3 py-3 pl-4", entry.canRevert ? "pr-2" : "pr-5", isReverted && "opacity-60")}>
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", tone)}>
          <Icon className="size-5" aria-hidden />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-heading text-lg font-bold leading-tight">{entry.product.name}</span>
          <span className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{movementLabel[entry.type]}</span>
            {isReverted && <span>· deshecho</span>}
            {entry.revertsMovementId && <span>· deshace un movimiento</span>}
            <span>· {entry.performedBy.name}</span>
            <span>· {formatTime(entry.createdAt)}</span>
            {SourceIcon && (
              <span className="inline-flex items-center gap-0.5">
                · <SourceIcon className="size-3.5" aria-hidden />
                {sourceLabel[entry.source]}
              </span>
            )}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <span
            className={cn(
              "font-heading text-2xl font-extrabold leading-none tabular-nums",
              entry.quantity > 0 ? "text-primary" : "text-foreground",
              isReverted && "text-muted-foreground line-through",
            )}
          >
            {entry.quantity > 0 ? "+" : "−"}
            {amount}
          </span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>

        {entry.canRevert && (
          <Button
            variant="ghost"
            size="icon-touch"
            onClick={revert.onAsk}
            disabled={revert.isReverting || revert.isConfirming}
            aria-label={`Deshacer ${movementLabel[entry.type].toLowerCase()} de ${entry.product.name}`}
            className="shrink-0 text-muted-foreground"
          >
            <Undo2 aria-hidden />
          </Button>
        )}
      </div>

      {revert.isConfirming && (
        <div className="flex items-center justify-between gap-3 border-t border-dashed px-4 py-2.5">
          <span className="text-sm font-medium">¿Deshacer este movimiento?</span>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" onClick={revert.onCancel} className="h-9 rounded-full px-3 text-muted-foreground">
              Cancelar
            </Button>
            <Button size="sm" onClick={revert.onConfirm} className="h-9 rounded-full px-3">
              <Undo2 aria-hidden />
              Deshacer
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
