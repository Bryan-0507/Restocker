import { useCurrentSession } from "@/features/shared/hooks/useCurrentSession";
import { products } from "@/features/shared/mock-data";

export function useCatalogList() {
  const { isAdmin } = useCurrentSession();

  return {
    items: products,
    canEdit: isAdmin,
  };
}
