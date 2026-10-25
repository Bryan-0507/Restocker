"use client";

import { Minus, Plus } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Campo numérico con − y + a los lados, para ajustar el mínimo o la cantidad con el pulgar.
export function QuantityStepper({
  value,
  onChange,
  unitLabel,
  className,
  ...inputProps
}: Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  unitLabel?: string;
}) {
  const current = value ?? 0;

  return (
    <div className={cn("flex h-12 items-center rounded-lg border border-input bg-card", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon-touch"
        onClick={() => onChange(Math.max(0, current - 1))}
        aria-label="Restar uno"
        className="shrink-0"
      >
        <Minus aria-hidden />
      </Button>

      {/* min-w-0: el centro cede espacio para que − y + nunca se salgan del borde. */}
      <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1">
        <input
          {...inputProps}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={value ?? ""}
          placeholder="0"
          onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
          className="field-sizing-content min-w-[2ch] max-w-24 bg-transparent text-center text-base font-medium outline-none placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        {unitLabel && <span className="shrink-0 text-sm text-muted-foreground">{unitLabel}</span>}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-touch"
        onClick={() => onChange(current + 1)}
        aria-label="Sumar uno"
        className="shrink-0"
      >
        <Plus aria-hidden />
      </Button>
    </div>
  );
}
