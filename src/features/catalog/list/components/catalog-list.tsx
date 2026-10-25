"use client";

import { PackagePlus, Plus, RotateCw, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/features/shared/components/page-header";
import { ProductDetailSheet } from "../../edit/components/product-detail-sheet";
import { NewProductSheet } from "../../new/components/new-product-sheet";
import { useCatalogList } from "../hooks/useCatalogList";
import { CatalogListSkeleton } from "./catalog-list-skeleton";
import { CatalogTile } from "./catalog-tile";

export function CatalogList() {
  const catalog = useCatalogList();
  const { items, filteredItems, search } = catalog;
  const isSearching = search.trim().length > 0;
  const noResults = !catalog.isLoading && !catalog.error && items.length > 0 && filteredItems.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Catálogo"
        actions={
          catalog.canEdit && (
            <Button size="touch" onClick={catalog.openNew}>
              <Plus aria-hidden />
              Producto
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(event) => catalog.setSearch(event.target.value)}
            placeholder="Buscar por nombre o alias"
            aria-label="Buscar en el catálogo"
            className="h-12 rounded-full bg-card pl-12 dark:bg-card"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3 self-end text-sm text-muted-foreground">
          Mostrar desactivados
          <Switch checked={catalog.showInactive} onCheckedChange={catalog.setShowInactive} />
        </label>
      </div>

      {catalog.isLoading && <CatalogListSkeleton />}

      {catalog.error && (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-card bg-card px-6 py-10 text-center">
          <p className="font-medium">{catalog.error.message}</p>
          <Button variant="secondary" size="touch" onClick={() => catalog.refetch()}>
            <RotateCw aria-hidden />
            Reintentar
          </Button>
        </div>
      )}

      {!catalog.isLoading && !catalog.error && items.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-card bg-card px-6 py-12 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <PackagePlus className="size-8" aria-hidden />
          </span>

          <div className="flex flex-col gap-1">
            <p className="font-heading text-2xl font-bold">Agrega tu primer producto</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Todo lo que guardas en tu negocio: harina, fresas, cajas. Con eso empiezas a llevar el inventario.
            </p>
          </div>

          {catalog.canEdit && (
            <Button size="touch" onClick={catalog.openNew}>
              <Plus aria-hidden />
              Agregar producto
            </Button>
          )}
        </div>
      )}

      {noResults && (
        <div className="flex flex-col items-center gap-3 rounded-card bg-card px-6 py-10 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">No encontramos “{search.trim()}”.</p>

          {catalog.canEdit && (
            <Button variant="secondary" size="touch" onClick={catalog.openNew}>
              <Plus aria-hidden />
              Crearlo como producto nuevo
            </Button>
          )}
        </div>
      )}

      {filteredItems.length > 0 && (
        <ul aria-label="Productos" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((product) => (
            <CatalogTile
              key={product.id}
              product={product}
              onOpen={() => catalog.openProduct(product.id)}
              onReactivate={() => catalog.reactivateProduct(product.id)}
              isReactivating={catalog.isTogglingActive}
            />
          ))}
        </ul>
      )}

      {isSearching && filteredItems.length > 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          {filteredItems.length} de {items.length} productos
        </p>
      )}

      <ProductDetailSheet
        product={catalog.selectedProduct}
        onClose={catalog.closeSheet}
        onAddAlias={catalog.addAlias}
        onRemoveAlias={catalog.removeAlias}
        onDeactivate={catalog.deactivateProduct}
        isDeactivating={catalog.isTogglingActive}
      />

      <NewProductSheet open={catalog.isCreating} onClose={catalog.closeSheet} initialName={noResults ? search.trim() : ""} />
    </div>
  );
}
