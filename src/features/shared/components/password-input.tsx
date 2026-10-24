"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Input de contraseña con botón para mostrarla u ocultarla.
export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-12", className)} />

      <Button
        type="button"
        variant="ghost"
        size="icon-touch"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        // Centrado sin translate: el Button aplica translate-y-px al presionar y lo haría saltar.
        className="absolute inset-y-0 right-0.5 my-auto text-muted-foreground active:not-aria-[haspopup]:translate-y-0"
      >
        <Icon aria-hidden />
      </Button>
    </div>
  );
}
