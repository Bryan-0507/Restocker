"use client";

import { Send } from "lucide-react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/features/shared/components/form-field";
import { ROLE_OPTIONS } from "../../shared/role-labels";
import { useInviteMember } from "../hooks/useInviteMember";

export function InviteForm() {
  const { form, onSubmit, isPending } = useInviteMember();
  const { errors } = form.formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-card bg-card p-4">
      <h2 className="text-xl font-bold">Invitar a alguien</h2>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <FormField id="invite-email" label="Correo" error={errors.email?.message}>
          <Input
            id="invite-email"
            type="email"
            autoComplete="off"
            placeholder="adriana@negocio.com"
            className="h-12 bg-background dark:bg-background"
            aria-invalid={Boolean(errors.email)}
            {...form.register("email")}
          />
        </FormField>

        <FormField id="invite-role" label="Rol">
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <Select items={ROLE_OPTIONS} value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="invite-role"
                  className="w-full cursor-pointer bg-background text-base data-[size=default]:h-12 dark:bg-background md:text-sm"
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent alignItemWithTrigger={false} sideOffset={6}>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="min-h-11 cursor-pointer text-base md:text-sm"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

      <Button type="submit" size="touch" disabled={isPending} className="h-12 sm:self-start">
        <Send aria-hidden />
        {isPending ? "Enviando…" : "Enviar invitación"}
      </Button>
    </form>
  );
}
