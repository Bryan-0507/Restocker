# Restocker

Restocker registra los movimientos de inventario de un negocio a partir de fotos, audios y texto. Un modelo multimodal (Gemini) propone cada movimiento (producto, tipo y cantidad), una persona lo revisa y, al confirmar, se actualiza el inventario. El piloto se hizo con Sakura, una repostería en Guatemala.

Proyecto 3 del curso CC3092 Deep Learning y Sistemas Inteligentes, Universidad del Valle de Guatemala.

## Estructura

| Carpeta | Qué contiene |
| :- | :- |
| [`web/`](web) | La aplicación (Next.js y Supabase) y la evaluación del prompt de captura. Todos los comandos `pnpm` de este README se corren desde aquí. |
| [`forecasting/`](forecasting) | Módulo de pronóstico de demanda del proyecto final: análisis exploratorio, preprocesamiento y entrenamiento. Ver [Pronóstico de demanda](#pronóstico-de-demanda). |
| [`docs/`](docs) | Marca, diagramas, video y presentación. |

## Contenido del repositorio

| Parte | Dónde está |
| :- | :- |
| Ingesta y preprocesamiento de entradas | [`compress-image.ts`](web/src/features/capture/new/utils/compress-image.ts) (fotos a 1600 px y JPEG), [`useAudioRecorder.ts`](web/src/features/capture/new/hooks/useAudioRecorder.ts) (audio de hasta 90 s) y la ruta [`POST /api/captures`](web/src/app/api/captures/route.ts) (valida, descarga los archivos y normaliza el audio) |
| Índice de recuperación | No aplica: el sistema no usa RAG y el catálogo completo va en cada solicitud |
| Prompt final (captura-v6) | [`capture-prompt.ts`](web/src/features/capture/shared/llm/capture-prompt.ts), con el esquema de respuesta en [`capture-response-schema.ts`](web/src/features/capture/shared/llm/capture-response-schema.ts) y la llamada a Gemini en [`capture-model.ts`](web/src/features/capture/shared/llm/capture-model.ts) |
| Versiones anteriores del prompt (v0 a v5) | [`eval/prompts/`](web/eval/prompts) |
| Aplicación | Next.js en [`web/src/`](web/src), con la base de datos, las funciones y los buckets en [`supabase/migrations/`](web/supabase/migrations) |
| Conjuntos de evaluación | [`eval/iteration-tests/`](web/eval/iteration-tests) (10 casos) y [`eval/final-tests/`](web/eval/final-tests) (50 casos), con el catálogo congelado en [`eval/catalogo.json`](web/eval/catalogo.json) |
| Scripts de evaluación | [`eval/run.ts`](web/eval/run.ts) y [`eval/versions.ts`](web/eval/versions.ts) |
| Resultados reportados | [`eval/results/`](web/eval/results) |

Cada caso de evaluación es una carpeta con `caso.json` (entradas y resultado esperado) y sus archivos de foto o audio.

## Requisitos

- Node.js 22.12 o superior y pnpm 10.
- Un proyecto de [Supabase](https://supabase.com) y la [CLI de Supabase](https://supabase.com/docs/guides/cli).
- Una llave de la [API de Gemini](https://aistudio.google.com/apikey).
- macOS para correr la evaluación, porque el script usa `sips` para comprimir las fotos igual que la aplicación.

## Instalación

```bash
cd web
pnpm install
cp .env.example .env
```

Llena `web/.env` con tus valores. Las llaves nunca se suben al repositorio: `.env` está en `.gitignore` y solo se versiona `.env.example`.

| Variable | Para qué |
| :- | :- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Llave pública de Supabase |
| `SUPABASE_SECRET_KEY` | Llave secreta de Supabase, solo del lado del servidor |
| `GEMINI_API_KEY` | Llave de la API de Gemini |
| `GEMINI_CAPTURE_MODEL` | Opcional. Modelo principal, por defecto `gemini-3.8-flash` |
| `GEMINI_FALLBACK_MODEL` | Opcional. Modelo de respaldo, por defecto `gemini-3.5-flash-lite` |

Luego crea las tablas, funciones y buckets en tu proyecto de Supabase:

```bash
pnpm db:link
pnpm db:push
```

## Ejecución

```bash
pnpm dev
```

La aplicación queda en http://localhost:3000. Crea una cuenta, registra el negocio y sus productos en Catálogo, y desde Capturar envía fotos, un audio o un texto.

## Reproducir las métricas

La evaluación no necesita Supabase, solo `GEMINI_API_KEY` en `.env`. Las métricas del informe se obtuvieron con Gemini 3.5 Flash-Lite:

```bash
# Sección 2.5: las siete versiones del prompt sobre los 10 casos de iteración
pnpm eval --set iteration-tests --model gemini-3.5-flash-lite

# Sección 2.4: baseline (v0) contra la versión final (v6) sobre los 50 casos finales
pnpm eval --set final-tests --versions v0,v6 --model gemini-3.5-flash-lite
```

Cada corrida crea `web/eval/results/<set>/<fecha>-<modelo>/` con:

- `resumen.md`: estado correcto, categoría de rechazo, precisión, recall, formato inválido, errores técnicos, latencia p50 y p95 y costo total por versión, más la lista de fallas;
- `raw/`: la respuesta de cada caso con su latencia, tokens, costo y calificación.

El F1 se calcula a partir de la precisión y el recall, y los promedios de latencia y tokens de la Tabla 1 del informe salen de los archivos de `raw/`. Las corridas reportadas están en `web/eval/results/iteration-tests/20261030-2131-gemini-3.5-flash-lite/` y `web/eval/results/final-tests/20261030-2353-gemini-3.5-flash-lite/`.

Opciones del script: `--set`, `--versions` (por ejemplo `v5,v6`), `--model`, `--cases` (casos específicos) y `--concurrency` (3 por defecto). Como el modelo no es determinista, una nueva corrida puede variar en algún caso respecto a lo reportado.

## Pronóstico de demanda

El módulo de pronóstico vive en `forecasting/` y usa Python 3.12. Para crear el entorno:

```bash
cd forecasting
uv venv --python 3.12 .venv
uv pip install --python .venv -r requirements.txt
```

Los datasets ya vienen en el repositorio, así que no hace falta descargarlos:

- `data/raw/`: los datasets originales, tal como se obtuvieron de su fuente.
- `data/processed/`: cada dataset limpio y llevado al formato común (una fila por local, producto y día).

Para regenerarlos, se corren los notebooks de `notebooks/` en orden con el kernel de `.venv`. Cada uno descarga su dataset si no está en `data/raw/`, lo analiza y guarda el resultado en `data/processed/`.

| Notebook | Dataset | Papel |
| :- | :- | :- |
| `01_ddop_bakery.ipynb` | Cadena de panaderías alemana (Huber et al., 2019) | Entrenamiento y prueba con locales que el modelo no vio |
| `02_french_bakery.ipynb` | Panadería francesa (Kaggle, *French Bakery Daily Sales*) | Entrenamiento |
| `03_bread_basket.ipynb` | Cafetería y panadería de Edimburgo (OpenML, *The Bread Basket*) | Prueba final y negocio de la demostración en Restocker |

## Scripts de desarrollo

| Script | Qué hace |
| :- | :- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` y `pnpm start` | Build y servidor de producción |
| `pnpm validate` | Lint y revisión de tipos |
| `pnpm eval` | Evaluación del prompt |
| `pnpm db:link`, `pnpm db:push` y `pnpm db:types` | Conectar Supabase, aplicar las migraciones y regenerar los tipos |
