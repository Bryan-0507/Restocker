"use client";

import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthCard } from "@/features/auth/shared/components/auth-card";
import { FormField } from "@/features/shared/components/form-field";
import { SelectScrollHint } from "@/features/shared/components/select-scroll-hint";
import { BUSINESS_CATEGORY_OPTIONS } from "@/features/shared/utils/business-categories";
import { useCreateBusiness } from "../hooks/useCreateBusiness";

export function BusinessForm() {
  const { form, isOther, onSubmit, isPending } = useCreateBusiness();
  const { errors } = form.formState;

  return (
    <AuthCard title="Tu negocio" description="Con esto armamos tu espacio. Después agregas tus productos.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormField id="name" label="Nombre del negocio" error={errors.name?.message}>
          <Input
            id="name"
            placeholder="Sakura"
            className="h-12 bg-card dark:bg-card"
            aria-invalid={Boolean(errors.name)}
            {...form.register("name")}
          />
        </FormField>

        <FormField id="category" label="Giro" error={errors.category?.message}>
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <Select items={BUSINESS_CATEGORY_OPTIONS} value={field.value ?? null} onValueChange={field.onChange}>
                <SelectTrigger
                  id="category"
                  className="w-full cursor-pointer bg-card text-base data-[size=default]:h-12 dark:bg-card md:text-sm"
                  aria-invalid={Boolean(errors.category)}
                >
                  <SelectValue placeholder="Elige una opción" />
                </SelectTrigger>

                {/* Se abre debajo del campo y muestra unas 3 opciones; el resto con scroll. */}
                <SelectContent alignItemWithTrigger={false} sideOffset={6} className="max-h-[9.5rem] p-1 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
                  {BUSINESS_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="min-h-11 cursor-pointer text-base md:text-sm"
                    >
                      {option.label}
                    </SelectItem>
                  ))}

                  <SelectScrollHint />
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        {isOther && (
          <FormField id="categoryOther" label="¿A qué se dedica?" error={errors.categoryOther?.message}>
            <Input
              id="categoryOther"
              placeholder="Venta de repuestos"
              className="h-12 bg-card dark:bg-card"
              aria-invalid={Boolean(errors.categoryOther)}
              {...form.register("categoryOther")}
            />
          </FormField>
        )}

        <Button type="submit" size="touch" disabled={isPending} className="mt-2 h-12 w-full">
          {isPending ? "Creando…" : "Crear negocio"}
        </Button>
      </form>
    </AuthCard>
  );
}
