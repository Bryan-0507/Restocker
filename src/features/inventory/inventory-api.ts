import { stockStatus } from "@/features/shared/utils/stock-status";
import { createClient } from "@/lib/supabase/client";
import type {
  InventoryData,
  InventoryProduct,
  InventoryStats,
  ManualMovementInput,
  PendingCapture,
} from "./shared/types/inventory-data";

const IMAGE_URL_TTL_SECONDS = 60 * 60;

async function getProducts(): Promise<InventoryProduct[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, unit, current_quantity, minimum_quantity, image_path")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error("No pudimos cargar tu inventario.");

  // Las imágenes viven en un bucket privado: se firman todas en una sola llamada.
  const paths = data.flatMap((product) => (product.image_path ? [product.image_path] : []));
  const signed = new Map<string, string>();

  if (paths.length > 0) {
    const { data: urls } = await supabase.storage.from("product-images").createSignedUrls(paths, IMAGE_URL_TTL_SECONDS);
    urls?.forEach((url) => {
      if (url.path && url.signedUrl) signed.set(url.path, url.signedUrl);
    });
  }

  return data.map((product) => {
    const quantity = Number(product.current_quantity);
    const minimum = Number(product.minimum_quantity);
    const status = stockStatus({ quantity, minimum });

    return {
      id: product.id,
      name: product.name,
      unit: product.unit,
      quantity,
      minimum,
      status,
      needsRestock: status !== "ok",
      imageUrl: product.image_path ? (signed.get(product.image_path) ?? null) : null,
    };
  });
}

async function getPendingCapture(): Promise<PendingCapture | null> {
  const { data, error } = await createClient()
    .from("captures")
    .select("id, created_at, capture_items(count)")
    .in("status", ["procesando", "en_revision"])
    .maybeSingle();

  if (error) throw new Error("No pudimos revisar si hay capturas pendientes.");
  if (!data) return null;

  return { id: data.id, proposals: data.capture_items[0]?.count ?? 0, createdAt: data.created_at };
}

// GET: productos con su estado ya calculado + resumen para las alertas.
export async function getInventory(): Promise<InventoryData> {
  const [products, pendingCapture] = await Promise.all([getProducts(), getPendingCapture()]);

  const stats: InventoryStats = {
    total: products.length,
    ok: products.filter((product) => product.status === "ok").length,
    low: products.filter((product) => product.status === "low").length,
    out: products.filter((product) => product.status === "out").length,
    pendingCapture,
  };

  return { products, stats };
}

// POST: movimiento manual (función register_manual_movement).
export async function registerManualMovement(input: ManualMovementInput): Promise<string> {
  const { data, error } = await createClient().rpc("register_manual_movement", {
    p_product_id: input.productId,
    p_type: input.type,
    p_quantity: input.quantity,
  });

  // Los mensajes de la función ya vienen en español y explican qué pasó.
  if (error) throw new Error(error.message || "No pudimos registrar el movimiento.");
  return data;
}
