"use client";

import { useSyncExternalStore } from "react";

// true si la media query se cumple. En el servidor devuelve false.
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// Mismo corte que la sidebar: desde lg (1024px) es escritorio.
export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)");
}
