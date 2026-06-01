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

  const numericBalance = useMemo(() => {
    if (typeof balance.data !== "bigint") return null;
    const parsed = Number(formatUnits(balance.data, token.decimals));
    return Number.isFinite(parsed) ? parsed : null;
  }, [balance.data, token.decimals]);

  const emptyBalance = {
    formattedBalance: null,
    numericBalance: null,
    rawBalance: null
  };

  if (!isConnected) {
    return {
      label: "Connect wallet to view balances",
      isReal: false,
      isLoading: false,
      error: null,
      ...emptyBalance
    };
  }

  if (!isArcChainId(chainId)) {
    return {
      label: "Switch to Arc Testnet to view balances",
      isReal: false,
      isLoading: false,
      error: null,
      ...emptyBalance
    };
  }

  if (!isConfiguredSwapToken(token)) {
    return {
      label: "Balance unavailable",
      isReal: false,
      isLoading: false,
      error: null,
      ...emptyBalance
    };
  }

  if (balance.isLoading) {
    return {
      label: `Loading ${token.symbol} balance...`,
      isReal: true,
      isLoading: true,
      error: null,
      ...emptyBalance
    };
  }

  if (balance.error) {
    return {
      label: "Balance unavailable",
      isReal: true,
      isLoading: false,
      error: balance.error,
      ...emptyBalance
    };
  }

  return {
    label: `${formattedBalance ?? "0"} ${token.symbol}`,
    isReal: true,
    isLoading: false,
    error: null,
    formattedBalance: formattedBalance ?? "0",
    numericBalance: numericBalance ?? 0,
    rawBalance: typeof balance.data === "bigint" ? balance.data : BigInt(0)
  };
}
