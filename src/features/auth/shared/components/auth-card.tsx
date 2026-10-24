import type { ReactNode } from "react";
import { BrandPanel } from "./brand-panel";

// Pantallas sin sesión: en escritorio, panel de marca a la izquierda y formulario a la derecha;
// en móvil, solo el formulario a todo el ancho.
export function AuthCard({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <BrandPanel />

      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="flex w-full max-w-md flex-col gap-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary font-heading text-xl font-bold text-primary-foreground">
              R
            </span>
            <span className="font-heading text-2xl font-bold">Restocker</span>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold leading-tight">{title}</h1>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}
