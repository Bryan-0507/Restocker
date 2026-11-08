"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentSession } from "@/features/shared/session/session-api";

export const sessionQueryKey = ["session", "current"] as const;

export function useCurrentSession() {
  const { data, isLoading, error } = useQuery({
    queryKey: sessionQueryKey,
    queryFn: getCurrentSession,
    staleTime: 5 * 60 * 1000,
  });

  return {
    session: data,
    isLoading,
    error,
    isAdmin: data?.role === "admin",
  };
}
