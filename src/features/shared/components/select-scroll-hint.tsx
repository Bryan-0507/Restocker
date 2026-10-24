"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Indicador de "hay más opciones" para un SelectContent con scroll: desvanecido con blur
// y una flecha que baja la lista. Desaparece al llegar al final.
export function SelectScrollHint() {
  const ref = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const container = ref.current?.closest<HTMLElement>("[data-slot=select-content]");
    if (!container) return;

    const update = () => setAtEnd(container.scrollTop + container.clientHeight >= container.scrollHeight - 2);
    const frame = requestAnimationFrame(update);
    container.addEventListener("scroll", update, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("scroll", update);
    };
  }, []);

  function scrollDown() {
    ref.current?.closest<HTMLElement>("[data-slot=select-content]")?.scrollBy({ top: 88, behavior: "smooth" });
  }

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none sticky bottom-0 -mt-12 flex h-12 items-end justify-center pb-1 transition-opacity duration-200",
        atEnd && "opacity-0",
      )}
    >
      <div className="absolute inset-0 bg-linear-to-t from-popover via-popover/80 to-transparent backdrop-blur-[2px] mask-[linear-gradient(to_top,black_40%,transparent)]" />

      <span
        onClick={scrollDown}
        className={cn(
          "relative flex size-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-sm motion-safe:animate-bounce",
          !atEnd && "pointer-events-auto cursor-pointer",
        )}
      >
        <ChevronDown className="size-4" />
      </span>
    </div>
  );
}
