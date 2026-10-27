"use client";

import { useRef, type ReactNode } from "react";
import { Camera, Check, Keyboard, Mic, Plus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { MAX_PHOTOS, MAX_TEXT_LENGTH, type useCaptureBox } from "../hooks/useCaptureBox";
import { AudioPanel } from "./audio-panel";

type CaptureBoxState = ReturnType<typeof useCaptureBox>;

// Armar la captura: hasta 10 fotos, una nota de voz y un texto, en cualquier combinación.
export function CaptureComposer({ capture }: { capture: CaptureBoxState }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorder = useAudioRecorder({ onRecorded: capture.setAudio });
  const busy = recorder.isRecording;

  const pickPhotos = () => fileInputRef.current?.click();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground">¿Qué entró, se usó o se perdió? Cuéntalo con fotos, un audio o un texto.</p>

      <div className="grid grid-cols-3 gap-3">
        <InputTile
          label="Foto"
          icon={<Camera className="size-6" aria-hidden />}
          hint={capture.photos.length > 0 ? String(capture.photos.length) : undefined}
          active={capture.photos.length > 0}
          disabled={busy || capture.photosLeft === 0}
          onClick={pickPhotos}
        />
        <InputTile
          label="Audio"
          icon={<Mic className="size-6" aria-hidden />}
          active={capture.audio !== null || recorder.isRecording}
          disabled={busy || capture.audio !== null}
          onClick={recorder.start}
        />
        <InputTile
          label="Texto"
          icon={<Keyboard className="size-6" aria-hidden />}
          active={capture.isTextOpen}
          disabled={busy || capture.isTextOpen}
          onClick={capture.openText}
        />
      </div>

      {/* Sin capture: el celular ofrece cámara o galería en el mismo selector. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          capture.addPhotos(event.target.files);
          event.target.value = "";
        }}
      />

      {capture.photos.length > 0 && (
        <section aria-label="Fotos" className="flex flex-col gap-3 rounded-card bg-card p-4">
          <span className="text-sm font-medium text-muted-foreground">
            Fotos · {capture.photos.length} de {MAX_PHOTOS}
          </span>
          {/* pt/pr dejan lugar al botón de quitar, que sobresale de la miniatura. */}
          <ul className="-mt-2 flex gap-3 overflow-x-auto pb-1 pr-2 pt-2 [scrollbar-width:thin]">
            {capture.photos.map((photo, index) => (
              <li key={photo.id} className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) */}
                <img
                  src={photo.previewUrl}
                  alt={`Foto ${index + 1}`}
                  className="size-24 rounded-2xl object-cover ring-1 ring-border"
                />
                <button
                  type="button"
                  onClick={() => capture.removePhoto(photo.id)}
                  aria-label={`Quitar foto ${index + 1}`}
                  className="absolute -right-2 -top-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-foreground text-background shadow-md transition-transform before:absolute before:-inset-1.5 hover:scale-105 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <X className="size-4" strokeWidth={3} aria-hidden />
                </button>
              </li>
            ))}
            {capture.photosLeft > 0 && (
              <li className="shrink-0">
                <button
                  type="button"
                  onClick={pickPhotos}
                  className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus className="size-5" aria-hidden />
                  Agregar
                </button>
              </li>
            )}
          </ul>
        </section>
      )}

      <AudioPanel recorder={recorder} audio={capture.audio} onRemove={() => capture.setAudio(null)} />

      {capture.isTextOpen && (
        <section aria-label="Texto" className="flex flex-col gap-2 rounded-card bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="capture-text" className="text-sm font-medium text-muted-foreground">
              ¿Qué pasó?
            </label>
            <Button variant="ghost" size="sm" onClick={capture.closeText} className="text-muted-foreground">
              Quitar texto
            </Button>
          </div>
          <textarea
            id="capture-text"
            autoFocus
            value={capture.text}
            onChange={(event) => capture.setText(event.target.value)}
            maxLength={MAX_TEXT_LENGTH}
            rows={4}
            placeholder="Ej.: compramos 2 libras de mochiko y se arruinó media libra de fresa"
            className="field-sizing-content min-h-28 w-full resize-none rounded-2xl bg-background px-4 py-3 text-base outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {capture.text.length > MAX_TEXT_LENGTH * 0.8 && (
            <span className="self-end text-xs text-muted-foreground tabular-nums">
              {capture.text.length.toLocaleString("es-GT")} / {MAX_TEXT_LENGTH.toLocaleString("es-GT")}
            </span>
          )}
        </section>
      )}

      {/* Pegado arriba de la barra inferior en móvil: enviar siempre queda a la mano. */}
      <div className="sticky bottom-24 z-10 -mx-1 flex flex-col gap-2 px-1 pt-2 lg:bottom-6">
        <Button
          variant="capture"
          size="touch"
          onClick={capture.submit}
          disabled={!capture.canSubmit || busy}
          // Desactivado en gris: el pistacho a media opacidad se veía deslavado, no inactivo.
          className="h-14 w-full text-lg font-semibold shadow-lg disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none"
        >
          <Send aria-hidden />
          Enviar captura
        </Button>
        {!capture.hasDraft && (
          <p className="text-center text-sm text-muted-foreground">Agrega al menos una foto, un audio o un texto.</p>
        )}
      </div>
    </div>
  );
}

function InputTile({
  label,
  icon,
  hint,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  hint?: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-card bg-card text-base font-medium transition-[translate,box-shadow,opacity]",
        "hover:-translate-y-0.5 hover:shadow-md hover:ring-2 hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hover:translate-y-0",
        "disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:ring-0",
        active && "ring-2 ring-primary",
        disabled && !active && "opacity-50",
      )}
    >
      {/* El pistacho es el color de Capturar: el mismo del botón de la barra inferior. */}
      <span className="flex size-12 items-center justify-center rounded-2xl bg-capture text-capture-foreground">{icon}</span>
      {label}
      {active && (
        <span className="absolute right-2.5 top-2.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
          {hint ?? <Check className="size-3.5" strokeWidth={3} aria-hidden />}
        </span>
      )}
    </button>
  );
}
