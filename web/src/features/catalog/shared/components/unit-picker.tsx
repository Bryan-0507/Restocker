"use client";

import type { ProductUnit } from "@/features/shared/types/inventory";
import { cn } from "@/lib/utils";

// Siete unidades caben mejor como chips que en un Select: se ven todas y se eligen de un toque.
const UNITS: { value: ProductUnit; label: string }[] = [
  { value: "unidad", label: "Unidades" },
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "lb", label: "lb" },
  { value: "oz", label: "oz" },
  { value: "l", label: "l" },
  { value: "ml", label: "ml" },
];

export function UnitPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: ProductUnit | undefined;
  onChange: (unit: ProductUnit) => void;
}) {
  return (
    <div id={id} role="radiogroup" className="flex flex-wrap gap-2">
      {UNITS.map((unit) => {
        const selected = unit.value === value;
        return (
          <button
            key={unit.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(unit.value)}
            className={cn(
              "h-11 min-w-12 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card text-foreground hover:bg-muted",
            )}
          >
            {unit.label}
          </button>
        );
      })}
    </div>
  );
}
