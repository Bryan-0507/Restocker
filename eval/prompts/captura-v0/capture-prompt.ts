// Línea base para el reporte: la petición mínima, sin reglas, ejemplos ni categorías de rechazo.
// Recibe lo mismo que las demás versiones (catálogo y entradas) y devuelve solo movimientos.
export const PROMPT_VERSION = "captura-v0";

export const SYSTEM_INSTRUCTION =
  "Eres un asistente de inventario. Con base en el catálogo, convierte lo que manda el equipo (fotos, audios y texto) en movimientos de inventario: entrada, uso, perdida o ajuste.";

export type PromptCatalogProduct = { id: string; name: string; aliases: string[] };
export type PromptInput = { id: string; type: "texto"; text: string } | { id: string; type: "foto" | "audio" };
export type PromptPart = { kind: "text"; text: string } | { kind: "media"; inputId: string };

export function buildUserPrompt({ products, inputs }: { products: PromptCatalogProduct[]; inputs: PromptInput[] }) {
  const productAliases = products.map((_, index) => `p${index + 1}`);
  const inputAliases = inputs.map((_, index) => `e${index + 1}`);
  const catalog = products.map((product, index) => `${productAliases[index]}: ${product.name}`).join("\n");

  const parts: PromptPart[] = [{ kind: "text", text: `Catálogo:\n${catalog}\n\nEntradas:` }];
  inputs.forEach((input, index) => {
    if (input.type === "texto") {
      parts.push({ kind: "text", text: `${inputAliases[index]} (texto): ${input.text}` });
      return;
    }
    parts.push({ kind: "text", text: `${inputAliases[index]} (${input.type}):` });
    parts.push({ kind: "media", inputId: input.id });
  });

  return {
    parts,
    productAliases,
    inputAliases,
    productIdByAlias: new Map(products.map((product, index) => [productAliases[index]!, product.id])),
  };
}
