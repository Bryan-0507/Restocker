import { Skeleton } from "@/components/ui/skeleton";

export function HistoryListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-label="Cargando historial" className="flex flex-col gap-2">
      <Skeleton className="mx-1 h-4 w-16" />
      <ul className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="flex items-center gap-3 rounded-card bg-card px-4 py-3">
            <Skeleton className="size-11 rounded-2xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="h-6 w-10" />
          </li>
        ))}
      </ul>
    </div>
  );
}
