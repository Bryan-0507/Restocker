"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PackagePlus, RotateCw, Search, SearchX } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/features/shared/components/page-header";
import { MovementSheet } from "../../adjust/components/movement-sheet";
import { cn } from "@/lib/utils";
import { useInventoryList } from "../hooks/useInventoryList";
import { InventoryListSkeleton } from "./inventory-list-skeleton";
import { InventoryRow } from "./inventory-row";
import { StockSummary } from "./stock-summary";

export function InventoryList() {
  const inventory = useInventoryList();
  const { toRestock, upToDate } = inventory;
  const hasData = !inventory.isLoading && !inventory.error && !inventory.isEmpty;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Inventario" />

      {hasData && <StockSummary out={inventory.counts.out} low={inventory.counts.low} />}

      {hasData && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={inventory.search}
            onChange={(event) => inventory.setSearch(event.target.value)}
            placeholder="Buscar producto"
            aria-label="Buscar en el inventario"
            className="h-12 rounded-full bg-card pl-12 dark:bg-card"
          />
        </div>
      )}

      {inventory.isLoading && <InventoryListSkeleton />}

      {inventory.error && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-card bg-card px-6 py-10 text-center">
          <p className="font-medium">{inventory.error.message}</p>
          <Button variant="secondary" size="touch" onClick={() => inventory.refetch()}>
            <RotateCw aria-hidden />
            Reintentar
          </Button>
        </div>
      )}

      {inventory.isEmpty && (
        <div className="flex flex-col items-center gap-4 rounded-card bg-card px-6 py-12 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <PackagePlus className="size-8" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-2xl font-bold">Aún no hay productos</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Agrega en el catálogo lo que guardas en tu negocio y aquí verás cuánto te queda.
            </p>
          </div>
          <Link href="/catalogo" className={buttonVariants({ size: "touch" })}>
            Ir al catálogo
          </Link>
        </div>
      )}

      {inventory.noResults && (
        <div className="flex flex-col items-center gap-3 rounded-card bg-card px-6 py-10 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">No encontramos “{inventory.search.trim()}”.</p>
        </div>
      )}

      {hasData && !inventory.noResults && (
        <>
          {toRestock.length > 0 && (
            <InventorySection title="Hay que comprar" tone="urgent">
              {toRestock.map((product) => (
                <InventoryRow key={product.id} product={product} onOpen={() => inventory.openProduct(product.id)} />
              ))}
            </InventorySection>
          )}

          {upToDate.length > 0 && (
            <InventorySection title="Al día">
              {upToDate.map((product) => (
                <InventoryRow key={product.id} product={product} onOpen={() => inventory.openProduct(product.id)} />
              ))}
            </InventorySection>
          )}
        </>
      )}

      <MovementSheet product={inventory.selectedProduct} onClose={inventory.closeProduct} />
    </div>
  );
}

function InventorySection({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "urgent";
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      {/* Sin contador: el resumen de arriba ya da los números. */}
      <h2 className={cn("px-1 text-sm font-medium", tone === "urgent" ? "text-status-out-foreground" : "text-muted-foreground")}>
        {title}
      </h2>
      <ul className="grid gap-2 md:grid-cols-2">{children}</ul>
    </section>
  );
}
