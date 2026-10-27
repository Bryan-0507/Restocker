"use client";

import { CircleAlert, Camera, Info, Keyboard, Mic, PencilLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/features/shared/components/product-thumb";
import { MOVEMENT_TYPES } from "@/features/shared/utils/movement-types";
import type { ProposalView } from "../hooks/useCaptureReview";
import type { ReviewInputType } from "../types/review-data";
import { describeChange, TYPE_ICON, unitLabel } from "../utils/describe-change";

const SOURCE_ICON: Record<ReviewInputType, typeof Camera> = { foto: Camera, audio: Mic, texto: Keyboard };
const SOURCE_LABEL: Record<ReviewInputType, string> = { foto: "En la foto", audio: "En el audio", texto: "Escribiste" };

const amount = (quantity: number) => String(Number(quantity.toFixed(3)));

// Un cambio a la vez (Revisión, opción A): el número en grande, cómo queda el stock y, en
// pequeño, lo que se dijo. Abajo la decisión (Quitar / Está bien); Corregir va arriba, junto
// a lo que corrige. Si algo impide guardarlo, Corregir pasa a ser el botón principal de abajo.
export function ProposalCard({
  proposal,
  onAccept,
  onRemove,
  onCorrect,
}: {
  proposal: ProposalView;
  onAccept: () => void;
  onRemove: () => void;
  onCorrect: () => void;
}) {
  const { item, draft, product, before, check } = proposal;
  const change = describeChange(draft.type, draft.quantity);
  const typeLabel = MOVEMENT_TYPES.find((option) => option.value === draft.type)?.label;
  const TypeIcon = draft.type ? TYPE_ICON[draft.type] : null;
  const SourceIcon = SOURCE_ICON[item.inputType];

  return (
    <article
      aria-label={`Cambio: ${product?.name ?? "sin producto"}`}
      className="relative flex flex-col gap-5 rounded-card bg-card p-5 shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-300 motion-reduce:animate-none"
    >
      <header className="flex items-center gap-3">
        <ProductThumb name={product?.name ?? "?"} imageUrl={product?.imageUrl ?? null} className="size-14" />
        <h2 className="line-clamp-2 min-w-0 flex-1 font-heading text-2xl font-bold leading-tight">{product?.name ?? "Sin producto"}</h2>
        {!check.problem && (
          <Button variant="ghost" size="touch" onClick={onCorrect} className="-mr-3 shrink-0 px-3 text-primary">
            <PencilLine aria-hidden />
            Corregir
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-2">
        {/* El tipo va neutro, encima del número: dice qué pasó sin pintarlo de alerta. */}
        {typeLabel && TypeIcon && (
          <span className="flex items-center gap-1.5 self-start rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            <TypeIcon className="size-4" aria-hidden />
            {draft.type === "ajuste" ? "Ajuste · contaste" : typeLabel}
          </span>
        )}
        <p className="flex items-baseline gap-1.5 font-heading leading-none">
          <span className="text-6xl font-extrabold tabular-nums">{change ?? "¿?"}</span>
          {change && product && (
            <span className="text-xl font-semibold text-muted-foreground">{unitLabel(draft.quantity!, product.unit)}</span>
          )}
        </p>

        {/* Cómo queda el stock, o lo que impide guardar (con ícono: el color no va solo). */}
        <p aria-live="polite" className="mt-1 text-base">
          {check.problem ? (
            <span className="flex items-center gap-1.5 font-medium text-destructive">
              <CircleAlert className="size-4 shrink-0" aria-hidden />
              {check.problem}
            </span>
          ) : (
            product &&
            check.after !== null && (
              <span className="text-muted-foreground">
                Quedarán <span className="font-semibold text-foreground">{amount(check.after)}</span> · hay {amount(before)}
                {check.after < product.minimum && <span className="text-status-low-foreground"> · bajo el mínimo</span>}
              </span>
            )
          )}
        </p>
      </div>

      <div className="flex flex-col gap-1 border-l-2 border-border pl-3 text-sm">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SourceIcon className="size-3.5" aria-hidden />
          {SOURCE_LABEL[item.inputType]}
        </span>
        <q className="text-foreground">{item.rawText}</q>
        {item.note && (
          <span className="mt-1 flex gap-1.5 text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {item.note}
          </span>
        )}
      </div>

      {/* Quitar no pide confirmación: "Atrás" lo deshace. */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="touch" onClick={onRemove} className="h-12 bg-card dark:bg-card">
          <X aria-hidden />
          Quitar
        </Button>
        {check.problem ? (
          <Button size="touch" onClick={onCorrect} className="h-12">
            <PencilLine aria-hidden />
            Corregir
          </Button>
        ) : (
          <Button size="touch" onClick={onAccept} className="h-12">
            Está bien
          </Button>
        )}
      </div>
    </article>
  );
}
