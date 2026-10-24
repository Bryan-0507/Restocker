import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cliente con la llave secreta: ignora RLS y puede usar la API de administración de Auth.
// Solo en route handlers, nunca en el navegador, y siempre después de validar al usuario.
export function createAdminClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
