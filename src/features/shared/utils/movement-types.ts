import type { MovementType } from "@/features/shared/types/inventory";

// Tipos de movimiento con su texto en la UI (movimiento manual en Inventario y revisión en Capturar).
export const MOVEMENT_TYPES: { value: MovementType; label: string; question: string; action: string }[] = [
  { value: "entrada", label: "Entrada", question: "¿Cuánto entró?", action: "Registrar entrada" },
  { value: "uso", label: "Uso", question: "¿Cuánto se usó?", action: "Registrar uso" },
  { value: "perdida", label: "Pérdida", question: "¿Cuánto se perdió?", action: "Registrar pérdida" },
  { value: "ajuste", label: "Ajuste", question: "¿Cuánto hay contado?", action: "Ajustar stock" },
];

// Cuánto cambia el stock con un movimiento. quantity siempre es positiva; en ajuste es el total
// contado. Mismas reglas que register_manual_movement y confirm_capture.
export function movementDelta(type: MovementType, quantity: number, current: number) {
  if (type === "entrada") return quantity;
  if (type === "ajuste") return quantity - current;
  return -quantity;
}
