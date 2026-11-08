import type { ProductUnit } from "@/features/shared/types/inventory";

export const UNIT_OPTIONS: { value: ProductUnit; label: string }[] = [
  { value: "unidad", label: "Unidades" },
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "g", label: "Gramos (g)" },
  { value: "lb", label: "Libras (lb)" },
  { value: "oz", label: "Onzas (oz)" },
  { value: "l", label: "Litros (l)" },
  { value: "ml", label: "Mililitros (ml)" },
];

// "5 kg", "1 unidad", "3 unidades".
export function formatQuantity(quantity: number, unit: ProductUnit) {
  const value = Number(quantity.toFixed(3));
  if (unit === "unidad") return `${value} ${value === 1 ? "unidad" : "unidades"}`;
  return `${value} ${unit}`;
}
