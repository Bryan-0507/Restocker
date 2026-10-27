"use client";

import Link from "next/link";
import { ArrowRight, PackageX, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/features/shared/components/product-thumb";
import type { ProposalView } from "../hooks/useCaptureReview";
import type { ReviewItem } from "../types/review-data";
import { describeChange, TYPE_ICON, unitLabel } from "../utils/describe-change";

const amount = (quantity: number) => String(Number(quantity.toFixed(3)));

type DiscardControls = {
  isConfirmingDiscard: boolean;
  isDiscarding: boolean;
  askDiscard: () => void;
  cancelDiscard: () => void;
  discard: () => void;
};

// Confirmación de "Descartar todo" en la misma línea (pila y resumen).
export function DiscardConfirm({ controls, className }: { controls: DiscardControls; className?: string }) {
  return (
    <div
      role="group"
      aria-label="Confirmar descarte"
      className={`flex flex-wrap items-center gap-2 rounded-card bg-destructive/10 p-2 pl-4 animate-in fade-in duration-200 motion-reduce:animate-none ${className ?? ""}`}
    >
      <span className="min-w-0 flex-1 basis-full text-sm font-medium text-destructive sm:basis-auto">
        ¿Descartar todo? No se guarda nada.
      </span>
      <div className="flex flex-1 justify-end gap-2 sm:flex-none">
        <Button variant="ghost" size="touch" onClick={controls.cancelDiscard} disabled={controls.isDiscarding}>
          Cancelar
        </Button>
        <Button
          size="touch"
          onClick={controls.discard}
          disabled={controls.isDiscarding}
          className="bg-destructive text-white hover:bg-destructive/90"
        >
          {controls.isDiscarding ? "Descartando…" : "Descartar"}
        </Button>
      </div>
    </div>
  );
}

// Al terminar la pila, todo en una sola tarjeta y en orden de lectura: lo que se guarda, lo que
// no, y las acciones al final. Nada se guarda antes de "Guardar" (confirm_capture).
export function ReviewSummary({
  accepted,
  removedCount,
  notInCatalog,
  unusedInputs,
  onConfirm,
  isConfirming,
  onUndo,
  canUndo,
  discardControls,
}: {
  accepted: ProposalView[];
  removedCount: number;
  notInCatalog: ReviewItem[];
  unusedInputs: { id: string; label: string; reason: string }[];
  onConfirm: () => void;
  isConfirming: boolean;
  onUndo: () => void;
  canUndo: boolean;
  discardControls: DiscardControls;
}) {
  const count = accepted.length;
  const removedNote =
    removedCount > 0 ? (removedCount === 1 ? "1 cambio quitado." : `${removedCount} cambios quitados.`) : null;
  const plural = notInCatalog.length > 1;

  return (
    <section
      aria-label="Resumen"
      className="flex flex-col gap-5 rounded-card bg-card p-5 shadow-lg animate-in fade-in duration-300 motion-reduce:animate-none"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-2xl font-bold leading-tight">
          {count > 0 ? "Esto se va a guardar" : "No queda nada por guardar"}
        </h2>
        {(count === 0 || removedNote) && (
          <p className="text-sm text-muted-foreground">
            {count === 0 ? "Quitaste todos los cambios. Cierra la revisión para volver a capturar." : removedNote}
          </p>
        )}
      </div>

      {count > 0 && (
        <ul className="flex flex-col divide-y">
          {accepted.map(({ item, draft, product, check }) => {
            const TypeIcon = draft.type ? TYPE_ICON[draft.type] : null;
            return (
              <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <ProductThumb name={product?.name ?? "?"} imageUrl={product?.imageUrl ?? null} className="size-10 rounded-xl text-base" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{product?.name}</span>
                  {product && check.after !== null && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {TypeIcon && <TypeIcon className="size-3.5" aria-hidden />}
                      Quedarán {amount(check.after)}
                    </span>
                  )}
                </div>
                <span className="shrink-0 font-heading text-lg font-bold tabular-nums">
                  {describeChange(draft.type, draft.quantity)}{" "}
                  <span className="text-sm font-semibold text-muted-foreground">
                    {product && draft.quantity !== undefined ? unitLabel(draft.quantity, product.unit) : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Lo que no se guarda va antes del botón: se lee antes de decidir, más chico y en gris. */}
      {(notInCatalog.length > 0 || unusedInputs.length > 0) && (
        <div className="flex gap-3 rounded-2xl bg-muted/60 p-3 text-sm">
          <PackageX className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="flex min-w-0 flex-col gap-2">
            {notInCatalog.length > 0 && (
              <div className="flex flex-col gap-1">
                <p>
                  No se guarda:{" "}
                  {notInCatalog.map((item, index) => (
                    <span key={item.id}>
                      {index > 0 && (index === notInCatalog.length - 1 ? " y " : ", ")}
                      <span className="font-semibold">{item.mention ?? item.suggestedName ?? item.rawText}</span>
                    </span>
                  ))}
                  , que {plural ? "no están" : "no está"} en tu catálogo.
                </p>
                <Link href="/catalogo" className="flex items-center gap-1 self-start font-medium text-primary hover:underline">
                  Agregar al catálogo
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            )}
            {unusedInputs.map((input) => (
              <p key={input.id} className="text-muted-foreground">
                <span className="font-medium text-foreground">{input.label} no se usó.</span> {input.reason}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Button size="touch" onClick={onConfirm} disabled={isConfirming} className="h-12 w-full">
          {isConfirming
            ? "Guardando…"
            : count === 0
              ? "Cerrar revisión"
              : count === 1
                ? "Guardar 1 cambio"
                : `Guardar ${count} cambios`}
        </Button>

        {discardControls.isConfirmingDiscard ? (
          <DiscardConfirm controls={discardControls} className="mt-2" />
        ) : (
          // Secundarias en una fila y en gris: no compiten con Guardar.
          <div className="flex items-center justify-between gap-2">
            {canUndo ? (
              <Button variant="ghost" size="touch" onClick={onUndo} disabled={isConfirming} className="-ml-3 px-3 text-muted-foreground">
                <Undo2 aria-hidden />
                Volver al último
              </Button>
            ) : (
              <span />
            )}
            <Button
              variant="ghost"
              size="touch"
              onClick={discardControls.askDiscard}
              disabled={isConfirming}
              aria-label="Descartar toda la captura"
              className="-mr-3 px-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 aria-hidden />
              Descartar todo
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
