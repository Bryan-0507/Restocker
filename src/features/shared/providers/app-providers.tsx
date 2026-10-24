"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* Abajo al centro, por encima de la barra inferior (y su botón de Capturar) en móvil y tablet.
          En escritorio, globals.css lo baja a 1.5rem y lo centra sobre el contenido. */}
      <Toaster
        position="bottom-center"
        offset={{ bottom: "calc(7.5rem + env(safe-area-inset-bottom))" }}
        mobileOffset={{ bottom: "calc(7.5rem + env(safe-area-inset-bottom))" }}
      />
    </QueryClientProvider>
  );
}
