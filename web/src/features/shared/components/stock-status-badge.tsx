import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "@/features/shared/types/inventory";

const labels: Record<StockStatus, string> = {
  ok: "Ok",
  low: "Stock bajo",
  out: "Agotado",
};

// El estado siempre lleva texto, nunca solo color.
export function StockStatusBadge({ status, className }: { status: StockStatus; className?: string }) {
  return (
    <Badge variant={status} className={className}>
      {labels[status]}
    </Badge>
  );
}
