"use client";

import { Mic, RotateCcw, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_AUDIO_SECONDS } from "../hooks/useAudioRecorder";
import type { DraftAudio } from "../types/capture-draft";

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

type Recorder = {
  isRecording: boolean;
  seconds: number;
  error: string | null;
  start: () => void;
  stop: () => void;
  cancel: () => void;
};

// Mientras graba: tiempo contra el límite y botón para detener. Después: reproducir, volver a
// grabar o quitar.
export function AudioPanel({ recorder, audio, onRemove }: { recorder: Recorder; audio: DraftAudio | null; onRemove: () => void }) {
  if (recorder.isRecording) {
    const left = MAX_AUDIO_SECONDS - recorder.seconds;
    return (
      <section aria-label="Grabando audio" className="flex flex-col gap-4 rounded-card bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/60 motion-reduce:hidden" />
            <span className="relative inline-flex size-3 rounded-full bg-destructive" />
          </span>
          <span className="font-medium">Grabando</span>
          <span className="ml-auto font-heading text-2xl font-bold tabular-nums">{clock(recorder.seconds)}</span>
        </div>

        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Tiempo de grabación"
          aria-valuemin={0}
          aria-valuemax={MAX_AUDIO_SECONDS}
          aria-valuenow={recorder.seconds}
        >
          <div
            className="h-full rounded-full bg-destructive transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${(recorder.seconds / MAX_AUDIO_SECONDS) * 100}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {left <= 10 ? `Quedan ${left} s; se detiene solo.` : `Hasta ${clock(MAX_AUDIO_SECONDS)}. Di qué entró, se usó o se perdió.`}
        </p>

        <div className="flex gap-2">
          <Button variant="outline" size="touch" onClick={recorder.cancel} className="flex-1 bg-card dark:bg-card">
            Cancelar
          </Button>
          <Button size="touch" onClick={recorder.stop} className="flex-1">
            <Square className="fill-current" aria-hidden />
            Detener
          </Button>
        </div>
      </section>
    );
  }

  if (!audio) {
    return recorder.error ? (
      <p role="alert" className="rounded-card bg-destructive/10 p-4 text-sm text-destructive">
        {recorder.error}
      </p>
    ) : null;
  }

  return (
    <section aria-label="Audio" className="flex flex-col gap-3 rounded-card bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <Mic className="size-5" aria-hidden />
        </span>
        <span className="flex flex-col">
          <span className="font-medium">Nota de voz</span>
          <span className="text-sm text-muted-foreground tabular-nums">{clock(audio.durationSeconds)}</span>
        </span>
        <div className="ml-auto flex gap-1">
          <Button variant="ghost" size="icon-touch" onClick={recorder.start} aria-label="Grabar de nuevo">
            <RotateCcw aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon-touch"
            onClick={onRemove}
            aria-label="Quitar audio"
            className="hover:bg-destructive/10 [&_svg]:text-destructive"
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      </div>
      <audio controls src={audio.url} className="h-10 w-full" />
    </section>
  );
}
