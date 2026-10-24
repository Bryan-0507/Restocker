"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/features/auth/shared/components/auth-card";
import { FormField } from "@/features/shared/components/form-field";
import { PasswordInput } from "@/features/shared/components/password-input";
import { useWelcome } from "../hooks/useWelcome";

// Pantalla para quien llega por invitación: ya tiene cuenta y negocio, le falta nombre y contraseña.
export function WelcomeForm({ businessName }: { businessName: string }) {
  const { form, onSubmit, isPending } = useWelcome();
  const { errors } = form.formState;

  return (
    <AuthCard
      title="Te damos la bienvenida"
      description={
        <>
          Te invitaron a <span className="font-medium text-foreground">{businessName}</span>. Completa tu cuenta para
          entrar.
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormField id="fullName" label="Nombre completo" error={errors.fullName?.message}>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Adriana López"
            className="h-12 bg-card dark:bg-card"
            aria-invalid={Boolean(errors.fullName)}
            {...form.register("fullName")}
          />
        </FormField>

        <FormField id="password" label="Crea tu contraseña" error={errors.password?.message} hint="Mínimo 8 caracteres.">
          <PasswordInput
            id="password"
            autoComplete="new-password"
            className="h-12 bg-card dark:bg-card"
            aria-invalid={Boolean(errors.password)}
            {...form.register("password")}
          />
        </FormField>

        <Button type="submit" size="touch" disabled={isPending} className="mt-2 h-12 w-full">
          {isPending ? "Guardando…" : "Entrar al negocio"}
        </Button>
      </form>
    </AuthCard>
  );
}
