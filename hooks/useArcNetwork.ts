"use client";

import { useMemo } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { arcTestnet, ARC_CHAIN_ID, ARC_EXPLORER_URL } from "@/lib/web3/chains";

export function useArcNetwork() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending, error } = useSwitchChain();
  const isArc = chainId === ARC_CHAIN_ID;

  return useMemo(
    () => ({
      chainId,
      isArc,
      isConnected,
      isSwitching: isPending,
      switchError: error,
      expectedChain: arcTestnet,
      explorerUrl: ARC_EXPLORER_URL,
      switchToArc: () => switchChainAsync({ chainId: ARC_CHAIN_ID })
    }),
    [chainId, error, isArc, isConnected, isPending, switchChainAsync]
  );
}
