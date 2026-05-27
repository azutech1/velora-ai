"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { createSiweMessage, SIWE_SESSION_TTL_MS, SIWE_STATEMENT, SIWE_VERSION } from "@/lib/auth/siwe";
import type { AuthUser } from "@/lib/auth/types";

type AuthState = "loading" | "unauthenticated" | "authenticated" | "signing" | "error";

export function useAuth() {
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [state, setState] = useState<AuthState>("loading");
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const payload = (await response.json()) as { user?: AuthUser | null };
      setUser(payload.user ?? null);
      setState(payload.user ? "authenticated" : "unauthenticated");
    } catch {
      setUser(null);
      setState("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const signIn = useCallback(async () => {
    if (!isConnected || !address) {
      setError("Connect a wallet before signing in.");
      setState("error");
      return null;
    }

    setError(null);
    setState("signing");

    try {
      const nonceResponse = await fetch(`/api/auth/nonce?address=${address}`, { cache: "no-store" });
      const noncePayload = (await nonceResponse.json()) as { nonce?: string; error?: string };
      if (!nonceResponse.ok || !noncePayload.nonce) throw new Error(noncePayload.error ?? "Could not create auth nonce.");

      const now = new Date();
      const expiresAt = new Date(now.getTime() + SIWE_SESSION_TTL_MS);
      const message = createSiweMessage({
        domain: window.location.host,
        address,
        statement: SIWE_STATEMENT,
        uri: window.location.origin,
        version: SIWE_VERSION,
        chainId: chainId ?? 1,
        nonce: noncePayload.nonce,
        issuedAt: now.toISOString(),
        expirationTime: expiresAt.toISOString()
      });

      const signature = await signMessageAsync({ message });
      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature })
      });
      const verifyPayload = (await verifyResponse.json()) as { user?: AuthUser; error?: string };
      if (!verifyResponse.ok || !verifyPayload.user) throw new Error(verifyPayload.error ?? "Wallet signature could not be verified.");

      setUser(verifyPayload.user);
      setState("authenticated");
      return verifyPayload.user;
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Wallet authentication failed.";
      setError(message);
      setUser(null);
      setState("error");
      return null;
    }
  }, [address, chainId, isConnected, signMessageAsync]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    setUser(null);
    setState("unauthenticated");
  }, []);

  return useMemo(
    () => ({
      user,
      state,
      error,
      isAuthenticated: state === "authenticated" && Boolean(user),
      signIn,
      logout,
      refreshSession
    }),
    [error, logout, refreshSession, signIn, state, user]
  );
}
