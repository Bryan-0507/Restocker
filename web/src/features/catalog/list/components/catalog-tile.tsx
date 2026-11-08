import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatQuantity } from "@/features/shared/utils/units";
import { cn } from "@/lib/utils";
import { ProductThumb } from "@/features/shared/components/product-thumb";
import { AliasStrip } from "./alias-strip";
import type { CatalogProduct } from "../../shared/types/catalog-product";

// Ficha del mosaico: foto (o inicial) arriba y los datos abajo.
export function CatalogTile({
  product,
  onOpen,
  onReactivate,
  isReactivating,
}: {
  product: CatalogProduct;
  onOpen: () => void;
  onReactivate: () => void;
  isReactivating: boolean;
}) {
  const content = (
    <>
      <div className="relative overflow-hidden rounded-2xl">
        <ProductThumb
          name={product.name}
          imageUrl={product.imageUrl}
          className={cn(
            "aspect-[4/3] size-auto w-full rounded-2xl text-4xl transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none",
            !product.isActive && "opacity-50",
          )}
        />

        {!product.isActive && (
          <Badge variant="outline" className="absolute left-2 top-2 bg-card">
            Desactivado
          </Badge>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1 px-1">
        {/* Siempre reserva dos líneas: así mínimo y alias quedan alineados entre fichas de la misma fila. */}
        <span className="line-clamp-2 min-h-[2lh] font-heading text-lg font-bold leading-tight">{product.name}</span>

        {/* El mínimo ya dice la unidad; repetirla aparte ocupaba dos líneas en mobile. */}
        <span className="truncate text-xs text-muted-foreground tabular-nums">
          Mín. {formatQuantity(product.minimum, product.unit)}
        </span>

        {product.aliases.length > 0 && <AliasStrip aliases={product.aliases} />}
      </div>
    </>
  );

  if (!product.isActive) {
    return (
      <li className="flex flex-col gap-3 rounded-card bg-card p-3">
        {content}

        <Button variant="secondary" size="sm" disabled={isReactivating} onClick={onReactivate} className="mt-auto w-full">
          Reactivar
        </Button>
      </li>
    );
  }

  return (
    <li className="flex">
      {/* Hover con anillo y sombra: un cambio de fondo se confundía con el menta de la página. */}
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full cursor-pointer flex-col gap-3 rounded-card bg-card p-3 text-left ring-primary/60 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-2 focus-visible:ring-2 focus-visible:outline-none active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        {content}
      </button>
    </li>
  );
}
