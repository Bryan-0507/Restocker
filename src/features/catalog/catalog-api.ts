import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type {
  CatalogAlias,
  CatalogProduct,
  CreateProductInput,
  UpdateProductChanges,
} from "./shared/types/catalog-product";

// Traduce los errores de Postgres a mensajes para la persona.
function toCatalogError(error: PostgrestError, fallback: string) {
  if (error.code === "23505") {
    if (error.message.includes("product_aliases")) return new Error("Ese alias ya lo usa otro producto.");
    return new Error("Ya tienes un producto con ese nombre.");
  }
  if (error.code === "42501") return new Error("No tienes permiso para modificar este catálogo.");
  return new Error(fallback);
}

// GET: productos con sus alias (JOIN por la FK de product_aliases).
// Por defecto solo los activos; con includeInactive también los desactivados, para reactivarlos.
export async function getCatalog({ includeInactive = false }: { includeInactive?: boolean } = {}): Promise<
  CatalogProduct[]
> {
  let query = createClient()
    .from("products")
    .select(
      "id, name, description, unit, minimum_quantity, current_quantity, image_path, is_active, product_aliases(id, alias, origin)",
    )
    .order("is_active", { ascending: false })
    .order("name");

  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;

  if (error) throw toCatalogError(error, "No pudimos cargar tu catálogo.");

  return data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    unit: product.unit,
    minimum: Number(product.minimum_quantity),
    quantity: Number(product.current_quantity),
    imagePath: product.image_path,
    isActive: product.is_active,
    aliases: [...product.product_aliases].sort((a, b) => a.alias.localeCompare(b.alias, "es", { sensitivity: "base" })),
  }));
}

// POST: producto + alias + cantidad inicial en una transacción (función create_product).
export async function createProduct(input: CreateProductInput): Promise<string> {
  const { data, error } = await createClient().rpc("create_product", {
    p_name: input.name,
    p_unit: input.unit,
    p_minimum_quantity: input.minimum,
    p_description: input.description,
    p_initial_quantity: input.initialQuantity ?? 0,
    p_aliases: input.aliases ?? [],
  });

  if (error) throw toCatalogError(error, "No pudimos crear el producto.");
  return data;
}

// PATCH: solo los campos que cambian.
export async function updateProduct(id: string, changes: UpdateProductChanges) {
  const { error } = await createClient()
    .from("products")
    .update({
      name: changes.name?.trim(),
      description: changes.description === undefined ? undefined : changes.description?.trim() || null,
      unit: changes.unit,
      minimum_quantity: changes.minimum,
    })
    .eq("id", id);

  if (error) throw toCatalogError(error, "No pudimos guardar los cambios.");
}

// PATCH: se desactiva en lugar de borrarse, para no romper el historial.
export async function deactivateProduct(id: string) {
  const { error } = await createClient().from("products").update({ is_active: false }).eq("id", id);
  if (error) throw toCatalogError(error, "No pudimos desactivar el producto.");
}

// PATCH: vuelve a activar un producto. Falla si ya hay otro activo con el mismo nombre.
export async function reactivateProduct(id: string) {
  const { error } = await createClient().from("products").update({ is_active: true }).eq("id", id);
  if (error) throw toCatalogError(error, "No pudimos reactivar el producto.");
}

export async function addAlias({
  productId,
  businessId,
  alias,
}: {
  productId: string;
  businessId: string;
  alias: string;
}): Promise<CatalogAlias> {
  const { data, error } = await createClient()
    .from("product_aliases")
    .insert({ product_id: productId, business_id: businessId, alias: alias.trim(), origin: "manual" })
    .select("id, alias, origin")
    .single();

  if (error) throw toCatalogError(error, "No pudimos agregar el alias.");
  return data;
}

export async function removeAlias(aliasId: string) {
  const { error } = await createClient().from("product_aliases").delete().eq("id", aliasId);
  if (error) throw toCatalogError(error, "No pudimos quitar el alias.");
}
