"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { BusinessCategory } from "@/features/shared/types/inventory";
import { sessionQueryKey } from "@/features/shared/hooks/useCurrentSession";
import { createBusiness } from "../../onboarding-api";
import { businessSchema, type BusinessValues } from "../types/business-schema";

export function useCreateBusiness() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<BusinessValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: { name: "", category: undefined, categoryOther: "" },
  });

  const category = useWatch({ control: form.control, name: "category" });

  const mutation = useMutation({
    mutationFn: (values: BusinessValues) =>
      createBusiness({
        name: values.name,
        category: values.category as BusinessCategory,
        categoryOther: values.categoryOther,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      toast.success("Tu negocio está listo");
      router.replace("/catalogo");
      router.refresh();
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    form,
    isOther: category === "otro",
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
    isPending: mutation.isPending,
  };
}
