"use client";

import { useMemo } from "react";
import { useAuthContext } from "@/providers/AuthProvider";

export function useUser() {
  const auth = useAuthContext();

  return useMemo(
    () => ({
      user: auth.user,
      walletAddress: auth.user?.walletAddress ?? null,
      isAuthenticated: auth.isAuthenticated,
      loading: auth.state === "loading" || auth.state === "signing",
      error: auth.error
    }),
    [auth.error, auth.isAuthenticated, auth.state, auth.user]
  );
}
