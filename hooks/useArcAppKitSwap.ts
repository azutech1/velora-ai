"use client";

import { useCallback, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { hasCircleAppKitKey, isArcAppKitSwapPair, type ArcAppKitSwapToken } from "@/lib/appkit/config";
import { estimateArcAppKitSwap, executeArcAppKitSwap, type ArcAppKitSwapEstimate, type ArcAppKitSwapResult, type Eip1193Provider } from "@/lib/appkit/swap";
import { useArcNetwork } from "./useArcNetwork";

export type AppKitSwapState = "idle" | "estimating" | "ready" | "swapping" | "success" | "error";

function isEip1193Provider(provider: unknown): provider is Eip1193Provider {
  return Boolean(provider && typeof (provider as { request?: unknown }).request === "function");
}

export function useArcAppKitSwap() {
  const { address, connector, isConnected } = useAccount();
  const { isArc } = useArcNetwork();
  const [state, setState] = useState<AppKitSwapState>("idle");
  const [estimate, setEstimate] = useState<ArcAppKitSwapEstimate | null>(null);
  const [result, setResult] = useState<ArcAppKitSwapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canUseRealSwap = useCallback(
    (tokenIn: string, tokenOut: string) => hasCircleAppKitKey() && isConnected && isArc && isArcAppKitSwapPair(tokenIn, tokenOut),
    [isArc, isConnected]
  );

  const estimateSwap = useCallback(async (tokenIn: string, tokenOut: string, amountIn: string, slippageBps: number) => {
    setError(null);
    setResult(null);

    if (!canUseRealSwap(tokenIn, tokenOut)) {
      throw new Error("Real App Kit swap is available only on Arc Testnet for USDC, EURC, and cirBTC with a connected wallet.");
    }

    setState("estimating");
    try {
      const provider = await connector?.getProvider();
      const nextEstimate = await estimateArcAppKitSwap({
        tokenIn: tokenIn as ArcAppKitSwapToken,
        tokenOut: tokenOut as ArcAppKitSwapToken,
        amountIn,
        slippageBps,
        walletAddress: address,
        provider: isEip1193Provider(provider) ? provider : undefined
      });
      setEstimate(nextEstimate);
      setState("ready");
      return nextEstimate;
    } catch (err) {
      const reason = err instanceof Error ? err.message : "App Kit swap estimate failed.";
      setError(reason);
      setState("error");
      throw err;
    }
  }, [address, canUseRealSwap, connector]);

  const executeSwap = useCallback(async (tokenIn: string, tokenOut: string, amountIn: string, slippageBps: number) => {
    setError(null);
    if (!canUseRealSwap(tokenIn, tokenOut)) {
      throw new Error("Real App Kit swap is available only on Arc Testnet for USDC, EURC, and cirBTC with a connected wallet.");
    }

    setState("swapping");
    try {
      const provider = await connector?.getProvider();
      const nextResult = await executeArcAppKitSwap({
        tokenIn: tokenIn as ArcAppKitSwapToken,
        tokenOut: tokenOut as ArcAppKitSwapToken,
        amountIn,
        slippageBps,
        provider: isEip1193Provider(provider) ? provider : undefined
      });
      setResult(nextResult);
      setState("success");
      return nextResult;
    } catch (err) {
      const reason = err instanceof Error ? err.message : "App Kit swap failed.";
      setError(reason);
      setState("error");
      throw err;
    }
  }, [canUseRealSwap, connector]);

  return useMemo(
    () => ({
      state,
      estimate,
      result,
      error,
      canUseRealSwap,
      estimateSwap,
      executeSwap,
      hasKitKey: hasCircleAppKitKey(),
      isConnected,
      isArc
    }),
    [canUseRealSwap, error, estimate, estimateSwap, executeSwap, isArc, isConnected, result, state]
  );
}
