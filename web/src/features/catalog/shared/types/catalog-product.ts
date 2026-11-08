import type { Enums } from "@/lib/supabase/database.types";
import type { ProductUnit } from "@/features/shared/types/inventory";

export type CatalogAlias = {
  id: string;
  alias: string;
  origin: Enums<"alias_origin">;
};

export type CatalogProduct = {
  id: string;
  name: string;
  description: string | null;
  unit: ProductUnit;
  minimum: number;
  quantity: number;
  imagePath: string | null;
  // URL firmada (1 h) para mostrar la imagen, si tiene.
  imageUrl: string | null;
  isActive: boolean;
  aliases: CatalogAlias[];
};

export type CreateProductInput = {
  name: string;
  unit: ProductUnit;
  minimum: number;
  description?: string;
  initialQuantity?: number;
  aliases?: string[];
};

export type UpdateProductChanges = Partial<{
  name: string;
  description: string | null;
  unit: ProductUnit;
  minimum: number;
}>;
