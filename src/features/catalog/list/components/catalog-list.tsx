"use client";

import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/features/shared/components/page-header";
import { useCatalogList } from "../hooks/useCatalogList";

export function CatalogList() {
  const { items, canEdit } = useCatalogList();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Catálogo"
        actions={
          canEdit && (
            <Button size="touch">
              <Plus aria-hidden />
              Producto
            </Button>
          )
        }
      />
    
      <ul className="grid gap-2 md:grid-cols-2">
        {items.map((product) => (
          <li key={product.id} className="flex flex-col gap-2 rounded-card bg-card px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-heading text-lg font-bold leading-tight">{product.name}</span>
              <span className="text-xs text-muted-foreground">
                {product.category} · {product.unit}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {product.aliases.map((alias) => (
                <Badge key={alias} variant="secondary">
                  {alias}
                </Badge>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
