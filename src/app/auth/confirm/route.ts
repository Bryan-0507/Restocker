import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Destino de los enlaces con token_hash (invitaciones). Valida el token, abre la sesión
// y manda al invitado a la bienvenida para que ponga su nombre y contraseña.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${type === "invite" ? "/bienvenida" : "/"}`);
  }

  return NextResponse.redirect(`${origin}/login?error=enlace`);
}
