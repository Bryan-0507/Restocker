"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signUp } from "../../auth-api";
import { registerSchema, type RegisterValues } from "../types/register-schema";

export function useRegister() {
  const router = useRouter();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: ({ hasSession }) => {
      if (hasSession) {
        router.replace("/onboarding");
        router.refresh();
      }
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    form,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isPending: mutation.isPending,
    // Sin sesión tras registrarse: Supabase pide confirmar el correo.
    needsConfirmation: mutation.isSuccess && !mutation.data.hasSession,
    submittedEmail: form.getValues("email"),
    // Vuelve al formulario para corregir el correo.
    resetSubmission: () => mutation.reset(),
  };
}
