import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// Cliente para componentes de cliente y los [feature]-api.ts. La seguridad la da RLS.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
