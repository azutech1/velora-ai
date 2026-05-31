"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useArcNetwork } from "./useArcNetwork";
import { estimateBridgeQuote, type BridgeQuote } from "@/lib/swap/bridge";
import { getBridgeNetwork } from "@/lib/swap/networks";

export type BridgeFlowState = "idle" | "reviewing" | "approving" | "bridging" | "confirming" | "completed" | "failed";

export function useCrossChainSwap() {
  const { isConnected } = useAccount();
  const { chainId, isArc } = useArcNetwork();
  const [fromNetworkId, setFromNetworkId] = useState("arc-testnet");
  const [toNetworkId, setToNetworkId] = useState("base-sepolia");
  const [amount, setAmount] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("USDC");
  const [slippage, setSlippage] = useState("0.50");
  const [state, setState] = useState<BridgeFlowState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [completedHash, setCompletedHash] = useState<string | null>(null);

  const fromNetwork = getBridgeNetwork(fromNetworkId);
  const toNetwork = getBridgeNetwork(toNetworkId);
  const quote = useMemo<BridgeQuote>(() => estimateBridgeQuote(fromNetworkId, toNetworkId, amount, tokenSymbol), [amount, fromNetworkId, toNetworkId, tokenSymbol]);
  const sourceNetworkMatchesWallet = fromNetwork.chainId === chainId;

  const reviewBridge = useCallback(() => {
    setError(null);
    if (!isConnected) {
      setState("failed");
      setError("Connect a wallet before reviewing a cross-chain swap.");
      return false;
    }

    if (fromNetwork.id === "arc-testnet" && !isArc) {
      setState("failed");
      setError("Switch your wallet to Arc Testnet before bridging from Arc.");
      return false;
    }

    if (!sourceNetworkMatchesWallet) {
      setState("failed");
      setError(`Wallet must be on ${fromNetwork.name} to use this source network.`);
      return false;
    }

    if (!quote.valid) {
      setState("failed");
      setError(quote.reason ?? "Bridge quote is not valid.");
      return false;
    }

    setState("reviewing");
    return true;
  }, [fromNetwork.id, fromNetwork.name, isArc, isConnected, quote.reason, quote.valid, sourceNetworkMatchesWallet]);

  const confirmBridge = useCallback(async () => {
    setState("approving");
    setError(null);
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    setState("bridging");
    await new Promise((resolve) => window.setTimeout(resolve, 850));
    setState("confirming");
    await new Promise((resolve) => window.setTimeout(resolve, 750));
    setCompletedHash(quote.hashPlaceholder);
    setState("completed");
  }, [quote.hashPlaceholder]);

  useEffect(() => {
    setState("idle");
    setError(null);
    setCompletedHash(null);
  }, [amount, fromNetworkId, toNetworkId]);

  return {
    amount,
    setAmount,
    tokenSymbol,
    setTokenSymbol,
    slippage,
    setSlippage,
    fromNetwork,
    toNetwork,
    setFromNetworkId,
    setToNetworkId,
    quote,
    state,
    error,
    completedHash,
    reviewBridge,
    confirmBridge,
    sourceNetworkMatchesWallet
  };
}
