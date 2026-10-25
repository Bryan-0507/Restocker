import { Skeleton } from "@/components/ui/skeleton";

export function CatalogListSkeleton() {
  return (
    <ul aria-label="Cargando catálogo" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <li key={index} className="flex flex-col gap-3 rounded-card bg-card p-3">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />

          <div className="flex flex-col gap-2 px-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  );
}
