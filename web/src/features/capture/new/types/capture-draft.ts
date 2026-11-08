// Lo que la persona va armando antes de enviar. Los archivos se quedan en el navegador hasta que
// la captura se procesa bien, así un error o un rechazo permiten reintentar sin volver a cargarlos.
export type DraftPhoto = { id: string; file: File; previewUrl: string };

export type DraftAudio = { id: string; blob: Blob; url: string; durationSeconds: number };

// Ya comprimido y con su ruta en Storage (<business_id>/<capture_id>/<input_id>.<ext>).
export type PreparedInput =
  | { id: string; type: "texto"; text: string }
  | { id: string; type: "foto" | "audio"; blob: Blob; path: string };

export type CaptureContext = {
  productCount: number;
  pendingCapture: { id: string; proposals: number; createdAt: string } | null;
};

export type RejectedInput = { id: string; category: string | null; reason: string | null };

export type CaptureResult =
  | { status: "en_revision"; captureId: string }
  | { status: "rechazada"; captureId: string; message: string; inputs: RejectedInput[] };

// Pasos reales del envío, en orden. Revisar es la llamada a Gemini: la parte larga.
export type SubmitStep = "preparando" | "subiendo" | "revisando";
