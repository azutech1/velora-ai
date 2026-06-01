"use client";

import { useCallback, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { getArcAppKitUnsupportedReason, hasCircleAppKitKey, isArcAppKitSwapPair, type ArcAppKitSwapToken } from "@/lib/appkit/config";
import { estimateArcAppKitSwap, executeArcAppKitSwap, type ArcAppKitSwapEstimate, type ArcAppKitSwapResult, type Eip1193Provider } from "@/lib/appkit/swap";
import { ARC_EXPLORER_URL } from "@/lib/web3/chains";
import { useArcNetwork } from "./useArcNetwork";

export type AppKitSwapState = "idle" | "estimating" | "ready" | "swapping" | "success" | "error";

function isEip1193Provider(provider: unknown): provider is Eip1193Provider {
  return Boolean(provider && typeof (provider as { request?: unknown }).request === "function");
}

export function useArcAppKitSwap() {
  const { address, chainId, connector, isConnected } = useAccount();
  const { isArc } = useArcNetwork();
  const [state, setState] = useState<AppKitSwapState>("idle");
  const [estimate, setEstimate] = useState<ArcAppKitSwapEstimate | null>(null);
  const [result, setResult] = useState<ArcAppKitSwapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canUseRealSwap = useCallback(
    (tokenIn: string, tokenOut: string) => hasCircleAppKitKey() && isConnected && isArc && isArcAppKitSwapPair(tokenIn, tokenOut),
    [isArc, isConnected]
  );

  const getUnsupportedReason = useCallback(
    (tokenIn: string, tokenOut: string) => {
      if (!hasCircleAppKitKey()) return "Demo pricing only. Add a Circle App Kit key to enable supported Arc Testnet swaps.";
      if (!isConnected) return "Connect a wallet to request real Circle App Kit quotes.";
      if (!isArc) return "Switch to Arc Testnet to request real Circle App Kit quotes.";
      return getArcAppKitUnsupportedReason(tokenIn, tokenOut);
    },
    [isArc, isConnected]
  );

  const estimateSwap = useCallback(async (tokenIn: string, tokenOut: string, amountIn: string, slippageBps: number) => {
    setError(null);
    setResult(null);
    setEstimate(null);

    if (!canUseRealSwap(tokenIn, tokenOut)) {
      const reason = getUnsupportedReason(tokenIn, tokenOut);
      console.warn("[Velora AppKit Swap] Real swap unavailable", {
        tokenIn,
        tokenOut,
        hasKitKey: hasCircleAppKitKey(),
        isConnected,
        isArc,
        reason,
        chainId
      });
      throw new Error(reason ?? "Real App Kit swap is available only on Arc Testnet for supported App Kit pairs with a connected wallet.");
    }

    setState("estimating");
    try {
      const provider = await connector?.getProvider();
      console.info("[Velora AppKit Swap] Estimate flow provider state", {
        tokenIn,
        tokenOut,
        amountIn,
        slippageBps,
        walletAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
        chainId,
        connectorName: connector?.name,
        hasProvider: Boolean(provider),
        isEip1193Provider: isEip1193Provider(provider)
      });
      const nextEstimate = await estimateArcAppKitSwap({
        tokenIn: tokenIn as ArcAppKitSwapToken,
        tokenOut: tokenOut as ArcAppKitSwapToken,
        amountIn,
        slippageBps,
        walletAddress: address,
        provider: isEip1193Provider(provider) ? provider : undefined
      });
      console.info("[Velora AppKit Swap] Estimate flow completed", {
        tokenIn,
        tokenOut,
        estimatedOutput: nextEstimate.estimatedOutput,
        diagnostics: nextEstimate.diagnostics
      });
      setEstimate(nextEstimate);
      setState("ready");
      return nextEstimate;
    } catch (err) {
      const reason = err instanceof Error ? err.message : "App Kit swap estimate failed.";
      console.error("[Velora AppKit Swap] Estimate flow failed", {
        tokenIn,
        tokenOut,
        amountIn,
        slippageBps,
        reason
      });
      setError(reason);
      setState("error");
      throw err;
    }
  }, [address, canUseRealSwap, chainId, connector, getUnsupportedReason, isArc, isConnected]);

  const executeSwap = useCallback(async (tokenIn: string, tokenOut: string, amountIn: string, slippageBps: number, preparedEstimate?: ArcAppKitSwapEstimate) => {
    setError(null);
    if (!canUseRealSwap(tokenIn, tokenOut)) {
      throw new Error(getUnsupportedReason(tokenIn, tokenOut) ?? "Real App Kit swap is available only on Arc Testnet for supported App Kit pairs with a connected wallet.");
    }

    const activeEstimate = preparedEstimate ?? estimate;

    if (!activeEstimate?.estimatedOutput) {
      throw new Error("Request a fresh Circle App Kit quote before executing a real swap.");
    }

    if (
      activeEstimate.diagnostics?.tokenIn !== tokenIn ||
      activeEstimate.diagnostics?.tokenOut !== tokenOut ||
      activeEstimate.diagnostics?.amountIn !== amountIn
    ) {
      setEstimate(null);
      throw new Error("The selected swap no longer matches the latest quote. Request a fresh quote before executing.");
    }

    if (activeEstimate.diagnostics?.expiresAt && Date.now() > activeEstimate.diagnostics.expiresAt) {
      setEstimate(null);
      throw new Error("The Circle App Kit quote expired. Request a new quote before executing.");
    }

    setState("swapping");
    try {
      const provider = await connector?.getProvider();
      const nextResultRaw = await executeArcAppKitSwap({
        tokenIn: tokenIn as ArcAppKitSwapToken,
        tokenOut: tokenOut as ArcAppKitSwapToken,
        amountIn,
        slippageBps,
        provider: isEip1193Provider(provider) ? provider : undefined
      });
      const nextResult = {
        ...nextResultRaw,
        explorerUrl: nextResultRaw.explorerUrl ?? (nextResultRaw.txHash ? `${ARC_EXPLORER_URL}/tx/${nextResultRaw.txHash}` : undefined)
      };
      if (!nextResult.txHash) {
        throw new Error("Circle App Kit did not return a transaction hash for the submitted swap.");
      }
      setResult(nextResult);
      setState("success");
      return nextResult;
    } catch (err) {
      const reason = err instanceof Error ? err.message : "App Kit swap failed.";
      setError(reason);
      setState("error");
      throw err;
    }
  }, [canUseRealSwap, connector, estimate, getUnsupportedReason]);

  return useMemo(
    () => ({
      state,
      estimate,
      result,
      error,
      canUseRealSwap,
      getUnsupportedReason,
      estimateSwap,
      executeSwap,
      hasKitKey: hasCircleAppKitKey(),
      isConnected,
      isArc
    }),
    [canUseRealSwap, error, estimate, estimateSwap, executeSwap, getUnsupportedReason, isArc, isConnected, result, state]
  );
}
