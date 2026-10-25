"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

function setDarkTheme(dark: boolean) {
  withoutTransitions(() => document.documentElement.classList.toggle("dark", dark));
  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {
    // Sin almacenamiento disponible: el cambio dura solo esta sesión.
  }
}

// El tema vive en la clase .dark del <html> (la pone themeScript antes de pintar).
// Se observa esa clase para que el botón del menú y el switch de Ajustes no se desfasen.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export function useIsDarkTheme() {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useIsDarkTheme();

  return (
    <Button
      variant="ghost"
      size="icon-touch"
      onClick={() => setDarkTheme(!isDark)}
      aria-label="Cambiar entre modo claro y oscuro"
      className={cn("bg-card", className)}
    >
      <Moon className="dark:hidden" aria-hidden />
      <Sun className="hidden dark:block" aria-hidden />
    </Button>
  );
}

// Variante con estado visible para Ajustes: deja claro si el modo oscuro está activo.
export function ThemeSwitch({ id }: { id: string }) {
  const isDark = useIsDarkTheme();
  return <Switch id={id} checked={isDark} onCheckedChange={setDarkTheme} />;
}
