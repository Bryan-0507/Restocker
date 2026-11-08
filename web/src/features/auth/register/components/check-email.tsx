"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuthCard } from "../../shared/components/auth-card";
import { useResendConfirmation } from "../hooks/useResendConfirmation";

const steps = [
  { title: "Abre el correo de Restocker", detail: "Si no aparece, revisa spam o promociones." },
  { title: "Toca “Confirmar correo”", detail: "El enlace activa tu cuenta." },
  { title: "Inicia sesión", detail: "Después configuras tu negocio en un minuto." },
];

// Confirmación tras registrarse: explica qué sigue y ofrece reenviar o corregir el correo.
export function CheckEmail({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const { resend, isResending, secondsLeft, canResend } = useResendConfirmation(email);

  return (
    <AuthCard
      title="Revisa tu correo"
      description={
        <>
          Enviamos un enlace de confirmación a <span className="font-medium text-foreground">{email}</span>.
        </>
      }
    >
      <div className="flex flex-col gap-8">
        <ol className="flex flex-col gap-5">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full font-heading text-lg font-bold",
                  index === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                )}
              >
                {index === 0 ? <MailCheck className="size-5" aria-hidden /> : index + 1}
              </span>

              <div className="flex flex-col pt-1.5">
                <span className="font-medium">{step.title}</span>
                <span className="text-sm text-muted-foreground">{step.detail}</span>
              </div>
            </li>
          ))}
        </ol>

        <Link href="/login" className={cn(buttonVariants({ size: "touch" }), "h-12 w-full")}>
          Ir a iniciar sesión
        </Link>

        <div className="flex flex-col items-start gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-1 text-muted-foreground">
            ¿No te llegó?
            <Button
              variant="link"
              onClick={resend}
              disabled={!canResend}
              className="h-11 px-1 text-sm font-medium"
            >
              {isResending ? "Enviando…" : secondsLeft > 0 ? `Reenviar en ${secondsLeft} s` : "Reenviar correo"}
            </Button>
          </span>

          <Button variant="link" onClick={onChangeEmail} className="h-11 px-0 text-sm font-medium">
            Usar otro correo
          </Button>
        </div>
      </div>
    </AuthCard>
  );
}
