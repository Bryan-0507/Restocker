"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { queryKeys } from "@/features/shared/query-keys";
import { inviteMember } from "../../members-api";
import { inviteSchema, type InviteValues } from "../types/invite-schema";

export function useInviteMember() {
  const queryClient = useQueryClient();

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "base" },
  });

  const mutation = useMutation({
    mutationFn: inviteMember,
    onSuccess: async (_data, values) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.members });
      toast.success("Invitación enviada", { description: `Le llegará un correo a ${values.email}.` });
      form.reset({ email: "", role: values.role });
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    form,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isPending: mutation.isPending,
  };
}
