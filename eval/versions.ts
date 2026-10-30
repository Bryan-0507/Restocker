import type { ProductUnit } from "../src/features/shared/types/inventory";
import * as v0 from "./prompts/captura-v0/capture-prompt";
import * as v0Schema from "./prompts/captura-v0/capture-response-schema";
import * as v1 from "./prompts/captura-v1/capture-prompt";
import * as v1Schema from "./prompts/captura-v1/capture-response-schema";
import * as v2 from "./prompts/captura-v2/capture-prompt";
import * as v2Schema from "./prompts/captura-v2/capture-response-schema";
import * as v3 from "./prompts/captura-v3/capture-prompt";
import * as v3Schema from "./prompts/captura-v3/capture-response-schema";
import * as v4 from "./prompts/captura-v4/capture-prompt";
import * as v4Schema from "./prompts/captura-v4/capture-response-schema";
import * as v5 from "./prompts/captura-v5/capture-prompt";
import * as v5Schema from "./prompts/captura-v5/capture-response-schema";
import * as v6 from "../src/features/capture/shared/llm/capture-prompt";
import * as v6Schema from "../src/features/capture/shared/llm/capture-response-schema";

// Cada versión corre con su propio código (prompt, turno del usuario y esquema), tal como era.
// Lo único común es la llamada a Gemini y cómo se lee la respuesta para calificarla.

export type CatalogProduct = { id: string; name: string; unit: ProductUnit; quantity: number; aliases: string[] };
export type CaseInput = { id: string; type: "texto"; text: string } | { id: string; type: "foto" | "audio" };
export type Part = { kind: "text"; text: string } | { kind: "media"; inputId: string };

export type Decoded = {
  status: "aceptada" | "rechazada";
  inputs: { relevant: boolean; category: string | null; reason: string | null; transcription: string | null }[];
  items: {
    inputIndex: number | null;
    productId: string | null;
    suggested: string | null;
    type: string | null;
    quantity: number | null;
    confidence: string | number | null;
    note: string | null;
  }[];
  message: string | null;
};

export type Prepared = {
  parts: Part[];
  schema: Record<string, unknown>;
  // Problema de formato según el validador de la versión (null si la respuesta es válida).
  validate: (raw: unknown) => string | null;
  decode: (raw: unknown) => Decoded;
};

export type Version = { name: string; system: string; prepare: (catalog: CatalogProduct[], inputs: CaseInput[]) => Prepared };

const BUSINESS = { businessName: "Sakura", businessCategory: "Repostería" };

// Lectura tolerante de la respuesta cruda: sirve para todas las versiones aunque no pase su
// validador, para poder calificar también las respuestas con formato incorrecto.
type Loose = Record<string, unknown>;
const asArray = (value: unknown): Loose[] => (Array.isArray(value) ? (value as Loose[]) : []);
const str = (value: unknown) => (typeof value === "string" ? value : null);
const num = (value: unknown) => (typeof value === "number" ? value : null);

function decodeLoose(raw: unknown, productId: (id: string | null) => string | null, inputIndex: (id: string | null) => number | null): Decoded {
  const body = (raw ?? {}) as Loose;
  const inputs = asArray(body.inputs).map((input) => ({
    relevant: input.is_relevant !== false,
    category: str(input.rejection_category),
    reason: str(input.rejection_reason),
    transcription: str(input.transcription),
  }));
  const items = asArray(body.items).map((item) => ({
    inputIndex: inputIndex(str(item.input_id)),
    productId: productId(str(item.product_id)),
    suggested: str(item.suggested_product_name),
    type: str(item.type),
    quantity: num(item.quantity),
    confidence: str(item.confidence) ?? num(item.confidence),
    note: str(item.review_note),
  }));
  // v0 a v2 no tienen status: se toma como rechazo una respuesta sin propuestas.
  const status = body.status === "rechazada" || (body.status === undefined && items.length === 0) ? "rechazada" : "aceptada";
  return { status, inputs, items, message: str(body.message) };
}

// Gemini no acepta algunas palabras que genera zod; mismo ajuste que hace la app en producción
// (capture-response-schema.ts), aplicado igual a todas las versiones para que no cambie la comparación.
const MAX_ITEMS = 60;
export function toGeminiSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toGeminiSchema);
  if (node === null || typeof node !== "object") return node;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === "$schema") continue;
    if (key === "maxItems" && value === MAX_ITEMS) continue;
    if (key === "oneOf") result.anyOf = toGeminiSchema(value);
    else if (key === "const") result.enum = [value];
    else result[key] = toGeminiSchema(value);
  }
  return result;
}
const geminiSchema = (schema: unknown) => toGeminiSchema(schema) as Record<string, unknown>;

// Versiones con alias cortos (p1…, e1…) y turno del usuario en partes: v2 en adelante.
type AliasModule = {
  SYSTEM_INSTRUCTION: string;
  buildUserPrompt: (args: typeof BUSINESS & { products: CatalogProduct[]; inputs: CaseInput[] }) => {
    parts: Part[];
    productAliases: string[];
    inputAliases: string[];
    productIdByAlias: Map<string, string>;
  };
};

function aliasVersion(
  name: string,
  prompt: AliasModule,
  schema: (productAliases: string[], inputAliases: string[]) => unknown,
  validate: (raw: unknown, productAliases: string[], inputAliases: string[]) => string | null,
): Version {
  return {
    name,
    system: prompt.SYSTEM_INSTRUCTION,
    prepare(catalog, inputs) {
      const built = prompt.buildUserPrompt({ ...BUSINESS, products: catalog, inputs });
      return {
        parts: built.parts,
        schema: geminiSchema(schema(built.productAliases, built.inputAliases)),
        validate: (raw) => validate(raw, built.productAliases, built.inputAliases),
        decode: (raw) =>
          decodeLoose(
            raw,
            (id) => (id ? (built.productIdByAlias.get(id) ?? null) : null),
            (id) => (id && built.inputAliases.includes(id) ? built.inputAliases.indexOf(id) : null),
          ),
      };
    },
  };
}

const zodValidator =
  (build: (productAliases: string[], inputAliases: string[]) => { safeParse: (raw: unknown) => { success: boolean; error?: { issues: { message: string }[] } } }) =>
  (raw: unknown, productAliases: string[], inputAliases: string[]) => {
    const parsed = build(productAliases, inputAliases).safeParse(raw);
    return parsed.success ? null : (parsed.error?.issues[0]?.message ?? "Respuesta inválida");
  };

const parserValidator =
  (parse: (raw: unknown, productAliases: string[], inputAliases: string[]) => { ok: true } | { ok: false; problem: string }) =>
  (raw: unknown, productAliases: string[], inputAliases: string[]) => {
    const parsed = parse(raw, productAliases, inputAliases);
    return parsed.ok ? null : parsed.problem;
  };

// v1: ids reales (UUID) en el prompt y el turno del usuario como un solo texto. Los archivos se
// insertan justo después del marcador de su entrada, como en las demás versiones.
const version1: Version = {
  name: "captura-v1",
  system: v1.SYSTEM_INSTRUCTION,
  prepare(catalog, inputs) {
    const text = v1.buildUserPrompt({ ...BUSINESS, products: catalog, inputs });
    const parts: Part[] = [];
    let rest = text;
    for (const input of inputs) {
      if (input.type === "texto") continue;
      const marker = `<entrada id="${input.id}" tipo="${input.type}">`;
      const end = rest.indexOf("</entrada>", rest.indexOf(marker)) + "</entrada>".length;
      parts.push({ kind: "text", text: rest.slice(0, end) }, { kind: "media", inputId: input.id });
      rest = rest.slice(end);
    }
    parts.push({ kind: "text", text: rest });
    const productIds = new Set(catalog.map((product) => product.id));
    const inputIds = inputs.map((input) => input.id);
    return {
      parts,
      schema: geminiSchema(v1Schema.captureResponseJsonSchema),
      validate: (raw) => {
        const parsed = v1Schema.captureResponseSchema.safeParse(raw);
        return parsed.success ? null : (parsed.error.issues[0]?.message ?? "Respuesta inválida");
      },
      decode: (raw) =>
        decodeLoose(
          raw,
          (id) => (id && productIds.has(id) ? id : null),
          (id) => (id && inputIds.includes(id) ? inputIds.indexOf(id) : null),
        ),
    };
  },
};

const version0: Version = {
  name: "captura-v0",
  system: v0.SYSTEM_INSTRUCTION,
  prepare(catalog, inputs) {
    const built = v0.buildUserPrompt({ products: catalog, inputs });
    return {
      parts: built.parts,
      schema: geminiSchema(v0Schema.buildCaptureResponseJsonSchema(built.productAliases, built.inputAliases)),
      validate: (raw) => (Array.isArray((raw as Loose | null)?.items) ? null : "Respuesta sin items"),
      decode: (raw) =>
        decodeLoose(
          raw,
          (id) => (id ? (built.productIdByAlias.get(id) ?? null) : null),
          (id) => (id && built.inputAliases.includes(id) ? built.inputAliases.indexOf(id) : null),
        ),
    };
  },
};

export const VERSIONS: Version[] = [
  version0,
  version1,
  aliasVersion("captura-v2", v2, v2Schema.buildCaptureResponseJsonSchema, zodValidator(v2Schema.buildCaptureResponseSchema)),
  aliasVersion("captura-v3", v3, v3Schema.buildCaptureResponseJsonSchema, parserValidator(v3Schema.parseCaptureResponse)),
  aliasVersion("captura-v4", v4, v4Schema.buildCaptureResponseJsonSchema, parserValidator(v4Schema.parseCaptureResponse)),
  aliasVersion("captura-v5", v5, v5Schema.buildCaptureResponseJsonSchema, parserValidator(v5Schema.parseCaptureResponse)),
  aliasVersion("captura-v6", v6, v6Schema.buildCaptureResponseJsonSchema, parserValidator(v6Schema.parseCaptureResponse)),
];
