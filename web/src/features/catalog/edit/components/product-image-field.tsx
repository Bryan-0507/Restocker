"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/features/shared/components/product-thumb";
import type { CatalogProduct } from "../../shared/types/catalog-product";
import { useProductImage } from "../hooks/useProductImage";

export function ProductImageField({ product }: { product: CatalogProduct }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { accept, uploadImage, removeImage, isUploading, isRemoving } = useProductImage(product.id);
  const busy = isUploading || isRemoving;

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <ProductThumb name={product.name} imageUrl={product.imageUrl} className="size-20 rounded-3xl text-3xl" />

        {busy && (
          <span className="absolute inset-0 flex items-center justify-center rounded-3xl bg-background/70">
            <Loader2 className="size-6 animate-spin text-primary" aria-label="Guardando imagen" />
          </span>
        )}
      </div>

      <div className="flex flex-col items-start gap-1.5">
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="h-9 rounded-full px-3"
          >
            <Camera aria-hidden />
            {product.imageUrl ? "Cambiar foto" : "Agregar foto"}
          </Button>

          {/* Ícono rojo desde el inicio y texto rojo en hover: señala que quita, sin gritar como una acción irreversible. */}
          {product.imageUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={removeImage}
              className="h-9 rounded-full px-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive [&_svg]:text-destructive"
            >
              <Trash2 aria-hidden />
              Quitar
            </Button>
          )}
        </div>

        <span className="px-1 text-xs text-muted-foreground">Se comprime antes de subir.</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadImage(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
