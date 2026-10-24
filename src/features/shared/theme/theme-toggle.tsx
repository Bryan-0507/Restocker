"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Apaga las transiciones mientras cambia el tema para que todo cambie en el mismo
// cuadro; si no, los elementos con transition-colors llegan tarde y se ven desfasados.
function withoutTransitions(change: () => void) {
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  change();
  // Forzar el recálculo de estilos antes de volver a habilitar las transiciones.
  void window.getComputedStyle(document.body).opacity;
  // setTimeout y no requestAnimationFrame: rAF no corre con la pestaña en segundo plano.
  setTimeout(() => style.remove(), 1);
}

export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    let dark = false;
    withoutTransitions(() => {
      dark = document.documentElement.classList.toggle("dark");
    });
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // Sin almacenamiento disponible: el cambio dura solo esta sesión.
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-touch"
      onClick={toggle}
      aria-label="Cambiar entre modo claro y oscuro"
      className={cn("bg-card", className)}
    >
      <Moon className="dark:hidden" aria-hidden />
      <Sun className="hidden dark:block" aria-hidden />
    </Button>
  );
}
