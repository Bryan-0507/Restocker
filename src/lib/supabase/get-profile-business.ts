import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./server";

// Negocio del usuario con sesión, leído en el servidor para decidir a dónde va.
export async function getProfileBusinessId() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data } = await supabase.from("profiles").select("business_id").eq("id", auth.user.id).single();
  return data?.business_id ?? null;
}
