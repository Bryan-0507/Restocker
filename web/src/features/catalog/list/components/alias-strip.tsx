"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CatalogAlias } from "../../shared/types/catalog-product";

// Alias en una sola fila. Si no caben, se desvanecen a la derecha y, con mouse, la fila se
// desliza al pasar encima para leerlos. En touch no se anima: un mosaico lleno de chips
// moviéndose distrae y pelea con el scroll de la página.
export function AliasStrip({ aliases }: { aliases: CatalogAlias[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measure = () => setOverflow(Math.max(0, track.scrollWidth - viewport.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    return () => observer.disconnect();
  }, [aliases]);

  return (
    <div
      ref={viewportRef}
      className={cn(
        "relative mt-1 overflow-hidden",
        overflow > 0 && "[mask-image:linear-gradient(to_right,black_75%,transparent)] pointer-fine:group-hover:[mask-image:none]",
      )}
      // Unos 40px por segundo, para que dé tiempo de leer.
      style={{ "--alias-shift": `-${overflow}px`, "--alias-duration": `${Math.max(2, overflow / 40)}s` } as React.CSSProperties}
    >
      <div
        ref={trackRef}
        className={cn(
          "flex w-max gap-1",
          overflow > 0 &&
            "pointer-fine:group-hover:animate-[alias-scroll_var(--alias-duration)_ease-in-out_0.4s_infinite_alternate] motion-reduce:animate-none!",
        )}
      >
        {aliases.map((alias) => (
          <Badge key={alias.id} variant="secondary" className="shrink-0 font-normal">
            {alias.alias}
          </Badge>
        ))}
      </div>
    </div>
  );
}
