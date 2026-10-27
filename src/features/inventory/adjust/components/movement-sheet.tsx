"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductSheet } from "@/features/shared/components/product-sheet";
import { ProductThumb } from "@/features/shared/components/product-thumb";
import { QuantityStepper } from "@/features/shared/components/quantity-stepper";
import { SegmentedControl } from "@/features/shared/components/segmented-control";
import { StockStatusBadge } from "@/features/shared/components/stock-status-badge";
import { MOVEMENT_TYPES } from "@/features/shared/utils/movement-types";
import { formatQuantity } from "@/features/shared/utils/units";
import { cn } from "@/lib/utils";
import type { InventoryProduct } from "../../shared/types/inventory-data";
import { useMovementForm } from "../hooks/useMovementForm";

export function MovementSheet({ product, onClose }: { product: InventoryProduct | null; onClose: () => void }) {
  return (
    <ProductSheet open={Boolean(product)} onClose={onClose} title={product?.name ?? "Producto"}>
      {/* key: cada producto arranca con el formulario limpio. */}
      {product && <MovementForm key={product.id} product={product} onDone={onClose} />}
    </ProductSheet>
  );
}

function MovementForm({ product, onDone }: { product: InventoryProduct; onDone: () => void }) {
  const form = useMovementForm({ product, onDone });
  const unitLabel = product.unit === "unidad" ? "unidades" : product.unit;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        form.onSubmit();
      }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-3 rounded-card bg-card p-3">
        <ProductThumb name={product.name} imageUrl={product.imageUrl} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs text-muted-foreground">Hay ahora</span>
          <span
            className={cn(
              "font-heading text-3xl font-extrabold leading-tight tabular-nums",
              product.status === "out" && "text-status-out-foreground",
              product.status === "low" && "text-status-low-foreground",
            )}
          >
            {formatQuantity(product.quantity, product.unit)}
          </span>
          <span className="text-xs text-muted-foreground">mín {formatQuantity(product.minimum, product.unit)}</span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 self-stretch justify-between">
          {product.needsRestock ? <StockStatusBadge status={product.status} /> : <span />}
          <Link
            href={`/historial?producto=${product.id}`}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Historial
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      <SegmentedControl label="Tipo de movimiento" options={MOVEMENT_TYPES} value={form.type} onChange={form.setType} />

      <div className="flex flex-col gap-2">
        <label htmlFor="movement-quantity" className="text-sm font-medium">
          {form.current.question}
        </label>
        <QuantityStepper
          id="movement-quantity"
          value={form.quantity}
          onChange={form.setQuantity}
          unitLabel={unitLabel}
          aria-invalid={Boolean(form.error)}
          className={cn(form.error && "border-destructive")}
        />

        {/* Una sola línea que cambia: el error si lo hay, si no cómo quedará el stock. */}
        <p aria-live="polite" className={cn("min-h-5 text-sm", form.error ? "text-destructive" : "text-muted-foreground")}>
          {form.error ??
            (form.resulting !== null && (
              <>
                {/* Antes → después, para ver el efecto del movimiento de un vistazo. */}
                {formatQuantity(product.quantity, product.unit)}
                <ArrowRight className="mx-1.5 inline size-4 align-[-3px]" aria-label="quedarán" />
                <span className="font-medium text-foreground">{formatQuantity(form.resulting, product.unit)}</span>
                {form.resulting < product.minimum && <span className="text-status-low-foreground"> · bajo el mínimo</span>}
              </>
            ))}
        </p>
      </div>

      <Button type="submit" size="touch" disabled={!form.canSubmit} className="h-12 w-full">
        {form.isPending ? "Guardando…" : form.current.action}
      </Button>
    </form>
  );
}
