"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "../../shared/components/product-thumb";

// Foto opcional del producto nuevo. Solo la elige; se sube al crear el producto.
export function NewProductImageField({
  name,
  previewUrl,
  accept,
  onSelect,
  onClear,
}: {
  name: string;
  previewUrl: string | null;
  accept: string;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4">
      <ProductThumb name={name.trim() || "?"} imageUrl={previewUrl} className="size-20 rounded-3xl text-3xl" />

      <div className="flex flex-col items-start gap-1.5">
        <div className="flex flex-wrap items-center gap-1">
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} className="h-9 rounded-full px-3">
            <Camera aria-hidden />
            {previewUrl ? "Cambiar foto" : "Agregar foto"}
          </Button>

          {previewUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-9 rounded-full px-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive [&_svg]:text-destructive">
              <Trash2 aria-hidden />
              Quitar
            </Button>
          )}
        </div>

        <span className="px-1 text-xs text-muted-foreground">Opcional. Se comprime antes de subir.</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelect(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
