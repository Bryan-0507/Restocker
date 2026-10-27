"use client";

import { CheckCheck, RotateCw, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/shared/components/page-header";
import { useCaptureReview } from "../hooks/useCaptureReview";
import { CorrectionSheet } from "./correction-sheet";
import { ProposalCard } from "./proposal-card";
import { DiscardConfirm, ReviewSummary } from "./review-summary";

// Corto para que quepa en una línea a 375 px.
const TITLE = "Revisa y guarda";

// Revisión de la captura pendiente: ocupa el lugar de la caja de captura hasta cerrarse. Trae
// su propio título para no apilar dos encabezados.
export function CaptureReview({ captureId }: { captureId: string }) {
  const review = useCaptureReview(captureId);

  if (review.isLoading) {
    return (
      <div className="flex flex-col gap-5" aria-busy>
        <PageHeader title={TITLE} />
        <Skeleton className="h-96 rounded-card" />
      </div>
    );
  }

  if (review.error) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title={TITLE} />
        <div role="alert" className="flex flex-col items-center gap-3 rounded-card bg-card px-6 py-10 text-center">
          <p className="font-medium">{review.error.message}</p>
          <Button variant="secondary" size="touch" onClick={() => review.refetch()}>
            <RotateCw aria-hidden />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={TITLE} />

      {!review.isDone && (
        <div className="-my-1 flex min-h-11 items-center justify-between gap-3">
          <span className="rounded-full bg-capture px-3 py-1 text-sm font-semibold text-capture-foreground tabular-nums" aria-live="polite">
            {review.position} de {review.total}
          </span>
          {review.canUndo && (
            <Button variant="ghost" size="touch" onClick={review.undo} className="-mr-3 text-muted-foreground">
              <Undo2 aria-hidden />
              Atrás
            </Button>
          )}
        </div>
      )}

      {review.current ? (
        // Las siguientes se asoman detrás: se ve cuánto falta sin una barra de progreso.
        <div className="relative isolate pb-4">
          {review.upcoming.map((proposal, index) => (
            <div
              key={proposal.item.id}
              aria-hidden
              // origin-bottom: la escala no se come el desplazamiento y el borde sí asoma.
              className="absolute inset-x-0 bottom-4 top-0 origin-bottom rounded-card bg-card shadow-sm"
              style={{
                transform: `translateY(${(index + 1) * 8}px) scale(${1 - (index + 1) * 0.04})`,
                opacity: 1 - (index + 1) * 0.3,
                zIndex: -1 - index,
              }}
            />
          ))}
          <ProposalCard
            key={review.current.item.id}
            proposal={review.current}
            onAccept={() => review.accept(review.current!)}
            onRemove={() => review.remove(review.current!.item.id)}
            onCorrect={() => review.openEdit(review.current!.item.id)}
          />
        </div>
      ) : (
        <ReviewSummary
          accepted={review.accepted}
          removedCount={review.removed.length}
          notInCatalog={review.notInCatalog}
          unusedInputs={review.unusedInputs}
          onConfirm={review.confirm}
          isConfirming={review.isConfirming}
          onUndo={review.undo}
          canUndo={review.canUndo}
          discardControls={review}
        />
      )}

      {/* Mientras hay pila: una barra pegada a ella, descartar a la izquierda (lejos de "Está
          bien") y el atajo de aceptar a la derecha. Al confirmar el descarte, la barra cambia. */}
      {!review.isDone &&
        (review.isConfirmingDiscard ? (
          <DiscardConfirm controls={review} className="mt-3" />
        ) : (
          // mt-3: separada de Quitar / Está bien para que se lea como acción de toda la captura.
          <div className="mt-3 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="touch"
              onClick={review.askDiscard}
              disabled={review.isConfirming}
              aria-label="Descartar toda la captura"
              className="-ml-3 px-4 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 aria-hidden />
              Descartar
            </Button>
            {review.canAcceptRest && (
              // Corto para que quepa junto a "Descartar" a 360 px; el contador ya dice cuántos.
              <Button
                variant="outline"
                size="touch"
                onClick={review.acceptRest}
                aria-label={`Aceptar los ${review.remaining} cambios restantes`}
                className="shrink-0 bg-card px-4 dark:bg-card"
              >
                <CheckCheck aria-hidden />
                Aceptar todos
              </Button>
            )}
          </div>
        ))}

      <CorrectionSheet
        proposal={review.editing}
        products={review.products}
        stockOf={(productId) => (review.editing ? review.stockBefore(review.editing.item.id, productId) : 0)}
        onSave={review.saveCorrection}
        onRemove={review.removeFromSheet}
        onClose={review.closeEdit}
      />
    </div>
  );
}
