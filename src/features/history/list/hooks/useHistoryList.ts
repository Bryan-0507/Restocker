import { useMemo } from "react";
import { movements } from "../history-mock-data";

export function useHistoryList() {
  const items = useMemo(
    () =>
      movements.map((movement) => ({
        ...movement,
        formattedQuantity: `${movement.quantity > 0 ? "+" : "−"}${Math.abs(movement.quantity)} ${movement.unit}`,
      })),
    [],
  );

  return { items };
}
