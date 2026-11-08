import type { MovementType } from "@/features/shared/types/inventory";
import { movementDelta } from "@/features/shared/utils/movement-types";
import { formatQuantity } from "@/features/shared/utils/units";
import type { ReviewProduct } from "../types/review-data";

// Cómo quedaría una propuesta: producto, tipo y cantidad, posiblemente corregidos.
export type ProposalDraft = { productId: string | null; type: MovementType | null; quantity: number | undefined };

export type ProposalCheck = { after: number | null; delta: number | null; problem: string | null };

// Mismas reglas que confirm_capture, para avisar en la tarjeta y no en un error al final.
// before es el stock que habrá cuando le toque a esta propuesta (las anteriores ya aplicadas).
export function checkProposal(draft: ProposalDraft, product: ReviewProduct | undefined, before: number): ProposalCheck {
  if (!product) return { after: null, delta: null, problem: "Elige a qué producto corresponde." };
  if (!draft.type) return { after: null, delta: null, problem: "Elige el tipo de movimiento." };
  if (draft.quantity === undefined) return { after: null, delta: null, problem: "Falta la cantidad." };

  if (draft.quantity < 0 || (draft.type !== "ajuste" && draft.quantity === 0)) {
    return { after: null, delta: null, problem: "La cantidad debe ser mayor a cero." };
  }

  const delta = movementDelta(draft.type, draft.quantity, before);
  const after = before + delta;

  if (draft.type === "ajuste" && delta === 0) {
    return { after, delta, problem: "Es lo mismo que ya hay; no hay nada que ajustar." };
  }
  if (after < 0) {
    return { after, delta, problem: `Solo hay ${formatQuantity(before, product.unit)}.` };
  }

  return { after, delta, problem: null };
}
