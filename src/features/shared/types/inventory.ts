import type { Enums } from "@/lib/supabase/database.types";

export type Role = Enums<"user_role">;

export type ProductUnit = Enums<"product_unit">;

export type BusinessCategory = Enums<"business_category">;

export type MovementType = Enums<"movement_type">;

export type StockStatus = "ok" | "low" | "out";

export type CurrentSession = {
  userId: string;
  email: string;
  fullName: string;
  initials: string;
  role: Role;
  business: { id: string; name: string } | null;
};
