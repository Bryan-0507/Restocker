"use client";

import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsDesktop } from "@/features/shared/hooks/useMediaQuery";

// Hoja de un producto (catálogo, inventario): en móvil sube desde abajo, en escritorio es un panel a la derecha.
export function ProductSheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const isDesktop = useIsDesktop();

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className="gap-0 bg-background data-[side=bottom]:max-h-[92dvh] data-[side=bottom]:rounded-t-card data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        {!isDesktop && <div aria-hidden className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-border" />}

        <SheetHeader className="px-5 pb-2 pt-4">
          <SheetTitle className="font-heading text-2xl font-bold">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
