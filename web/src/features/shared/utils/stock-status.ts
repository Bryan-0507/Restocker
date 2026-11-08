import type { StockStatus } from "@/features/shared/types/inventory";

export function stockStatus({ quantity, minimum }: { quantity: number; minimum: number }): StockStatus {
  if (quantity <= 0) return "out";
  if (quantity < minimum) return "low";
  return "ok";
}
