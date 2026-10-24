import type { BusinessCategory } from "@/features/shared/types/inventory";

// Debe coincidir con el enum business_category de la base de datos.
export const BUSINESS_CATEGORY_OPTIONS: { value: BusinessCategory; label: string }[] = [
  { value: "reposteria", label: "Repostería" },
  { value: "panaderia", label: "Panadería" },
  { value: "restaurante", label: "Restaurante" },
  { value: "cafeteria", label: "Cafetería" },
  { value: "tienda", label: "Tienda" },
  { value: "ferreteria", label: "Ferretería" },
  { value: "farmacia", label: "Farmacia" },
  { value: "salon_belleza", label: "Salón de belleza" },
  { value: "otro", label: "Otro" },
];
