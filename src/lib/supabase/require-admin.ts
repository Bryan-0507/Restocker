import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "./server";

// Para route handlers que solo puede usar el administrador del negocio.
// Devuelve el cliente del usuario y su negocio, o la respuesta de error lista para retornar.
export async function requireBusinessAdmin() {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { error: NextResponse.json({ error: "Tu sesión expiró. Inicia sesión de nuevo." }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, business_id")
    .eq("id", auth.user.id)
    .single();

  if (!profile?.business_id || profile.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Solo el administrador puede gestionar miembros." }, { status: 403 }),
    };
  }

  return { supabase, user: auth.user, businessId: profile.business_id };
}
