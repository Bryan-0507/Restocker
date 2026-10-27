import { ArrowDownToLine, ArrowUpFromLine, PackageX, Scale, type LucideIcon } from "lucide-react";
import type { MovementType, ProductUnit } from "@/features/shared/types/inventory";

// Mismos íconos que el Historial, para que un tipo se reconozca igual en toda la app.
export const TYPE_ICON: Record<MovementType, LucideIcon> = {
  entrada: ArrowDownToLine,
  uso: ArrowUpFromLine,
  perdida: PackageX,
  ajuste: Scale,
};

// La unidad va aparte del número para escribirla una sola vez y en pequeño.
export function unitLabel(quantity: number, unit: ProductUnit) {
  if (unit === "unidad") return Number(quantity.toFixed(3)) === 1 ? "unidad" : "unidades";
  return unit;
}

const amount = (quantity: number) => String(Number(quantity.toFixed(3)));

// El cambio en grande: "+2", "−250" o, en un ajuste, el total contado. El color no cambia con el
// tipo: un uso normal no es una alerta. El color queda para lo que impide registrar.
export function describeChange(type: MovementType | null, quantity: number | undefined) {
  if (quantity === undefined || !type) return null;
  if (type === "ajuste") return amount(quantity);
  return `${type === "entrada" ? "+" : "−"}${amount(quantity)}`;
}
