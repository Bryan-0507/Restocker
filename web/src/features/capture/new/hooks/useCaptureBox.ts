"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentSession } from "@/features/shared/hooks/useCurrentSession";
import { queryKeys } from "@/features/shared/query-keys";
import { CaptureRequestError, getCaptureContext, processCapture, uploadCaptureFiles } from "../../capture-api";
import type { DraftAudio, DraftPhoto, PreparedInput, RejectedInput, SubmitStep } from "../types/capture-draft";
import { compressImage } from "../utils/compress-image";

// Límites de docs/decisiones-captura.md (punto 1); el servidor los vuelve a revisar.
export const MAX_PHOTOS = 10;
export const MAX_TEXT_LENGTH = 12_000;

// Códigos de la ruta que cambian lo que muestra Capturar en lugar de un error.
const CONTEXT_CODES = new Set(["catalogo_vacio", "captura_pendiente"]);

export type RejectedEntry = { id: string; type: "foto" | "audio" | "texto"; label: string; reason: string };

export type CapturePhase =
  | { kind: "editing" }
  | { kind: "submitting"; step: SubmitStep }
  | { kind: "rejected"; message: string; entries: RejectedEntry[] }
  | { kind: "error"; message: string; canRetry: boolean };

const extensionOf = (type: string) => (type.includes("mp4") ? "m4a" : type.includes("webm") ? "webm" : "jpg");

export function useCaptureBox() {
  const queryClient = useQueryClient();
  const { session } = useCurrentSession();

  const context = useQuery({
    queryKey: queryKeys.capture,
    queryFn: getCaptureContext,
    staleTime: 30 * 1000,
    refetchOnMount: true,
  });

  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [audio, setAudio] = useState<DraftAudio | null>(null);
  const [text, setText] = useState("");
  const [isTextOpen, setIsTextOpen] = useState(false);
  const [phase, setPhase] = useState<CapturePhase>({ kind: "editing" });

  const hasText = text.trim().length > 0;
  const hasDraft = photos.length > 0 || audio !== null || hasText;
  const isSubmitting = phase.kind === "submitting";
  const photosLeft = MAX_PHOTOS - photos.length;

  // Libera las vistas previas al salir de Capturar.
  const draftRef = useRef({ photos, audio });
  useEffect(() => {
    draftRef.current = { photos, audio };
  }, [photos, audio]);
  useEffect(
    () => () => {
      draftRef.current.photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      if (draftRef.current.audio) URL.revokeObjectURL(draftRef.current.audio.url);
    },
    [],
  );

  // Cerrar la pestaña a medio envío deja la captura sin procesar: el navegador pregunta antes.
  useEffect(() => {
    if (!isSubmitting) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isSubmitting]);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (images.length > photosLeft) toast.warning(`Solo caben ${MAX_PHOTOS} fotos por captura.`);
    const added = images.slice(0, Math.max(0, photosLeft)).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((current) => [...current, ...added]);
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const photo = current.find((item) => item.id === id);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function replaceAudio(next: DraftAudio | null) {
    if (audio) URL.revokeObjectURL(audio.url);
    setAudio(next);
  }

  function closeText() {
    setText("");
    setIsTextOpen(false);
  }

  function clearDraft() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    if (audio) URL.revokeObjectURL(audio.url);
    setPhotos([]);
    setAudio(null);
    closeText();
  }

  // Nombre de cada entrada para el rechazo, en el mismo orden en que se envían.
  function labelOf(id: string) {
    const photoIndex = photos.findIndex((photo) => photo.id === id);
    if (photoIndex >= 0) return photos.length > 1 ? `Foto ${photoIndex + 1}` : "Foto";
    return audio?.id === id ? "Audio" : "Texto";
  }

  async function prepareInputs(captureId: string, businessId: string): Promise<PreparedInput[]> {
    const folder = `${businessId}/${captureId}`;
    const prepared: PreparedInput[] = [];

    for (const photo of photos) {
      const blob = await compressImage(photo.file);
      prepared.push({ id: photo.id, type: "foto", blob, path: `${folder}/${photo.id}.jpg` });
    }
    if (audio) {
      prepared.push({ id: audio.id, type: "audio", blob: audio.blob, path: `${folder}/${audio.id}.${extensionOf(audio.blob.type)}` });
    }
    // El texto lleva un id nuevo en cada envío: no tiene archivo que reutilizar.
    if (hasText) prepared.push({ id: crypto.randomUUID(), type: "texto", text: text.trim() });

    return prepared;
  }

  async function submit() {
    const businessId = session?.business?.id;
    if (!hasDraft || isSubmitting || !businessId) return;

    // Cada envío es una captura nueva, también al reintentar: el servidor borra los archivos
    // de un intento fallido.
    const captureId = crypto.randomUUID();

    try {
      setPhase({ kind: "submitting", step: "preparando" });
      const inputs = await prepareInputs(captureId, businessId);

      setPhase({ kind: "submitting", step: "subiendo" });
      await uploadCaptureFiles(inputs);

      setPhase({ kind: "submitting", step: "revisando" });
      const result = await processCapture(captureId, inputs);

      if (result.status === "rechazada") {
        setPhase({ kind: "rejected", message: result.message, entries: rejectedEntries(result.inputs, inputs) });
        return;
      }

      clearDraft();
      setPhase({ kind: "editing" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.capture }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
      ]);
      toast.success("Listo. Revisa los cambios antes de guardarlos.");
    } catch (error) {
      const code = error instanceof CaptureRequestError ? error.code : undefined;
      const message = error instanceof Error ? error.message : "No pudimos procesar la captura. Intenta de nuevo.";

      if (code && CONTEXT_CODES.has(code)) {
        setPhase({ kind: "editing" });
        await queryClient.invalidateQueries({ queryKey: queryKeys.capture });
        toast.error(message);
        return;
      }

      setPhase({ kind: "error", message, canRetry: code !== "limite_diario" });
    }
  }

  function rejectedEntries(rejected: RejectedInput[], inputs: PreparedInput[]): RejectedEntry[] {
    const typeOf = new Map(inputs.map((input) => [input.id, input.type]));
    return rejected
      .filter((input) => input.reason)
      .map((input) => {
        const type = typeOf.get(input.id) ?? "texto";
        return { id: input.id, type, label: type === "texto" ? "Texto" : labelOf(input.id), reason: input.reason! };
      });
  }

  return {
    // Contexto
    isLoading: context.isLoading,
    error: context.error,
    refetch: context.refetch,
    catalogEmpty: context.data?.productCount === 0,
    pendingCapture: context.data?.pendingCapture ?? null,
    // Borrador
    photos,
    photosLeft,
    addPhotos,
    removePhoto,
    audio,
    setAudio: replaceAudio,
    text,
    setText,
    isTextOpen,
    openText: () => setIsTextOpen(true),
    closeText,
    hasDraft,
    // Envío
    phase,
    submit,
    canSubmit: hasDraft && !isSubmitting && Boolean(session?.business?.id),
    backToEditing: () => setPhase({ kind: "editing" }),
    startOver: () => {
      clearDraft();
      setPhase({ kind: "editing" });
    },
  };
}
