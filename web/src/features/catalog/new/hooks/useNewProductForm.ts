"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PRODUCT_IMAGE_ACCEPT } from "@/features/shared/utils/product-images";
import { newProductSchema, type NewProductValues } from "../../shared/types/product-form-schema";
import { useCreateProduct } from "./useCreateProduct";

const emptyValues: NewProductValues = {
  name: "",
  unit: "unidad",
  minimum: 0,
  description: "",
  initialQuantity: undefined,
  aliases: [],
};

// Formulario de "Nuevo producto". Lo básico va a la vista; alias y descripción en "Más detalles".
// La foto es opcional: se guarda aquí y se sube al crear el producto.
export function useNewProductForm({ onCreated, initialName = "" }: { onCreated: () => void; initialName?: string }) {
  const [showMore, setShowMore] = useState(false);
  const [image, setImage] = useState<{ file: File; previewUrl: string } | null>(null);

  // Libera la vista previa al cambiarla o al cerrar la hoja.
  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image.previewUrl);
  }, [image]);

  const form = useForm<NewProductValues>({
    resolver: zodResolver(newProductSchema),
    defaultValues: { ...emptyValues, name: initialName },
  });

  const { createProduct, isPending } = useCreateProduct({
    onCreated: () => {
      form.reset(emptyValues);
      setImage(null);
      onCreated();
    },
  });

  return {
    form,
    showMore,
    toggleShowMore: () => setShowMore((current) => !current),
    image: {
      accept: PRODUCT_IMAGE_ACCEPT,
      previewUrl: image?.previewUrl ?? null,
      select: (file: File) => setImage({ file, previewUrl: URL.createObjectURL(file) }),
      clear: () => setImage(null),
    },
    onSubmit: form.handleSubmit((values) =>
      createProduct({
        name: values.name,
        unit: values.unit,
        minimum: values.minimum,
        description: values.description || undefined,
        initialQuantity: values.initialQuantity,
        aliases: values.aliases,
      }, image?.file),
    ),
    isPending,
  };
}
