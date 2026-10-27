"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/features/shared/query-keys";
import { confirmCaptureReview, discardCaptureReview, getCaptureReview } from "../../capture-api";
import type { ReviewDecision, ReviewItem, ReviewProduct } from "../types/review-data";
import { checkProposal, type ProposalCheck, type ProposalDraft } from "../utils/check-proposal";

export type ProposalView = {
  item: ReviewItem;
  draft: ProposalDraft;
  product: ReviewProduct | undefined;
  // Stock cuando le toque a esta propuesta: el actual más lo aceptado antes en la pila.
  before: number;
  check: ProposalCheck;
  decision: "aceptar" | "descartar" | undefined;
  edited: boolean;
};

const draftFromModel = (item: ReviewItem): ProposalDraft => ({
  productId: item.productId,
  type: item.type,
  quantity: item.quantity ?? undefined,
});

// Revisión de una captura (docs/decisiones-captura.md, Revisión): una propuesta a la vez, nada
// se registra hasta confirmar, y entonces todo va en una sola transacción.
export function useCaptureReview(captureId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const review = useQuery({
    queryKey: [...queryKeys.capture, "review", captureId],
    queryFn: () => getCaptureReview(captureId),
    staleTime: 60 * 1000,
  });

  const [drafts, setDrafts] = useState<Record<string, ProposalDraft>>({});
  const [decisions, setDecisions] = useState<Record<string, "aceptar" | "descartar">>({});
  // Orden de las decisiones, para "Atrás".
  const [history, setHistory] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

  const data = review.data;
  const productById = new Map((data?.products ?? []).map((product) => [product.id, product]));

  // Solo entran a la pila las propuestas con un producto del catálogo; las demás van al final
  // como aviso (Revisión, punto 5).
  const stackItems = (data?.items ?? []).filter((item) => item.productId !== null);
  const notInCatalog = (data?.items ?? []).filter((item) => item.productId === null);
  // Entradas que el modelo no usó dentro de una captura aceptada: "No se usó: motivo" (punto 2).
  const photoIds = (data?.inputs ?? []).filter((input) => input.type === "foto").map((input) => input.id);
  const unusedInputs = (data?.inputs ?? [])
    .filter((input) => !input.isRelevant && input.rejectionReason)
    .map((input) => ({
      id: input.id,
      reason: input.rejectionReason!,
      label:
        input.type === "foto"
          ? photoIds.length > 1
            ? `Foto ${photoIds.indexOf(input.id) + 1}`
            : "La foto"
          : input.type === "audio"
            ? "El audio"
            : "El texto",
    }));

  // Recorre la pila en orden aplicando lo aceptado, igual que confirm_capture.
  function project(overrides: Record<string, "aceptar" | "descartar"> = decisions): ProposalView[] {
    const stock = new Map((data?.products ?? []).map((product) => [product.id, product.quantity]));
    return stackItems.map((item) => {
      const draft = drafts[item.id] ?? draftFromModel(item);
      const product = draft.productId ? productById.get(draft.productId) : undefined;
      const before = product ? (stock.get(product.id) ?? 0) : 0;
      const check = checkProposal(draft, product, before);
      const decision = overrides[item.id];
      if (decision === "aceptar" && product && check.after !== null && !check.problem) stock.set(product.id, check.after);
      return { item, draft, product, before, check, decision, edited: item.id in drafts };
    });
  }

  const proposals = project();
  const pending = proposals.filter((proposal) => !proposal.decision);
  const current = pending[0] ?? null;
  const accepted = proposals.filter((proposal) => proposal.decision === "aceptar");
  const removed = proposals.filter((proposal) => proposal.decision === "descartar");
  const editing = proposals.find((proposal) => proposal.item.id === editingId) ?? null;

  // Stock de otro producto en el punto de la pila donde va esta propuesta (para la corrección).
  function stockBefore(itemId: string, productId: string) {
    let stock = productById.get(productId)?.quantity ?? 0;
    for (const proposal of proposals) {
      if (proposal.item.id === itemId) break;
      if (proposal.decision === "aceptar" && proposal.product?.id === productId && proposal.check.after !== null) {
        stock = proposal.check.after;
      }
    }
    return stock;
  }

  function decide(itemId: string, decision: "aceptar" | "descartar") {
    setDecisions((current) => ({ ...current, [itemId]: decision }));
    setHistory((current) => [...current, itemId]);
  }

  function accept(proposal: ProposalView) {
    if (proposal.check.problem) return;
    decide(proposal.item.id, "aceptar");
  }

  // Acepta en orden las que no tienen problema; las que sí, se quedan en la pila para resolverlas.
  function acceptRest() {
    const next = { ...decisions };
    const acceptedIds: string[] = [];
    for (const proposal of stackItems) {
      if (next[proposal.id]) continue;
      const view = project(next).find((candidate) => candidate.item.id === proposal.id)!;
      if (view.check.problem) continue;
      next[proposal.id] = "aceptar";
      acceptedIds.push(proposal.id);
    }
    setDecisions(next);
    setHistory((current) => [...current, ...acceptedIds]);
  }

  function undo() {
    const last = history.at(-1);
    if (!last) return;
    setHistory((current) => current.slice(0, -1));
    setDecisions((current) => {
      const next = { ...current };
      delete next[last];
      return next;
    });
  }

  // Guardar desde la hoja de corrección deja la propuesta aceptada con los cambios.
  function saveCorrection(itemId: string, draft: ProposalDraft) {
    setDrafts((current) => ({ ...current, [itemId]: draft }));
    decide(itemId, "aceptar");
    setEditingId(null);
  }

  function removeFromSheet(itemId: string) {
    decide(itemId, "descartar");
    setEditingId(null);
  }

  const afterClose = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.capture }),
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
      queryClient.invalidateQueries({ queryKey: queryKeys.history }),
      // Los alias aprendidos aparecen en el catálogo.
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog }),
    ]);
  };

  const confirmMutation = useMutation({
    mutationFn: () => {
      const payload: ReviewDecision[] = proposals.map((proposal) =>
        proposal.decision === "aceptar" && proposal.draft.productId && proposal.draft.type && proposal.draft.quantity !== undefined
          ? {
              itemId: proposal.item.id,
              action: "aceptar",
              productId: proposal.draft.productId,
              type: proposal.draft.type,
              quantity: proposal.draft.quantity,
            }
          : { itemId: proposal.item.id, action: "descartar" },
      );
      return confirmCaptureReview(data!, payload);
    },
    onSuccess: async (movements) => {
      await afterClose();
      // Al guardar se va a Inventario para ver el stock ya actualizado. El toast (con su enlace
      // al Historial) sigue visible tras la navegación. Descartar sí se queda en Capturar.
      if (movements > 0) router.push("/");
      toast.success(
        movements === 0
          ? "Revisión cerrada. No se guardó nada."
          : `${movements === 1 ? "1 cambio guardado" : `${movements} cambios guardados`} en tu inventario.`,
        { action: { label: "Ver historial", onClick: () => router.push("/historial") }, duration: 6000 },
      );
    },
    // Si el stock cambió mientras se revisaba, la función lo dice; se recarga para ver el actual.
    onError: (error) => {
      toast.error(error.message);
      void review.refetch();
    },
  });

  const discardMutation = useMutation({
    mutationFn: () => discardCaptureReview(data!),
    onSuccess: async () => {
      await afterClose();
      toast.success("Captura descartada. No se guardó nada.");
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    isLoading: review.isLoading,
    error: review.error,
    refetch: review.refetch,
    // Pila
    total: stackItems.length,
    position: stackItems.length - pending.length + 1,
    current,
    upcoming: pending.slice(1, 3),
    remaining: pending.length,
    isDone: Boolean(data) && pending.length === 0,
    accept,
    remove: (itemId: string) => decide(itemId, "descartar"),
    acceptRest,
    canAcceptRest: pending.length > 1,
    undo,
    canUndo: history.length > 0,
    // Corrección
    editing,
    openEdit: setEditingId,
    closeEdit: () => setEditingId(null),
    saveCorrection,
    removeFromSheet,
    products: data?.products ?? [],
    stockBefore,
    // Al final
    accepted,
    removed,
    notInCatalog,
    unusedInputs,
    confirm: () => confirmMutation.mutate(),
    isConfirming: confirmMutation.isPending,
    // Descartar todo, con confirmación en la misma línea.
    isConfirmingDiscard,
    askDiscard: () => setIsConfirmingDiscard(true),
    cancelDiscard: () => setIsConfirmingDiscard(false),
    discard: () => discardMutation.mutate(),
    isDiscarding: discardMutation.isPending,
  };
}
