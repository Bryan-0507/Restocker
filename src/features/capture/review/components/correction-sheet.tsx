"use client";

import { useState } from "react";
import { ArrowRight, Check, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductSheet } from "@/features/shared/components/product-sheet";
import { ProductThumb } from "@/features/shared/components/product-thumb";
import { QuantityStepper } from "@/features/shared/components/quantity-stepper";
import { SegmentedControl } from "@/features/shared/components/segmented-control";
import { MOVEMENT_TYPES } from "@/features/shared/utils/movement-types";
import { formatQuantity } from "@/features/shared/utils/units";
import { cn } from "@/lib/utils";
import type { ProposalView } from "../hooks/useCaptureReview";
import type { ReviewProduct } from "../types/review-data";
import { checkProposal, type ProposalDraft } from "../utils/check-proposal";

// Sin acentos ni mayúsculas, como la búsqueda del inventario.
const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

// Corregir una propuesta: el producto (cuando el modelo confundió uno con otro), el tipo, la
// cantidad, o quitarla. Es la misma hoja que se usa en Inventario.
export function CorrectionSheet({
  proposal,
  products,
  stockOf,
  onSave,
  onRemove,
  onClose,
}: {
  proposal: ProposalView | null;
  products: ReviewProduct[];
  // Stock con el que le toca a esta propuesta si se cambia a otro producto.
  stockOf: (productId: string) => number;
  onSave: (itemId: string, draft: ProposalDraft) => void;
  onRemove: (itemId: string) => void;
  onClose: () => void;
}) {
  return (
    <ProductSheet
      open={Boolean(proposal)}
      onClose={onClose}
      title="Corregir"
      description={proposal ? `“${proposal.item.rawText}”` : undefined}
    >
      {/* key: cada propuesta arranca con sus valores, no con los de la anterior. */}
      {proposal && (
        <CorrectionForm
          key={proposal.item.id}
          proposal={proposal}
          products={products}
          stockOf={stockOf}
          onSave={onSave}
          onRemove={onRemove}
        />
      )}
    </ProductSheet>
  );
}

function CorrectionForm({
  proposal,
  products,
  stockOf,
  onSave,
  onRemove,
}: {
  proposal: ProposalView;
  products: ReviewProduct[];
  stockOf: (productId: string) => number;
  onSave: (itemId: string, draft: ProposalDraft) => void;
  onRemove: (itemId: string) => void;
}) {
  const [draft, setDraft] = useState<ProposalDraft>({ ...proposal.draft, type: proposal.draft.type ?? "entrada" });
  const [isPicking, setIsPicking] = useState(!proposal.draft.productId);
  const [search, setSearch] = useState("");

  const product = products.find((candidate) => candidate.id === draft.productId);
  const before = product ? (product.id === proposal.product?.id ? proposal.before : stockOf(product.id)) : 0;
  const check = checkProposal(draft, product, before);
  const typeOption = MOVEMENT_TYPES.find((option) => option.value === draft.type);
  const unitLabel = product ? (product.unit === "unidad" ? "unidades" : product.unit) : undefined;

  const query = normalize(search);
  const matches = query ? products.filter((candidate) => normalize(candidate.name).includes(query)) : products;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <span className="text-sm font-medium">Producto</span>

        {!isPicking && product ? (
          <div className="flex items-center gap-3 rounded-card bg-card p-3">
            <ProductThumb name={product.name} imageUrl={product.imageUrl} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{product.name}</span>
              <span className="text-xs text-muted-foreground">Hay {formatQuantity(before, product.unit)}</span>
            </div>
            <Button variant="ghost" size="touch" onClick={() => setIsPicking(true)} className="text-primary">
              Cambiar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-card bg-card p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar en tu catálogo"
                aria-label="Buscar producto"
                autoFocus
                className="h-11 rounded-full bg-background pl-10 text-base dark:bg-background md:text-sm"
              />
            </div>
            <ul role="listbox" aria-label="Productos" className="flex max-h-64 flex-col overflow-y-auto">
              {matches.map((candidate) => {
                const selected = candidate.id === draft.productId;
                return (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setDraft((current) => ({ ...current, productId: candidate.id }));
                        setIsPicking(false);
                        setSearch("");
                      }}
                      className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-2xl px-2 py-1.5 text-left transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:outline-none"
                    >
                      <ProductThumb name={candidate.name} imageUrl={candidate.imageUrl} className="size-9 rounded-xl text-base" />
                      <span className="flex-1 truncate">{candidate.name}</span>
                      {selected && <Check className="size-4 text-primary" aria-hidden />}
                    </button>
                  </li>
                );
              })}
              {matches.length === 0 && (
                <li className="px-2 py-3 text-sm text-muted-foreground">No hay productos con “{search.trim()}”.</li>
              )}
            </ul>
          </div>
        )}
      </section>

      <SegmentedControl
        label="Tipo de movimiento"
        options={MOVEMENT_TYPES}
        value={draft.type ?? "entrada"}
        onChange={(type) => setDraft((current) => ({ ...current, type }))}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="correction-quantity" className="text-sm font-medium">
          {typeOption?.question ?? "¿Cuánto?"}
        </label>
        <QuantityStepper
          id="correction-quantity"
          value={draft.quantity}
          onChange={(quantity) => setDraft((current) => ({ ...current, quantity }))}
          unitLabel={unitLabel}
          aria-invalid={Boolean(check.problem && draft.quantity !== undefined)}
        />
        {proposal.item.quantityMentioned !== null && (
          <span className="text-xs text-muted-foreground">
            Se dijo: {Number(proposal.item.quantityMentioned.toFixed(3))} {proposal.item.unitMentioned ?? ""}
          </span>
        )}
        <p aria-live="polite" className={cn("min-h-5 text-sm", check.problem ? "text-destructive" : "text-muted-foreground")}>
          {check.problem ??
            (product && check.after !== null && (
              <>
                {formatQuantity(before, product.unit)}
                <ArrowRight className="mx-1.5 inline size-4 align-[-3px]" aria-label="quedarán" />
                <span className="font-medium text-foreground">{formatQuantity(check.after, product.unit)}</span>
              </>
            ))}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          size="touch"
          disabled={Boolean(check.problem)}
          onClick={() => onSave(proposal.item.id, draft)}
          className="h-12 w-full"
        >
          Guardar corrección
        </Button>
        <Button
          variant="ghost"
          size="touch"
          onClick={() => onRemove(proposal.item.id)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 aria-hidden />
          Quitar este cambio
        </Button>
      </div>
    </div>
  );
}
