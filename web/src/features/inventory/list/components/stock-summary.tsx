import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// Resumen de lo que falta. Si no falta nada, un solo aviso en vez de dos ceros.
export function StockSummary({ out, low }: { out: number; low: number }) {
  if (out === 0 && low === 0) {
    return (
      <div className="flex items-center gap-3 rounded-card bg-secondary px-4 py-3 text-secondary-foreground">
        <CircleCheck className="size-5 shrink-0" aria-hidden />
        <p className="text-sm font-medium">Todo está sobre su mínimo. No hay que comprar nada.</p>
      </div>
    );
  }

  return (
    <section aria-label="Resumen" className="grid grid-cols-2 gap-3">
      <SummaryTile value={out} label={out === 1 ? "agotado" : "agotados"} className="bg-status-out text-status-out-foreground" />
      <SummaryTile value={low} label="bajo el mínimo" className="bg-status-low text-status-low-foreground" />
    </section>
  );
}

function SummaryTile({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div className={cn("flex flex-col gap-0.5 rounded-card px-4 py-3", className)}>
      <span className="font-heading text-4xl font-extrabold leading-none tabular-nums">{value}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}
