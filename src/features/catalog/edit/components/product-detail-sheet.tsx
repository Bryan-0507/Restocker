"use client";

import Link from "next/link";
import { Archive, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/features/shared/components/form-field";
import { formatQuantity } from "@/features/shared/utils/units";
import { AliasInput } from "../../shared/components/alias-input";
import { ProductSheet } from "../../shared/components/product-sheet";
import { QuantityStepper } from "../../shared/components/quantity-stepper";
import { UnitPicker } from "../../shared/components/unit-picker";
import type { CatalogProduct } from "../../shared/types/catalog-product";
import { useEditProductForm } from "../hooks/useEditProductForm";
import { ProductImageField } from "./product-image-field";

type Props = {
  product: CatalogProduct | null;
  onClose: () => void;
  onAddAlias: (productId: string, alias: string) => void;
  onRemoveAlias: (aliasId: string) => void;
  onDeactivate: (productId: string) => void;
  isDeactivating: boolean;
};

export function ProductDetailSheet({ product, onClose, ...actions }: Props) {
  return (
    <ProductSheet open={Boolean(product)} onClose={onClose} title={product?.name ?? "Producto"}>
      {/* key: al cambiar de producto, el formulario arranca de cero con sus datos. */}
      {product && <ProductDetailForm key={product.id} product={product} {...actions} />}
    </ProductSheet>
  );
}

function ProductDetailForm({
  product,
  onAddAlias,
  onRemoveAlias,
  onDeactivate,
  isDeactivating,
}: Omit<Props, "product" | "onClose"> & { product: CatalogProduct }) {
  const { form, onSubmit, isPending, hasChanges } = useEditProductForm(product);
  const { errors } = form.formState;
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);
  const unit = form.watch("unit");

  return (
    <div className="flex flex-col gap-6">
      <ProductImageField product={product} />

      <div className="flex items-center justify-between gap-3 rounded-card bg-card px-4 py-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Stock actual</span>
          <span className="font-heading text-xl font-bold">{formatQuantity(product.quantity, product.unit)}</span>
        </div>

        <Link href="/" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Ver inventario
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <FormField id="aliases" label="Cómo lo llaman" hint="Otros nombres con los que tu equipo se refiere a este producto.">
        <AliasInput
          id="aliases"
          chips={product.aliases.map((alias) => ({ id: alias.id, label: alias.alias }))}
          onAdd={(labels) => labels.forEach((label) => onAddAlias(product.id, label))}
          onRemove={(chip) => onRemoveAlias(chip.id)}
        />
      </FormField>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormField id="name" label="Nombre" error={errors.name?.message}>
          <Input
            id="name"
            className="h-12 bg-card dark:bg-card"
            aria-invalid={Boolean(errors.name)}
            {...form.register("name")}
          />
        </FormField>

        <FormField id="unit" label="Unidad" error={errors.unit?.message}>
          <Controller
            control={form.control}
            name="unit"
            render={({ field }) => <UnitPicker id="unit" value={field.value} onChange={(value) => field.onChange(value)} />}
          />
        </FormField>

        <FormField id="minimum" label="Mínimo" error={errors.minimum?.message} hint="Debajo de esta cantidad, aparece en “Hay que comprar”.">
          <Controller
            control={form.control}
            name="minimum"
            render={({ field }) => (
              <QuantityStepper
                id="minimum"
                value={field.value}
                onChange={(value) => field.onChange(value)}
                unitLabel={unit === "unidad" ? "unidades" : unit}
              />
            )}
          />
        </FormField>

        <FormField id="description" label="Descripción (opcional)" error={errors.description?.message}>
          <Input
            id="description"
            placeholder="Marca, presentación o dónde se guarda"
            className="h-12 bg-card dark:bg-card"
            {...form.register("description")}
          />
        </FormField>

        <Button type="submit" size="touch" disabled={!hasChanges || isPending} className="h-12 w-full">
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>

      <div className="flex flex-col gap-2 border-t pt-5">
        {/* La misma fila pasa a confirmar: sin caja extra ni fondo rojo, el rojo queda solo en la acción. */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5" aria-live="polite">
            <span className="text-sm font-medium">{confirmingDeactivate ? "¿Seguro?" : "Desactivar producto"}</span>
            <span className="text-xs text-muted-foreground">Sale del inventario; el historial se conserva.</span>
          </div>

          {confirmingDeactivate ? (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeactivating}
                onClick={() => setConfirmingDeactivate(false)}
                className="h-9 rounded-full px-3 text-muted-foreground"
              >
                Cancelar
              </Button>

              <Button
                size="sm"
                disabled={isDeactivating}
                onClick={() => onDeactivate(product.id)}
                className="h-9 rounded-full bg-destructive px-3 text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeactivating ? "Desactivando…" : "Desactivar"}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmingDeactivate(true)}
              className="h-9 shrink-0 rounded-full border-destructive/40 bg-transparent px-3 text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/50 dark:bg-transparent"
            >
              <Archive aria-hidden />
              Desactivar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
