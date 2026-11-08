"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/features/shared/components/form-field";
import { PasswordInput } from "@/features/shared/components/password-input";
import { AuthCard } from "../../shared/components/auth-card";
import { useLogin } from "../hooks/useLogin";

export function LoginForm() {
  const { form, onSubmit, isPending } = useLogin();
  const { errors } = form.formState;

  return (
    <AuthCard title="Inicia sesión" description="Entra para ver y actualizar el inventario de tu negocio.">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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

        <FormField id="password" label="Contraseña" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            className="h-12 bg-card dark:bg-card"
            aria-invalid={Boolean(errors.password)}
            {...form.register("password")}
          />
        </FormField>

        <Button type="submit" size="touch" disabled={isPending} className="mt-2 h-12 w-full">
          {isPending ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-primary hover:underline">
          Crea una
        </Link>
      </p>
    </AuthCard>
  );
}
