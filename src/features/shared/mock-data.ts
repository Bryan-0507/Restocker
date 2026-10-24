// Datos fijos para validar el diseño del esqueleto. Se reemplazan por Supabase
// cuando cada feature tenga su [feature]-api.ts.
import type { Business, CurrentUser, Product } from "@/features/shared/types/inventory";

export const currentUser: CurrentUser = {
  name: "Bryan Alberto",
  initials: "BA",
  role: "admin",
};

export const business: Business = {
  name: "Sakura",
};

export const products: Product[] = [
  { id: "matcha", name: "Matcha", category: "Polvos", unit: "kg", stock: 0, minimum: 0.5, aliases: ["té verde"] },
  { id: "mantequilla", name: "Mantequilla", category: "Lácteos", unit: "kg", stock: 1.5, minimum: 4, aliases: ["mantequilla sin sal"] },
  { id: "harina-arroz", name: "Harina de arroz", category: "Harinas", unit: "kg", stock: 55, minimum: 10, aliases: ["harina glutinosa", "mochiko"] },
  { id: "queso-crema", name: "Queso crema", category: "Lácteos", unit: "kg", stock: 6.5, minimum: 3, aliases: ["philadelphia", "philly"] },
  { id: "fresa", name: "Fresa", category: "Frutas", unit: "kg", stock: 5, minimum: 2, aliases: ["fresas"] },
  { id: "azucar-glass", name: "Azúcar glass", category: "Azúcares", unit: "kg", stock: 8, minimum: 2, aliases: ["azúcar pulverizada"] },
];

export const pendingCapture = {
  proposals: 2,
  time: "Hoy, 10:05",
};
