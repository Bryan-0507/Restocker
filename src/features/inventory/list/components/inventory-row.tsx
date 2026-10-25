import { ProductThumb } from "@/features/shared/components/product-thumb";
import { formatQuantity } from "@/features/shared/utils/units";
import { cn } from "@/lib/utils";
import type { InventoryProduct } from "../../shared/types/inventory-data";

const statusLabel = { ok: "Al día", low: "Stock bajo", out: "Agotado" } as const;

// Franja y número en el color del estado; el estado también va en texto para lectores de pantalla.
const tone = {
  ok: { stripe: "", number: "text-foreground" },
  low: { stripe: "shadow-[inset_4px_0_0_var(--color-status-low-foreground)]", number: "text-status-low-foreground" },
  out: { stripe: "shadow-[inset_4px_0_0_var(--color-status-out-foreground)]", number: "text-status-out-foreground" },
};

const unitLabel = (product: InventoryProduct) =>
  product.unit === "unidad" ? (product.quantity === 1 ? "unidad" : "unidades") : product.unit;

export function InventoryRow({ product, onOpen }: { product: InventoryProduct; onOpen: () => void }) {
  const styles = tone[product.status];

  return (
    <li className="flex">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-card bg-card py-3 pl-4 pr-5 text-left ring-primary/60 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:ring-2 focus-visible:ring-2 focus-visible:outline-none active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
          styles.stripe,
        )}
      >
        <ProductThumb name={product.name} imageUrl={product.imageUrl} />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-heading text-lg font-bold leading-tight">{product.name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            <span className="sr-only">{statusLabel[product.status]}. </span>
            mín {formatQuantity(product.minimum, product.unit)}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <span className={cn("font-heading text-3xl font-extrabold leading-none tabular-nums", styles.number)}>
            {Number(product.quantity.toFixed(3))}
          </span>
          <span className="text-xs text-muted-foreground">{unitLabel(product)}</span>
        </div>
      </button>
    </li>
  );
}
