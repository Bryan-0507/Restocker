"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// Toaster de shadcn adaptado a Restocker (tema Fresco).
// Los colores salen de los tokens de globals.css, así que siguen el modo claro/oscuro de la
// clase .dark sin depender de next-themes.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5 text-primary" />,
        info: <InfoIcon className="size-5 text-primary" />,
        warning: <TriangleAlertIcon className="size-5 text-status-low-foreground" />,
        error: <OctagonXIcon className="size-5 text-destructive" />,
        loading: <Loader2Icon className="size-5 animate-spin text-muted-foreground" />,
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-card)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast gap-3 !rounded-card !border !px-4 !py-3.5 font-sans !shadow-lg",
          title: "!text-[0.95rem] !font-medium",
          description: "!text-sm !text-muted-foreground",
          actionButton:
            "!h-9 !rounded-full !bg-primary !px-4 !text-sm !font-medium !text-primary-foreground",
          cancelButton: "!h-9 !rounded-full !bg-muted !px-4 !text-sm !text-foreground",
          closeButton: "!border-border !bg-card !text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
