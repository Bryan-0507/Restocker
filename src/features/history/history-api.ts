import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";
import type { CatalogEventType, HistoryEntry, HistoryKind, HistoryPage, MovementSource } from "./shared/types/history-entry";
import type { MovementType } from "@/features/shared/types/inventory";

export const HISTORY_PAGE_SIZE = 30;

function toEntry(row: Tables<"history_feed">): HistoryEntry {
  const base = {
    id: row.id!,
    createdAt: row.created_at!,
    product: { id: row.product_id!, name: row.product_name!, unit: row.product_unit! },
    performedBy: { id: row.performed_by, name: row.performed_by_name || "Sistema" },
  };

  if (row.kind === "movimiento") {
    return {
      ...base,
      kind: "movimiento",
      type: row.event_type as MovementType,
      quantity: Number(row.quantity),
      source: row.source as MovementSource,
      captureItemId: row.capture_item_id,
      revertsMovementId: row.reverts_movement_id,
      revertedBy: row.reverted_by,
      canRevert: !row.reverts_movement_id && !row.reverted_by,
    };
  }

  return {
    ...base,
    kind: "catalogo",
    type: row.event_type as CatalogEventType,
    changes: row.changes ?? {},
  };
}

// GET: movimientos y cambios al catálogo en una sola línea de tiempo (vista history_feed),
// del más reciente al más antiguo, por páginas.
export async function getHistory({
  kind = "todo",
  productId,
  offset = 0,
  limit = HISTORY_PAGE_SIZE,
}: {
  kind?: HistoryKind;
  productId?: string;
  offset?: number;
  limit?: number;
} = {}): Promise<HistoryPage> {
  let query = createClient()
    .from("history_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (kind !== "todo") query = query.eq("kind", kind);
  if (productId) query = query.eq("product_id", productId);

  const { data, error } = await query;
  if (error) throw new Error("No pudimos cargar el historial.");

  return {
    entries: data.map(toEntry),
    nextOffset: data.length === limit ? offset + limit : null,
  };
}
