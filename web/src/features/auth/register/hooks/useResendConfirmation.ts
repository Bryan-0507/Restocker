"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { resendConfirmation } from "../../auth-api";

const COOLDOWN_SECONDS = 60;

export function useResendConfirmation(email: string) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const mutation = useMutation({
    mutationFn: () => resendConfirmation(email),
    onSuccess: () => {
      toast.success("Te enviamos otro correo");
      setSecondsLeft(COOLDOWN_SECONDS);
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    resend: () => mutation.mutate(),
    isResending: mutation.isPending,
    secondsLeft,
    canResend: !mutation.isPending && secondsLeft === 0,
  };
}
