"use client";

import { Camera, Keyboard, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/features/shared/components/page-header";
import { useHistoryList } from "../hooks/useHistoryList";
import type { Movement } from "../types/movement";

const sourceIcon = { foto: Camera, audio: Mic, texto: Keyboard } satisfies Record<Movement["source"], unknown>;

const typeVariant = {
  entrada: "ok",
  uso: "secondary",
  perdida: "out",
  ajuste: "outline",
} as const satisfies Record<Movement["type"], string>;

const typeLabel: Record<Movement["type"], string> = {
  entrada: "Entrada",
  uso: "Uso",
  perdida: "Pérdida",
  ajuste: "Ajuste",
};

export function HistoryList() {
  const { items } = useHistoryList();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Historial" />
    
      <ul className="flex flex-col gap-2">
        {items.map((movement) => {
          const SourceIcon = sourceIcon[movement.source];
          return (
            <li key={movement.id} className="flex items-center gap-3 rounded-card bg-card px-4 py-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <SourceIcon className="size-5" aria-label={`Desde ${movement.source}`} />
              </span>
        
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-heading text-lg font-bold leading-tight">{movement.productName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {movement.userName} · {movement.time}
                </span>
              </div>
        
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-medium">{movement.formattedQuantity}</span>
                <Badge variant={typeVariant[movement.type]}>{typeLabel[movement.type]}</Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
