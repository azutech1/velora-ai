"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { erc20UsdcAbi } from "@/lib/contracts/usdc";
import { isArcChainId } from "@/lib/web3/arc";
import { isConfiguredSwapToken, type SwapToken } from "@/lib/swap/tokens";

export function useSwapTokenBalance(token: SwapToken) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const canReadBalance = Boolean(address && isConnected && isArcChainId(chainId) && isConfiguredSwapToken(token));

  const balance = useReadContract({
    address: token.contractAddress,
    abi: erc20UsdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: canReadBalance
    }
  });

  const formattedBalance = useMemo(() => {
    if (typeof balance.data !== "bigint") return null;
    const formatted = formatUnits(balance.data, token.decimals);
    const [whole, fraction = ""] = formatted.split(".");
    const trimmedFraction = fraction.slice(0, 4).replace(/0+$/, "");
    const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${groupedWhole}${trimmedFraction ? `.${trimmedFraction}` : ""}`;
  }, [balance.data, token.decimals]);

  if (!isConnected) {
    return {
      label: `Demo balance: ${token.mockBalance} ${token.symbol}`,
      isReal: false,
      isLoading: false,
      error: null
    };
  }

  if (!isArcChainId(chainId)) {
    return {
      label: "Switch to Arc Testnet to read live balance",
      isReal: false,
      isLoading: false,
      error: null
    };
  }

  if (!isConfiguredSwapToken(token)) {
    return {
      label: `Demo balance: ${token.mockBalance} ${token.symbol}`,
      isReal: false,
      isLoading: false,
      error: null
    };
  }

  if (balance.isLoading) {
    return {
      label: `Loading ${token.symbol} balance...`,
      isReal: true,
      isLoading: true,
      error: null
    };
  }

  if (balance.error) {
    return {
      label: `Unable to read ${token.symbol} balance`,
      isReal: true,
      isLoading: false,
      error: balance.error
    };
  }

  return {
    label: `Wallet balance: ${formattedBalance ?? "0"} ${token.symbol}`,
    isReal: true,
    isLoading: false,
    error: null
  };
}
