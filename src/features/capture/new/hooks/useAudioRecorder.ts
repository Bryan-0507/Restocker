"use client";

import { useEffect, useRef, useState } from "react";
import type { DraftAudio } from "../types/capture-draft";

// Nota de voz de hasta 1 min 30 s (docs/decisiones-captura.md, punto 1).
export const MAX_AUDIO_SECONDS = 90;
// Voz a 32 kbps: 90 s pesan ~360 KB, lejos del límite de 2 MB del servidor.
const BITS_PER_SECOND = 32_000;
// Chrome y Firefox graban webm/opus; Safari, mp4/aac. Gemini acepta los dos.
const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function pickMimeType() {
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

// Graba con MediaRecorder. onRecorded recibe el audio listo cuando se detiene.
export function useAudioRecorder({ onRecorded }: { onRecorded: (audio: DraftAudio) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const cancelledRef = useRef(false);

  function stopTimer() {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function start() {
    setError(null);

    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Este navegador no puede grabar audio. Escribe lo que pasó en Texto.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
    if (!stream) {
      setError("Necesitamos permiso para usar el micrófono. Actívalo en tu navegador e intenta de nuevo.");
      return;
    }

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: BITS_PER_SECOND });
    const chunks: Blob[] = [];
    cancelledRef.current = false;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      stopTimer();
      setIsRecording(false);
      if (cancelledRef.current || chunks.length === 0) return;

      const blob = new Blob(chunks, { type: (recorder.mimeType || mimeType || "audio/webm").split(";")[0] });
      const durationSeconds = Math.min(MAX_AUDIO_SECONDS, Math.round((performance.now() - startedAtRef.current) / 1000));
      onRecorded({ id: crypto.randomUUID(), blob, url: URL.createObjectURL(blob), durationSeconds });
    };

    recorderRef.current = recorder;
    startedAtRef.current = performance.now();
    setSeconds(0);
    setIsRecording(true);
    recorder.start();

    timerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((performance.now() - startedAtRef.current) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_AUDIO_SECONDS && recorder.state === "recording") recorder.stop();
    }, 250);
  }

  function stop() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function cancel() {
    cancelledRef.current = true;
    stop();
  }

  // Si la persona sale de Capturar grabando, se suelta el micrófono.
  useEffect(
    () => () => {
      cancelledRef.current = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    },
    [],
  );

  return { isRecording, seconds, error, start, stop, cancel };
}
