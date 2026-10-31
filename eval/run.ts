import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { GoogleGenAI } from "@google/genai";
import { VERSIONS, type CaseInput, type CatalogProduct, type Decoded, type Version } from "./versions";

// Corre un set de casos (eval/iteration-tests o eval/final-tests) contra una o varias versiones del
// prompt, califica cada respuesta contra el esperado del caso y escribe la tabla de métricas y las fallas.
//
//   pnpm eval                                    iteration-tests con todas las versiones
//   pnpm eval --versions v5,v6                   solo esas versiones
//   pnpm eval --set final-tests --versions v6 --model gemini-3.5-flash-lite
//
// A diferencia de la app, no hay modelo de respaldo: si el modelo está saturado se espera y se
// reintenta con el mismo, para que cada fila de la tabla sea de un solo modelo.

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i]!.replace(/^--/, ""), process.argv[i + 1] ?? "");

const SET = args.get("set") ?? "iteration-tests";
const MODEL = args.get("model") ?? "gemini-3.8-flash";
const ONLY_CASES = args.get("cases")?.split(",");
const CONCURRENCY = Number(args.get("concurrency") ?? 3);
const versions = args.get("versions")
  ? VERSIONS.filter((version) => args.get("versions")!.split(",").some((v) => version.name === `captura-${v}` || version.name === v))
  : VERSIONS;

// Misma configuración que la app (capture-model.ts).
const THINKING_LEVEL = "low";
const IMAGE_RESOLUTION = "high";
const MAX_OUTPUT_TOKENS = 8192;
// Más holgado que en la app: aquí importa la respuesta, no que quepa en una función de Vercel.
const REQUEST_TIMEOUT_MS = 120_000;
const SATURATED = new Set([429, 503]);
const WAITS_MS = [5_000, 15_000, 30_000, 60_000];
const PRICE_PER_MILLION: Record<string, { input: number; output: number }> = {
  "gemini-3.8-flash": { input: 0.75, output: 3.75 },
  "gemini-3.5-flash-lite": { input: 0.3, output: 2.5 },
};
const AUDIO_TYPES: Record<string, string> = {
  ".m4a": "audio/m4a",
  ".mp4": "audio/m4a",
  ".webm": "audio/webm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".aac": "audio/aac",
  ".wav": "audio/wav",
};

type Expected = {
  status: "aceptada" | "rechazada";
  // producto: el nombre del catálogo, null si no existe en el catálogo, o una lista de nombres
  // válidos cuando el caso es ambiguo a propósito. confianza: si se exige un nivel (p. ej. "baja").
  items?: { producto: string | null | (string | null)[]; tipo: string; cantidad: number | null; confianza?: string }[];
  rechazos?: { entrada: number; categoria: string }[];
  nota?: string;
};
type CaseFile = {
  id: string;
  titulo: string;
  entradas: ({ tipo: "texto"; texto: string } | { tipo: "foto" | "audio"; archivo: string })[];
  esperado: Expected;
};

const root = join(process.cwd(), "eval");
const catalogFile = JSON.parse(readFileSync(join(root, "catalogo.json"), "utf8")) as {
  productos: { id: string; nombre: string; unidad: CatalogProduct["unit"]; cantidad: number; alias: string[] }[];
};
const catalog: CatalogProduct[] = catalogFile.productos.map((product) => ({
  id: product.id,
  name: product.nombre,
  unit: product.unidad,
  quantity: product.cantidad,
  aliases: product.alias,
}));
const productName = new Map(catalog.map((product) => [product.id, product.name]));

// La app comprime cada foto a 1600 px en JPEG antes de subirla; aquí se hace lo mismo con sips (macOS).
function loadMedia(dir: string, file: string, type: "foto" | "audio") {
  const path = join(dir, file);
  if (type === "audio") {
    const mimeType = AUDIO_TYPES[extname(file).toLowerCase()];
    if (!mimeType) throw new Error(`Formato de audio no soportado: ${file}`);
    return { mimeType, base64: readFileSync(path).toString("base64") };
  }
  const out = join(tmpdir(), `eval-${randomUUID()}.jpg`);
  execFileSync("sips", ["-Z", "1600", "-s", "format", "jpeg", "-s", "formatOptions", "80", path, "--out", out], { stdio: "ignore" });
  return { mimeType: "image/jpeg", base64: readFileSync(out).toString("base64") };
}

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Call = {
  raw: unknown;
  problem: string | null;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  waits: number;
  // Falla de la llamada (saturación o timeout que no se resolvió): no cuenta contra el prompt.
  technical: boolean;
};

// La respuesta se decodifica con los alias de esta misma llamada (p1…, e1…).
async function runCase(version: Version, caso: CaseFile, dir: string) {
  const inputs: CaseInput[] = caso.entradas.map((entrada) =>
    entrada.tipo === "texto" ? { id: randomUUID(), type: "texto", text: entrada.texto } : { id: randomUUID(), type: entrada.tipo },
  );
  const prepared = version.prepare(catalog, inputs);
  const call = await callModel(version, caso, dir, inputs, prepared);
  const decoded = call.raw && typeof call.raw === "object" ? prepared.decode(call.raw) : null;
  return { call, decoded };
}

async function callModel(version: Version, caso: CaseFile, dir: string, inputs: CaseInput[], prepared: ReturnType<Version["prepare"]>): Promise<Call> {
  const media = new Map(
    caso.entradas.flatMap((entrada, index) =>
      entrada.tipo === "texto" ? [] : [[inputs[index]!.id, { type: entrada.tipo, ...loadMedia(dir, entrada.archivo, entrada.tipo) }] as const],
    ),
  );
  const input = prepared.parts.map((part) => {
    if (part.kind === "text") return { type: "text" as const, text: part.text };
    const file = media.get(part.inputId)!;
    return file.type === "foto"
      ? { type: "image" as const, data: file.base64, mime_type: file.mimeType, resolution: IMAGE_RESOLUTION }
      : { type: "audio" as const, data: file.base64, mime_type: file.mimeType };
  });

  let waits = 0;
  for (let attempt = 0; ; attempt++) {
    const startedAt = performance.now();
    try {
      const interaction = await client.interactions.create(
        {
          model: MODEL,
          system_instruction: version.system,
          input,
          response_format: { type: "text", mime_type: "application/json", schema: prepared.schema },
          generation_config: { thinking_level: THINKING_LEVEL, max_output_tokens: MAX_OUTPUT_TOKENS },
          store: false,
        },
        { timeout_ms: REQUEST_TIMEOUT_MS, retries: { strategy: "none" } },
      );
      const latencyMs = Math.round(performance.now() - startedAt);
      const usage = interaction.usage;
      const inputTokens = usage?.total_input_tokens ?? null;
      const outputTokens = usage?.total_output_tokens === undefined ? null : usage.total_output_tokens + (usage.total_thought_tokens ?? 0);
      const price = PRICE_PER_MILLION[MODEL];
      const costUsd =
        price && inputTokens !== null && outputTokens !== null ? (inputTokens * price.input + outputTokens * price.output) / 1_000_000 : null;
      const base = { latencyMs, inputTokens, outputTokens, costUsd, waits, technical: false };

      if (interaction.status !== "completed" || !interaction.output_text) {
        return { ...base, raw: null, problem: `Estado ${interaction.status}` };
      }
      let raw: unknown;
      try {
        raw = JSON.parse(interaction.output_text);
      } catch {
        return { ...base, raw: interaction.output_text, problem: "La respuesta no es JSON" };
      }
      return { ...base, raw, problem: prepared.validate(raw) };
    } catch (error) {
      const status = (error as { status?: unknown }).status;
      const timedOut = error instanceof Error && /timed out|timeout/i.test(error.message);
      if (((typeof status === "number" && SATURATED.has(status)) || timedOut) && attempt < WAITS_MS.length) {
        waits++;
        await sleep(WAITS_MS[attempt]!);
        continue;
      }
      const latencyMs = Math.round(performance.now() - startedAt);
      const problem = error instanceof Error ? error.message : "Falla al llamar a Gemini";
      return { raw: null, problem, latencyMs, inputTokens: null, outputTokens: null, costUsd: null, waits, technical: true };
    }
  }
}

// ---- Calificación

type Grade = {
  statusOk: boolean;
  categoriesOk: number;
  categoriesExpected: number;
  expectedItems: number;
  predictedItems: number;
  matched: number;
  perfect: number;
  failures: string[];
};

const sameQuantity = (a: number | null, b: number | null) => (a === null || b === null ? a === b : Math.abs(a - b) < 0.001);

function grade(expected: Expected, decoded: Decoded | null, problem: string | null): Grade {
  const expectedItems = expected.items ?? [];
  const failures: string[] = [];
  if (problem) failures.push(`Formato: ${problem}`);
  if (!decoded) {
    return {
      statusOk: false,
      categoriesOk: 0,
      categoriesExpected: expected.rechazos?.length ?? 0,
      expectedItems: expectedItems.length,
      predictedItems: 0,
      matched: 0,
      perfect: 0,
      failures,
    };
  }

  const statusOk = decoded.status === expected.status;
  if (!statusOk) failures.push(`Estado: se esperaba ${expected.status} y salió ${decoded.status}`);

  let categoriesOk = 0;
  for (const rechazo of expected.rechazos ?? []) {
    const got = decoded.inputs[rechazo.entrada - 1]?.category ?? null;
    if (got === rechazo.categoria) categoriesOk++;
    else failures.push(`Categoría de la entrada ${rechazo.entrada}: se esperaba ${rechazo.categoria} y salió ${got ?? "ninguna"}`);
  }

  const predicted = decoded.items.map((item) => ({ ...item, name: item.productId ? (productName.get(item.productId) ?? null) : null }));
  const used = new Set<number>();
  let matched = 0;
  let perfect = 0;
  for (const want of expectedItems) {
    const names = Array.isArray(want.producto) ? want.producto : [want.producto];
    const label = Array.isArray(want.producto) ? "un producto ambiguo" : (want.producto ?? "producto fuera del catálogo");
    const fits = (item: (typeof predicted)[number], i: number) => !used.has(i) && names.includes(item.name) && item.type === want.tipo;
    // Si dos esperados comparten producto y tipo (p. ej. dos productos fuera del catálogo), se
    // empareja primero con la propuesta que trae la misma cantidad.
    let index = predicted.findIndex((item, i) => fits(item, i) && sameQuantity(item.quantity, want.cantidad));
    if (index === -1) index = predicted.findIndex(fits);
    if (index === -1) {
      failures.push(`Faltó: ${label}, ${want.tipo}, ${want.cantidad ?? "sin cantidad"}`);
      continue;
    }
    used.add(index);
    matched++;
    const got = predicted[index]!;
    const quantityOk = sameQuantity(got.quantity, want.cantidad);
    const confidenceOk = !want.confianza || got.confidence === want.confianza;
    if (quantityOk && confidenceOk) perfect++;
    if (!quantityOk) failures.push(`Cantidad de ${label}: se esperaba ${want.cantidad ?? "vacía"} y salió ${got.quantity ?? "vacía"}`);
    if (!confidenceOk) failures.push(`Confianza de ${label}: se esperaba ${want.confianza} y salió ${got.confidence ?? "ninguna"}`);
  }
  predicted.forEach((item, i) => {
    if (!used.has(i)) {
      failures.push(`Sobró: ${item.name ?? `sin producto (${item.suggested ?? "?"})`}, ${item.type}, ${item.quantity ?? "sin cantidad"}`);
    }
  });

  return {
    statusOk,
    categoriesOk,
    categoriesExpected: expected.rechazos?.length ?? 0,
    expectedItems: expectedItems.length,
    predictedItems: predicted.length,
    matched,
    perfect,
    failures,
  };
}

// ---- Ejecución

const setDir = join(root, SET);
const cases = readdirSync(setDir)
  .filter((id) => existsSync(join(setDir, id, "caso.json")) && (!ONLY_CASES || ONLY_CASES.includes(id)))
  .sort()
  .map((id) => ({ dir: join(setDir, id), caso: JSON.parse(readFileSync(join(setDir, id, "caso.json"), "utf8")) as CaseFile }));

const ready = cases.filter(({ dir, caso }) =>
  caso.entradas.every((entrada) => entrada.tipo === "texto" || existsSync(join(dir, entrada.archivo))),
);
const missing = cases.filter((item) => !ready.includes(item));

const stamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
const outDir = join(root, "results", SET, `${stamp}-${MODEL}`);
mkdirSync(join(outDir, "raw"), { recursive: true });

type Row = { version: string; caso: string; titulo: string; call: Call; grade: Grade; decoded: Decoded | null };
const rows: Row[] = [];
const jobs = versions.flatMap((version) => ready.map((item) => ({ version, ...item })));

console.log(`${SET}: ${ready.length} casos × ${versions.length} versiones = ${jobs.length} llamadas con ${MODEL}`);
if (missing.length > 0) console.log(`Sin archivos (se saltan): ${missing.map(({ caso }) => caso.id).join(", ")}`);

let next = 0;
async function worker() {
  while (next < jobs.length) {
    const job = jobs[next++]!;
    const { call, decoded } = await runCase(job.version, job.caso, job.dir);
    const result = grade(job.caso.esperado, decoded, call.problem);
    rows.push({ version: job.version.name, caso: job.caso.id, titulo: job.caso.titulo, call, grade: result, decoded });
    writeFileSync(join(outDir, "raw", `${job.version.name}-${job.caso.id}.json`), JSON.stringify({ call, decoded, grade: result }, null, 2));
    console.log(`${job.version.name} ${job.caso.id} ${result.failures.length === 0 ? "ok" : `${result.failures.length} falla(s)`}`);
  }
}

// ---- Reporte

function report() {
  const pct = (a: number, b: number) => (b === 0 ? "—" : `${Math.round((a / b) * 100)} %`);
  const percentile = (values: number[], p: number) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]!;
  };

  const lines = [
    `# Resultados: set ${SET}, modelo ${MODEL}`,
    "",
    `${ready.length} casos por versión. Sin archivos: ${missing.map(({ caso }) => caso.id).join(", ") || "ninguno"}.`,
    "Las métricas excluyen los errores técnicos (saturación o timeout sin respuesta).",
    "",
    "| Versión | Casos | Estado correcto | Categoría de rechazo | Precisión | Recall | Propuesta perfecta | Formato inválido | Errores técnicos | Latencia p50 / p95 | Costo total |",
    "| :- | :- | :- | :- | :- | :- | :- | :- | :- | :- | :- |",
  ];
  for (const version of versions) {
    const all = rows.filter((row) => row.version === version.name);
    const own = all.filter((row) => !row.call.technical);
    const sum = (key: keyof Grade) => own.reduce((total, row) => total + (row.grade[key] as number), 0);
    const latencies = own.map((row) => row.call.latencyMs);
    const cost = own.reduce((total, row) => total + (row.call.costUsd ?? 0), 0);
    lines.push(
      `| ${version.name} | ${own.length} | ${pct(own.filter((row) => row.grade.statusOk).length, own.length)}` +
        ` | ${pct(sum("categoriesOk"), sum("categoriesExpected"))} | ${pct(sum("matched"), sum("predictedItems"))}` +
        ` | ${pct(sum("matched"), sum("expectedItems"))} | ${pct(sum("perfect"), sum("expectedItems"))}` +
        ` | ${own.filter((row) => row.call.problem).length} | ${all.length - own.length}` +
        ` | ${(percentile(latencies, 50) / 1000).toFixed(1)} s / ${(percentile(latencies, 95) / 1000).toFixed(1)} s | $${cost.toFixed(4)} |`,
    );
  }

  lines.push("", "## Fallas", "");
  for (const version of versions) {
    const failed = rows
      .filter((row) => row.version === version.name && row.grade.failures.length > 0)
      .sort((a, b) => a.caso.localeCompare(b.caso));
    if (failed.length === 0) continue;
    lines.push(`### ${version.name}`, "");
    for (const row of failed) {
      const label = row.call.technical ? "error técnico, no se califica" : row.grade.failures.join("; ");
      lines.push(`- **${row.caso} · ${row.titulo}:** ${label}`);
    }
    lines.push("");
  }

  writeFileSync(join(outDir, "resumen.md"), lines.join("\n"));
  console.log(`\n${lines.slice(0, 7 + versions.length).join("\n")}\n\nResultados en ${outDir}`);
}

Promise.all(Array.from({ length: CONCURRENCY }, worker)).then(report);
