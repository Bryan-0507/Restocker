"use client";

import type { ReactNode } from "react";
import { useCurrentSession } from "@/features/shared/hooks/useCurrentSession";

// Encabezado de cada página: el negocio como contexto, el título y las acciones de la vista.
export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  const { business } = useCurrentSession();

  return (
    <header className="flex items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-sm font-medium text-muted-foreground lg:hidden">{business.name}</span>
        <h1 className="text-4xl font-extrabold leading-none">{title}</h1>
      </div>
    
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    
    </header>
  );
}
