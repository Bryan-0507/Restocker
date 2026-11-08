"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/features/shared/components/form-field";
import { PasswordInput } from "@/features/shared/components/password-input";
import { AuthCard } from "../../shared/components/auth-card";
import { useRegister } from "../hooks/useRegister";
import { CheckEmail } from "./check-email";

export function RegisterForm() {
  const { form, onSubmit, isPending, needsConfirmation, submittedEmail, resetSubmission } = useRegister();
  const { errors } = form.formState;

  if (needsConfirmation) {
    return <CheckEmail email={submittedEmail} onChangeEmail={resetSubmission} />;
  }

  return (
    <AuthCard title="Crea tu cuenta" description="Después configuramos tu negocio en un minuto.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormField id="fullName" label="Nombre completo" error={errors.fullName?.message}>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Andrea López"
            className="h-12 bg-card dark:bg-card"
            aria-invalid={Boolean(errors.fullName)}
            {...form.register("fullName")}
          />
        </FormField>

        <FormField id="email" label="Correo" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@negocio.com"
            className="h-12 bg-card dark:bg-card"
            aria-invalid={Boolean(errors.email)}
            {...form.register("email")}
          />
        </FormField>

        <FormField id="password" label="Contraseña" error={errors.password?.message} hint="Mínimo 8 caracteres.">
          <PasswordInput
            id="password"
            autoComplete="new-password"
            className="h-12 bg-card dark:bg-card"
            aria-invalid={Boolean(errors.password)}
            {...form.register("password")}
          />
        </FormField>

        <Button type="submit" size="touch" disabled={isPending} className="mt-2 h-12 w-full">
          {isPending ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthCard>
  );
}
