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

// Para quien llega por invitación: define su contraseña y su nombre.
export async function completeInvitation({ fullName, password }: { fullName: string; password: string }) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.updateUser({ password, data: { full_name: fullName } });
  if (error || !data.user) throw new Error("No pudimos guardar tu contraseña. Intenta de nuevo.");

  const { error: profileError } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", data.user.id);
  if (profileError) throw new Error("No pudimos guardar tu nombre. Intenta de nuevo.");
}
