"use client";

import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/features/shared/components/page-header";
import { StockStatusBadge } from "@/features/shared/components/stock-status-badge";
import { useInventoryList } from "../hooks/useInventoryList";
import { SummaryTile } from "./summary-tile";

export function InventoryList() {
  const { items, toBuy, counts, pendingCapture } = useInventoryList();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Inventario" />

      <Link
        href="/capturar"
        className="flex items-center justify-between gap-3 rounded-card bg-review-surface p-4 transition-opacity hover:opacity-90"
      >
        <div className="flex flex-col">
          <span className="font-heading text-lg font-bold">Tienes una captura por revisar</span>
          <span className="text-sm text-muted-foreground">
            {pendingCapture.proposals} cambios sin confirmar · {pendingCapture.time}
          </span>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-status-review text-status-review-foreground">
          <ArrowRight className="size-5" aria-hidden />
        </span>
      </Link>

      <section aria-label="Resumen" className="grid grid-cols-3 gap-3">
        <SummaryTile value={counts.ok} label="al día" className="bg-card text-status-ok-foreground" />
        <SummaryTile value={counts.low} label="stock bajo" className="bg-status-low text-status-low-foreground" />
        <SummaryTile value={counts.out} label="agotado" className="bg-status-out text-status-out-foreground" />
      </section>

      {toBuy.length > 0 && (
        <div className="flex items-center gap-3 rounded-card bg-card p-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <ShoppingCart className="size-5" aria-hidden />
          </span>
          <p className="text-sm">
            <span className="font-medium">Hay que comprar {toBuy.length} insumos: </span>
            <span className="text-muted-foreground">{toBuy.map((item) => item.name).join(", ")}.</span>
          </p>
        </div>
      )}

      <section aria-label="Productos" className="flex flex-col gap-2">
        <div className="flex justify-between px-1 text-xs text-muted-foreground">
          <span>Insumo</span>
          <span>Stock / mínimo</span>
        </div>
        <ul className="grid gap-2 md:grid-cols-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 rounded-card bg-card px-4 py-3.5">
              <div className="flex min-w-0 flex-col items-start gap-1">
                <span className="truncate font-heading text-lg font-bold leading-tight">{item.name}</span>
                {item.status !== "ok" && <StockStatusBadge status={item.status} />}
              </div>
              <span className="shrink-0 font-medium">
                {item.stock} / {item.minimum} {item.unit}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
