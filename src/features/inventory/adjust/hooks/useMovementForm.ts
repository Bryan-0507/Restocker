"use client";

import { useState } from "react";
import type { MovementType } from "@/features/shared/types/inventory";
import { MOVEMENT_TYPES } from "@/features/shared/utils/movement-types";
import { formatQuantity } from "@/features/shared/utils/units";
import type { InventoryProduct } from "../../shared/types/inventory-data";
import { useManualMovement } from "./useManualMovement";

// Formulario de movimiento manual: tipo + cantidad, con el stock resultante a la vista antes de confirmar.
// Repite las reglas de register_manual_movement para avisar antes de mandar, no en el toast.
export function useMovementForm({ product, onDone }: { product: InventoryProduct; onDone: () => void }) {
  const [type, setType] = useState<MovementType>("entrada");
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const { registerMovement, isPending } = useManualMovement({ onDone });

  const amount = quantity ?? 0;
  const resulting =
    type === "entrada" ? product.quantity + amount : type === "ajuste" ? amount : product.quantity - amount;

  let error: string | null = null;
  if (quantity !== undefined) {
    if (type !== "ajuste" && amount <= 0) error = "La cantidad debe ser mayor a cero.";
    else if (resulting < 0) error = `Solo hay ${formatQuantity(product.quantity, product.unit)}.`;
    else if (type === "ajuste" && amount === product.quantity) error = "Es lo mismo que ya hay; no hay nada que ajustar.";
  }

  const canSubmit = quantity !== undefined && !error && !isPending;

  return {
    type,
    // Cambiar de tipo conserva la cantidad: suele ser el mismo número mal clasificado.
    setType,
    quantity,
    setQuantity,
    current: MOVEMENT_TYPES.find((option) => option.value === type)!,
    resulting: quantity === undefined || error ? null : resulting,
    error,
    canSubmit,
    isPending,
    onSubmit: () => {
      if (canSubmit) registerMovement({ productId: product.id, type, quantity: amount });
    },
  };
}
