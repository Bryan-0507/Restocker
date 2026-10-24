import { useMemo } from "react";
import { pendingCapture, products } from "@/features/shared/mock-data";
import { stockStatus } from "@/features/shared/utils/stock-status";

export function useInventoryList() {
  const items = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        status: stockStatus({ quantity: product.stock, minimum: product.minimum }),
      })),
    [],
  );

  const toBuy = useMemo(() => items.filter((item) => item.status !== "ok"), [items]);

  const counts = useMemo(
    () => ({
      ok: items.filter((item) => item.status === "ok").length,
      low: items.filter((item) => item.status === "low").length,
      out: items.filter((item) => item.status === "out").length,
    }),
    [items],
  );

  return { items, toBuy, counts, pendingCapture };
}
