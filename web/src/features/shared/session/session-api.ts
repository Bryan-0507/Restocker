import type { CurrentSession } from "@/features/shared/types/inventory";
import { createClient } from "@/lib/supabase/client";

function initialsOf(name: string, email: string) {
  const source = name.trim() || email;
  const words = source.split(/[\s@.]+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]!.toUpperCase()).join("");
}

export async function getCurrentSession(): Promise<CurrentSession> {
  const supabase = createClient();

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, role, business:businesses(id, name)")
    .eq("id", auth.user.id)
    .single();

  if (error) throw new Error("No pudimos cargar tu perfil.");

  const email = auth.user.email ?? "";

  return {
    userId: auth.user.id,
    email,
    fullName: profile.full_name,
    initials: initialsOf(profile.full_name, email),
    role: profile.role,
    business: profile.business,
  };
}

export async function signOut() {
  const { error } = await createClient().auth.signOut();
  if (error) throw new Error("No pudimos cerrar tu sesión.");
}
