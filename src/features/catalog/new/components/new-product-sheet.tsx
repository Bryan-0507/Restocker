"use client";

import { ChevronDown } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/features/shared/components/form-field";
import { cn } from "@/lib/utils";
import { AliasInput } from "../../shared/components/alias-input";
import { ProductSheet } from "@/features/shared/components/product-sheet";
import { QuantityStepper } from "@/features/shared/components/quantity-stepper";
import { UnitPicker } from "../../shared/components/unit-picker";
import { useNewProductForm } from "../hooks/useNewProductForm";
import { NewProductImageField } from "./new-product-image-field";

export function NewProductSheet({
  open,
  onClose,
  initialName,
}: {
  open: boolean;
  onClose: () => void;
  // Para "¿Crearlo como producto nuevo?" desde una búsqueda sin resultados.
  initialName?: string;
}) {
  return (
    <ProductSheet open={open} onClose={onClose} title="Nuevo producto" description="Lo básico ahora; lo demás cuando quieras.">
      {open && <NewProductForm onClose={onClose} initialName={initialName} />}
    </ProductSheet>
  );
}

function NewProductForm({ onClose, initialName }: { onClose: () => void; initialName?: string }) {
  const { form, showMore, toggleShowMore, image, onSubmit, isPending } = useNewProductForm({ onCreated: onClose, initialName });
  const { errors } = form.formState;
  const [unit, name] = useWatch({ control: form.control, name: ["unit", "name"] });
  const unitLabel = unit === "unidad" ? "unidades" : unit;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <NewProductImageField
        name={name}
        previewUrl={image.previewUrl}
        accept={image.accept}
        onSelect={image.select}
        onClear={image.clear}
      />

      <FormField id="new-name" label="Nombre" error={errors.name?.message}>
        <Input
          id="new-name"
          autoFocus
          placeholder="Harina de arroz"
          className="h-12 bg-card dark:bg-card"
          aria-invalid={Boolean(errors.name)}
          {...form.register("name")}
        />
      </FormField>

      <FormField id="new-unit" label="¿En qué lo cuentas?" error={errors.unit?.message}>
        <Controller
          control={form.control}
          name="unit"
          render={({ field }) => <UnitPicker id="new-unit" value={field.value} onChange={(value) => field.onChange(value)} />}
        />
      </FormField>

      {/* Apilados: el panel mide como mucho 448px y a dos columnas el stepper no cabe. */}
      <div className="flex flex-col gap-5">
        <FormField id="new-initial" label="¿Cuánto tienes hoy?" error={errors.initialQuantity?.message} hint="Opcional.">
          <Controller
            control={form.control}
            name="initialQuantity"
            render={({ field }) => (
              <QuantityStepper id="new-initial" value={field.value} onChange={(value) => field.onChange(value)} unitLabel={unitLabel} />
            )}
          />
        </FormField>

        <FormField id="new-minimum" label="Mínimo" error={errors.minimum?.message} hint="Para avisarte cuándo comprar.">
          <Controller
            control={form.control}
            name="minimum"
            render={({ field }) => (
              <QuantityStepper id="new-minimum" value={field.value} onChange={(value) => field.onChange(value)} unitLabel={unitLabel} />
            )}
          />
        </FormField>
      </div>

      <button
        type="button"
        onClick={toggleShowMore}
        aria-expanded={showMore}
        className="flex h-11 cursor-pointer items-center gap-1 self-start text-sm font-medium text-primary"
      >
        Más detalles
        <ChevronDown className={cn("size-4 transition-transform", showMore && "rotate-180")} aria-hidden />
      </button>

      {showMore && (
        <div className="flex flex-col gap-5">
          <FormField id="new-aliases" label="Cómo lo llaman" hint="Ayuda a reconocerlo en las capturas.">
            <Controller
              control={form.control}
              name="aliases"
              render={({ field }) => (
                <AliasInput
                  id="new-aliases"
                  chips={field.value.map((label) => ({ id: label, label }))}
                  onAdd={(labels) => field.onChange([...field.value, ...labels])}
                  onRemove={(chip) => field.onChange(field.value.filter((label) => label !== chip.label))}
                />
              )}
            />
          </FormField>

          <FormField id="new-description" label="Descripción" error={errors.description?.message}>
            <Input
              id="new-description"
              placeholder="Marca, presentación o dónde se guarda"
              className="h-12 bg-card dark:bg-card"
              {...form.register("description")}
            />
          </FormField>
        </div>
      )}

      <Button type="submit" size="touch" disabled={isPending} className="h-12 w-full">
        {isPending ? "Agregando…" : "Agregar producto"}
      </Button>
    </form>
  );
}
