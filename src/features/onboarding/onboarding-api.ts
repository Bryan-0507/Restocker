import type { BusinessCategory } from "@/features/shared/types/inventory";
import { createClient } from "@/lib/supabase/client";

export async function createBusiness({
  name,
  category,
  categoryOther,
}: {
  name: string;
  category: BusinessCategory;
  categoryOther?: string;
}) {
  const { data, error } = await createClient().rpc("create_business", {
    p_name: name,
    p_category: category,
    p_category_other: category === "otro" ? categoryOther : undefined,
  });

  if (error) throw new Error("No pudimos crear tu negocio. Intenta de nuevo.");
  return data;
}
