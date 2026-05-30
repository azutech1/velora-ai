"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { useAccount, useChainId, useReadContracts } from "wagmi";
import { erc20UsdcAbi } from "@/lib/contracts/usdc";
import { APP_TOKENS } from "@/lib/config/tokens";
import { isArcChainId } from "@/lib/web3/arc";
import { useStablecoinPrices } from "./useStablecoinPrices";

function formatBalance(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: value > 0 && value < 1 ? 6 : 4
  });
}

function formatUsd(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function usePortfolioBalances() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const prices = useStablecoinPrices();
  const arcConnected = isConnected && isArcChainId(chainId);

  const contracts = useMemo(
    () =>
      APP_TOKENS.map((token) => ({
        address: token.addresses[5042002],
        abi: erc20UsdcAbi,
        functionName: "balanceOf" as const,
        args: address ? [address] : undefined
      })).filter((contract) => contract.address && contract.args),
    [address]
  );

  const balances = useReadContracts({
    contracts,
    query: {
      enabled: Boolean(address && arcConnected && contracts.length)
    }
  });

  const positions = useMemo(() => {
    let resultIndex = 0;
    return APP_TOKENS.map((token) => {
      const hasAddress = Boolean(token.addresses[5042002]);
      const result = hasAddress ? balances.data?.[resultIndex++] : undefined;
      const raw = result?.status === "success" && typeof result.result === "bigint" ? result.result : BigInt(0);
      const balance = Number(formatUnits(raw, token.decimals));
      const price = prices.prices[token.symbol].price;
      const value = balance * price;
      return {
        token,
        balance,
        balanceLabel: formatBalance(balance),
        price,
        priceLabel: formatUsd(price),
        value,
        valueLabel: formatUsd(value),
        isLoading: balances.isLoading || prices.loading,
        error: result?.status === "failure" ? result.error : null
      };
    });
  }, [balances.data, balances.isLoading, prices.loading, prices.prices]);

  const totalValue = useMemo(() => positions.reduce((sum, position) => sum + position.value, 0), [positions]);
  const weightedChange = useMemo(() => {
    if (totalValue <= 0) return 0;
    return positions.reduce((sum, position) => sum + position.value * prices.prices[position.token.symbol].change24h, 0) / totalValue;
  }, [positions, prices.prices, totalValue]);

  return {
    positions,
    totalValue,
    totalValueLabel: formatUsd(totalValue),
    dailyChange: weightedChange,
    dailyChangeLabel: `${weightedChange >= 0 ? "+" : ""}${weightedChange.toFixed(2)}%`,
    isConnected,
    arcConnected,
    isLoading: balances.isLoading || prices.loading,
    refreshing: balances.isFetching || prices.refreshing,
    refresh: () => {
      void balances.refetch();
      void prices.refresh();
    }
  };
}
