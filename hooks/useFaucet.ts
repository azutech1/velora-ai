"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useArcNetwork } from "./useArcNetwork";
import { ARC_FAUCET_API_URL, FAUCET_STORAGE_KEY, FAUCET_TOKENS, type FaucetClaim, type FaucetToken } from "@/lib/faucet/tokens";

const DAY_MS = 24 * 60 * 60 * 1000;

type FaucetApiResponse = {
  txHash?: string;
  hash?: string;
  amount?: string;
};

function todayClaims(claims: FaucetClaim[], symbol: string) {
  const now = Date.now();
  return claims.filter((claim) => claim.symbol === symbol && now - new Date(claim.claimedAt).getTime() < DAY_MS);
}

export function useFaucet() {
  const { address, isConnected } = useAccount();
  const { isArc, expectedChain } = useArcNetwork();
  const [claims, setClaims] = useState<FaucetClaim[]>([]);
  const [loadingSymbol, setLoadingSymbol] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(FAUCET_STORAGE_KEY);
    setClaims(raw ? (JSON.parse(raw) as FaucetClaim[]) : []);
  }, []);

  const persistClaims = useCallback((nextClaims: FaucetClaim[]) => {
    setClaims(nextClaims);
    window.localStorage.setItem(FAUCET_STORAGE_KEY, JSON.stringify(nextClaims));
  }, []);

  const getEligibility = useCallback(
    (token: FaucetToken) => {
      if (!isConnected || !address) {
        return { eligible: false, reason: "Connect wallet", remaining: token.dailyLimit, cooldownRemainingMs: 0 };
      }

      if (!isArc) {
        return { eligible: false, reason: `Switch to ${expectedChain.name}`, remaining: token.dailyLimit, cooldownRemainingMs: 0 };
      }

      const tokenClaims = todayClaims(claims, token.symbol);
      const remaining = Math.max(token.dailyLimit - tokenClaims.length, 0);
      if (remaining <= 0) {
        return { eligible: false, reason: "Daily limit reached", remaining, cooldownRemainingMs: 0 };
      }

      const lastClaim = tokenClaims[0];
      if (lastClaim) {
        const elapsed = Date.now() - new Date(lastClaim.claimedAt).getTime();
        const cooldownMs = token.cooldownMinutes * 60 * 1000;
        if (elapsed < cooldownMs) {
          return { eligible: false, reason: "Cooldown active", remaining, cooldownRemainingMs: cooldownMs - elapsed };
        }
      }

      return { eligible: true, reason: "Eligible", remaining, cooldownRemainingMs: 0 };
    },
    [address, claims, expectedChain.name, isArc, isConnected]
  );

  const requestToken = useCallback(
    async (token: FaucetToken) => {
      const eligibility = getEligibility(token);
      if (!eligibility.eligible) {
        setMessage(eligibility.reason);
        throw new Error(eligibility.reason);
      }

      try {
        setLoadingSymbol(token.symbol);
        setMessage(null);

        if (!ARC_FAUCET_API_URL) {
          throw new Error("Open the official faucet to request real testnet assets.");
        }

        const response = await fetch(ARC_FAUCET_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            token: token.symbol,
            amount: token.faucetAmount
          })
        });

        if (!response.ok) {
          throw new Error("Faucet request failed.");
        }

        const payload = (await response.json()) as FaucetApiResponse;
        const hash = payload.txHash ?? payload.hash;
        if (!hash) {
          throw new Error("Faucet did not return a transaction hash.");
        }

        const claim: FaucetClaim = {
          id: `${token.symbol}-${Date.now()}`,
          symbol: token.symbol,
          amount: payload.amount ?? token.faucetAmount,
          hash,
          claimedAt: new Date().toISOString()
        };
        persistClaims([claim, ...claims].slice(0, 20));
        setMessage(`${claim.amount} requested.`);
        return claim;
      } finally {
        setLoadingSymbol(null);
      }
    },
    [address, claims, getEligibility, persistClaims]
  );

  const dailyRemainingClaims = useMemo(
    () => FAUCET_TOKENS.reduce((sum, token) => sum + getEligibility(token).remaining, 0),
    [getEligibility]
  );

  return {
    claims,
    loadingSymbol,
    message,
    isConnected,
    isArc,
    dailyRemainingClaims,
    getEligibility,
    requestToken
  };
}
