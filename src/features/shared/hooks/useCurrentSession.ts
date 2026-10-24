import { business, currentUser } from "@/features/shared/mock-data";

// Usuario y negocio de la sesión. Hoy viene de datos fijos; después, de Supabase Auth.
export function useCurrentSession() {
  return {
    user: currentUser,
    business,
    isAdmin: currentUser.role === "admin",
  };
}
