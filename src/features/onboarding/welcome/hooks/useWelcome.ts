"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { sessionQueryKey } from "@/features/shared/hooks/useCurrentSession";
import { completeInvitation } from "../../onboarding-api";
import { welcomeSchema, type WelcomeValues } from "../types/welcome-schema";

export function useWelcome() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<WelcomeValues>({
    resolver: zodResolver(welcomeSchema),
    defaultValues: { fullName: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: completeInvitation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      toast.success("Todo listo, ya eres parte del equipo");
      router.replace("/");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    form,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isPending: mutation.isPending,
  };
}
