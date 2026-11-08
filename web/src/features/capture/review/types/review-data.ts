import type { MovementType, ProductUnit } from "@/features/shared/types/inventory";

export type ReviewProduct = {
  id: string;
  name: string;
  unit: ProductUnit;
  quantity: number;
  minimum: number;
  imageUrl: string | null;
};

export type ReviewInputType = "foto" | "audio" | "texto";

// Una propuesta tal como la dejó el modelo (columnas llm_* de capture_items).
export type ReviewItem = {
  id: string;
  inputType: ReviewInputType;
  rawText: string;
  mention: string | null;
  productId: string | null;
  suggestedName: string | null;
  type: MovementType | null;
  quantity: number | null;
  quantityMentioned: number | null;
  unitMentioned: string | null;
  note: string | null;
};

export type ReviewInput = {
  id: string;
  type: ReviewInputType;
  isRelevant: boolean;
  rejectionReason: string | null;
  storagePath: string | null;
};

export type ReviewData = {
  captureId: string;
  createdAt: string;
  items: ReviewItem[];
  inputs: ReviewInput[];
  products: ReviewProduct[];
};

// Lo que la persona decidió sobre una propuesta. Va tal cual a confirm_capture.
export type ReviewDecision =
  | { itemId: string; action: "aceptar"; productId: string; type: MovementType; quantity: number }
  | { itemId: string; action: "descartar" };
