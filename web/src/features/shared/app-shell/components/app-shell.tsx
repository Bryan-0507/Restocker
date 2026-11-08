import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { BottomNav } from "./bottom-nav";
import { PendingCaptureBanner } from "./pending-capture-banner";

// Esqueleto de la app: sidebar en escritorio, barra inferior en móvil.
// No hay barra superior global: cada página trae su PageHeader.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
    
      <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))] lg:px-8 lg:pb-12 lg:pt-10">
        <PendingCaptureBanner />
        {children}
      </main>
    
      <BottomNav />
    </div>
  );
}
