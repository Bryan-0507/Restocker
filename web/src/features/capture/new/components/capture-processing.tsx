"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubmitStep } from "../types/capture-draft";
import { LoadingAnimation } from "./loading-animation";

const STEPS: { value: SubmitStep; label: string; title: string; description: string }[] = [
  {
    value: "preparando",
    label: "Preparar",
    title: "Preparando tu captura",
    description: "Ajustamos el tamaño de tus fotos para enviarlas más rápido.",
  },
  {
    value: "subiendo",
    label: "Subir",
    title: "Subiendo tus archivos",
    description: "Depende de tu conexión; suele ser rápido.",
  },
  {
    value: "revisando",
    label: "Revisar",
    title: "Leyendo tu captura",
    description: "Buscamos productos y cantidades en tus fotos, audio y texto.",
  },
];

// No sabemos cuánto va a tardar el modelo: en vez de inventar un progreso, los mensajes cambian
// con el tiempo para que una espera larga no parezca una falla.
const SLOW_AFTER_SECONDS = 15;
const VERY_SLOW_AFTER_SECONDS = 40;

function useSecondsSince(key: string) {
  const [state, setState] = useState({ key, seconds: 0 });

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(
      () => setState({ key, seconds: Math.floor((Date.now() - startedAt) / 1000) }),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [key]);

  // Al cambiar de paso el conteo vuelve a cero sin esperar al siguiente tic.
  return state.key === key ? state.seconds : 0;
}

export function CaptureProcessing({ step }: { step: SubmitStep }) {
  const seconds = useSecondsSince(step);
  const currentIndex = STEPS.findIndex((item) => item.value === step);
  const current = STEPS[currentIndex]!;

  const slowNote =
    step !== "revisando"
      ? null
      : seconds >= VERY_SLOW_AFTER_SECONDS
        ? "Está tardando más de lo normal. No cierres esta pantalla."
        : seconds >= SLOW_AFTER_SECONDS
          ? "Esto a veces tarda un poco más."
          : null;

  return (
    <div className="flex flex-col items-center gap-6 rounded-card bg-card px-6 pb-8 pt-4 text-center">
      <LoadingAnimation className="-mb-4 w-full max-w-64" />

      <div className="flex flex-col gap-2" role="status" aria-live="polite">
        <h2 className="font-heading text-2xl font-bold leading-tight">{current.title}</h2>
        <p className="max-w-sm text-muted-foreground">{slowNote ?? current.description}</p>
      </div>

      <ol className="flex w-full max-w-xs items-start justify-between" aria-label="Pasos del envío">
        {STEPS.map((item, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li key={item.value} className="relative flex flex-1 flex-col items-center gap-1.5">
              {/* Línea hacia el paso anterior, de borde a borde con un respiro: si llega al centro
                  se funde con el círculo (mismo pistacho) y cruza la palomita. */}
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[calc(-50%+1.375rem)] right-[calc(50%+1.375rem)] top-3.5 h-0.5 -translate-y-1/2 rounded-full",
                    index <= currentIndex ? "bg-capture" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  // Un solo acento (pistacho): hecho = relleno con palomita; en curso = con aro.
                  done && "bg-capture text-capture-foreground",
                  active && "bg-capture text-capture-foreground ring-4 ring-capture/40",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : index + 1}
              </span>
              <span className={cn("text-xs", active ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {item.label}
                <span className="sr-only">{done ? ": listo" : active ? ": en curso" : ": pendiente"}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
