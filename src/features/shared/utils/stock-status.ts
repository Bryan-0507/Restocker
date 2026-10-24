import type { Product, StockStatus } from "@/features/shared/types/inventory";

export function stockStatus(product: Pick<Product, "stock" | "minimum">): StockStatus {
  if (product.stock <= 0) return "out";
  if (product.stock < product.minimum) return "low";
  return "ok";
}
