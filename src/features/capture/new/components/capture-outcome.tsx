"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Camera, CloudOff, Keyboard, Mic, PackagePlus, RotateCw, SearchX } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RejectedEntry } from "../hooks/useCaptureBox";

const INPUT_ICON = { foto: Camera, audio: Mic, texto: Keyboard } as const;

// Tarjeta de resultado: siempre sobre la tarjeta blanca y con el color solo en el ícono, para
// no sumar fondos de colores a una pantalla que ya trae un mensaje.
function OutcomeCard({
  icon,
  tone = "neutral",
  title,
  children,
  actions,
}: {
  icon: ReactNode;
  tone?: "neutral" | "review" | "error";
  title: string;
  children: ReactNode;
  actions: ReactNode;
}) {
  return (
    // Mismo ancho y borde izquierdo que el título y la caja de captura.
    <div className="flex w-full flex-col gap-5 rounded-card bg-card p-6">
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-2xl",
          tone === "review" && "bg-review-surface text-status-review-foreground dark:text-status-review",
          tone === "error" && "bg-destructive/10 text-destructive",
          tone === "neutral" && "bg-secondary text-secondary-foreground",
        )}
      >
        {icon}
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-bold leading-tight">{title}</h2>
        {children}
      </div>
      {/* Principal a todo lo ancho y la alternativa debajo, como el resumen de la revisión. El
          orden del código es el visual, así Tab recorre los botones como se leen. */}
      <div className="flex flex-col gap-2">{actions}</div>
    </div>
  );
}

// El modelo no encontró movimientos: su mensaje dice qué llegó y qué mandar en su lugar, y
// abajo va el motivo de cada entrada.
export function CaptureRejected({
  message,
  entries,
  onEdit,
  onStartOver,
}: {
  message: string;
  entries: RejectedEntry[];
  onEdit: () => void;
  onStartOver: () => void;
}) {
  return (
    <OutcomeCard
      icon={<SearchX className="size-6" aria-hidden />}
      tone="review"
      title="No encontramos qué registrar"
      actions={
        <>
          <Button size="touch" onClick={onEdit} className="h-12">
            Corregir y reintentar
          </Button>
          <Button variant="outline" size="touch" onClick={onStartOver} className="h-12 bg-card dark:bg-card">
            Empezar de nuevo
          </Button>
        </>
      }
    >
      <p role="alert" className="text-muted-foreground">
        {message}
      </p>
      {entries.length > 1 && (
        <ul className="mt-2 flex flex-col divide-y border-y text-sm">
          {entries.map((entry) => {
            const Icon = INPUT_ICON[entry.type];
            return (
              <li key={entry.id} className="flex gap-3 py-3">
                <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  <span className="font-medium">{entry.label}.</span>{" "}
                  <span className="text-muted-foreground">{entry.reason}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </OutcomeCard>
  );
}

// Falla técnica o tope diario. Lo cargado sigue en el navegador para reintentar.
export function CaptureError({
  message,
  canRetry,
  onRetry,
  onBack,
}: {
  message: string;
  canRetry: boolean;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <OutcomeCard
      icon={<CloudOff className="size-6" aria-hidden />}
      tone="error"
      title={canRetry ? "No se pudo leer tu captura" : "Por hoy es todo"}
      actions={
        canRetry ? (
          <>
            <Button size="touch" onClick={onRetry} className="h-12">
              <RotateCw aria-hidden />
              Reintentar
            </Button>
            <Button variant="outline" size="touch" onClick={onBack} className="h-12 bg-card dark:bg-card">
              Ver lo que cargué
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="touch" onClick={onBack} className="h-12">
            Volver
          </Button>
        )
      }
    >
      <p role="alert" className="text-muted-foreground">
        {message}
      </p>
      {canRetry && <p className="text-sm text-muted-foreground">Tus fotos, audio y texto siguen aquí.</p>}
    </OutcomeCard>
  );
}

// Sin productos no hay con qué emparejar: primero el catálogo (punto 7).
export function CaptureCatalogEmpty() {
  return (
    <OutcomeCard
      icon={<PackagePlus className="size-6" aria-hidden />}
      title="Primero arma tu catálogo"
      actions={
        <Link href="/catalogo" className={cn(buttonVariants({ size: "touch" }), "h-12")}>
          Ir al catálogo
        </Link>
      }
    >
      <p className="text-muted-foreground">
        Para reconocer lo que entra y sale hace falta saber qué productos manejas. Agrega al menos uno y vuelve aquí.
      </p>
    </OutcomeCard>
  );
}
