"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { CatalogProduct, UpdateProductChanges } from "../../shared/types/catalog-product";
import { productFieldsSchema, type ProductFieldsValues } from "../../shared/types/product-form-schema";
import { useUpdateProduct } from "./useUpdateProduct";

function valuesFrom(product: CatalogProduct): ProductFieldsValues {
  return {
    name: product.name,
    unit: product.unit,
    minimum: product.minimum,
    description: product.description ?? "",
  };
}

// Formulario de "Editar producto": arranca con los datos actuales y manda solo lo que cambió.
export function useEditProductForm(product: CatalogProduct) {
  const form = useForm<ProductFieldsValues>({
    resolver: zodResolver(productFieldsSchema),
    values: valuesFrom(product),
  });

  const { updateProduct, isPending } = useUpdateProduct();

  const onSubmit = form.handleSubmit((values) => {
    const { dirtyFields } = form.formState;
    const changes: UpdateProductChanges = {};

    if (dirtyFields.name) changes.name = values.name;
    if (dirtyFields.unit) changes.unit = values.unit;
    if (dirtyFields.minimum) changes.minimum = values.minimum;
    if (dirtyFields.description) changes.description = values.description || null;

    if (Object.keys(changes).length > 0) updateProduct(product.id, changes);
  });

  return {
    form,
    onSubmit,
    isPending,
    hasChanges: form.formState.isDirty,
  };
}
