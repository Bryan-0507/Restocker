import { Skeleton } from "@/components/ui/skeleton";

export function InventoryListSkeleton() {
  return (
    <div aria-label="Cargando inventario" className="flex flex-col gap-3">
      <Skeleton className="h-4 w-32" />

      <ul className="grid gap-2 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="flex items-center gap-3 rounded-card bg-card px-3 py-3">
            <Skeleton className="size-12 rounded-2xl" />

            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
