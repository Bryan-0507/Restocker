"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Cuadro que se queda fijo si la persona pidió reducir el movimiento: el carrito ya cargado.
const STILL_FRAME = 120;

// Animación "Free Inventory Animation" de LottieFiles (Lottie Simple License). La librería y el
// JSON (~400 KB juntos) se cargan solo cuando aparece la espera, no con el resto de Capturar.
export function LoadingAnimation({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let destroyed = false;
    let animation: { destroy: () => void } | null = null;

    void (async () => {
      const [{ default: lottie }, { default: animationData }] = await Promise.all([
        import("lottie-web/build/player/lottie_light"),
        import("../assets/inventory-loading.json"),
      ]);
      if (destroyed || !containerRef.current) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const instance = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: !reduceMotion,
        animationData,
      });
      if (reduceMotion) instance.goToAndStop(STILL_FRAME, true);
      animation = instance;
    })();

    return () => {
      destroyed = true;
      animation?.destroy();
    };
  }, []);

  return <div ref={containerRef} aria-hidden className={cn("pointer-events-none aspect-square", className)} />;
}
