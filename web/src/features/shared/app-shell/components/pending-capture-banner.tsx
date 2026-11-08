"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { queryKeys } from "@/features/shared/query-keys";
import { createClient } from "@/lib/supabase/client";

async function getPendingCapture() {
  const { data, error } = await createClient()
    .from("captures")
    .select("id, capture_items(count)")
    .eq("status", "en_revision")
    .maybeSingle();

  if (error) throw new Error("No pudimos revisar si hay capturas pendientes.");
  return data ? { id: data.id, proposals: data.capture_items[0]?.count ?? 0 } : null;
}

// Aviso en toda la app mientras haya una captura por revisar (Revisión, punto 1). En Capturar no
// hace falta: ahí ya está la revisión.
export function PendingCaptureBanner() {
  const pathname = usePathname();
  const { data: pending } = useQuery({
    // Bajo la llave de Capturar: enviar o cerrar una revisión lo refresca.
    queryKey: [...queryKeys.capture, "pending"],
    queryFn: getPendingCapture,
    staleTime: 30 * 1000,
  });

  if (!pending || pathname.startsWith("/capturar")) return null;

  return (
    <Link
      href="/capturar"
      className="mb-5 flex items-center justify-between gap-3 rounded-card bg-review-surface p-4 transition-opacity hover:opacity-90"
    >
      <div className="flex flex-col">
        <span className="font-heading text-lg font-bold">Tienes una captura por revisar</span>
        <span className="text-sm text-muted-foreground">
          {pending.proposals === 1 ? "1 cambio sin confirmar" : `${pending.proposals} cambios sin confirmar`}
        </span>
      </div>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-status-review text-status-review-foreground">
        <ArrowRight className="size-5" aria-hidden />
      </span>
    </Link>
  );
}
