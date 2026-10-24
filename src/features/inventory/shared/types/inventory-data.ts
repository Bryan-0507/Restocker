import type { MovementType, ProductUnit, StockStatus } from "@/features/shared/types/inventory";

export type InventoryProduct = {
  id: string;
  name: string;
  unit: ProductUnit;
  quantity: number;
  minimum: number;
  status: StockStatus;
  // Atajo para la UI: true si está bajo el mínimo o agotado.
  needsRestock: boolean;
  // URL firmada (1 h) de la imagen en Storage, si tiene.
  imageUrl: string | null;
};

export type PendingCapture = {
  id: string;
  proposals: number;
  createdAt: string;
};

export type InventoryStats = {
  total: number;
  ok: number;
  low: number;
  out: number;
  // Captura del negocio sin revisar (a lo mucho una).
  pendingCapture: PendingCapture | null;
};

export type InventoryData = {
  products: InventoryProduct[];
  stats: InventoryStats;
};

export type ManualMovementInput = {
  productId: string;
  type: MovementType;
  // Siempre positiva. En "ajuste" es la cantidad contada; en los demás, cuánto entra o sale.
  quantity: number;
};
