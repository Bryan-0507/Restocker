import type { Enums, Json } from "@/lib/supabase/database.types";
import type { MovementType, ProductUnit } from "@/features/shared/types/inventory";

export type CatalogEventType = Enums<"catalog_event_type">;

export type MovementSource = Enums<"movement_source">;

// Filtro de la línea de tiempo.
export type HistoryKind = "todo" | "movimiento" | "catalogo";

type BaseEntry = {
  id: string;
  createdAt: string;
  product: { id: string; name: string; unit: ProductUnit };
  performedBy: { id: string | null; name: string };
};

// Cambio de stock: entrada, uso, pérdida o ajuste.
export type MovementEntry = BaseEntry & {
  kind: "movimiento";
  type: MovementType;
  // Con signo: + entra, − sale, en la unidad del producto.
  quantity: number;
  source: MovementSource;
  captureItemId: string | null;
  // Si este movimiento deshace a otro, el id del original.
  revertsMovementId: string | null;
  // Si ya fue deshecho, el id del movimiento que lo deshizo.
  revertedBy: string | null;
  // Se puede deshacer si no es una reversión y nadie lo ha deshecho todavía.
  canRevert: boolean;
};

// Cambio al catálogo. En "producto_editado", changes = { campo: { from, to } }.
export type CatalogEntry = BaseEntry & {
  kind: "catalogo";
  type: CatalogEventType;
  changes: Json;
};

export type HistoryEntry = MovementEntry | CatalogEntry;

export type HistoryPage = {
  entries: HistoryEntry[];
  // Offset de la siguiente página, o null si ya no hay más.
  nextOffset: number | null;
};
