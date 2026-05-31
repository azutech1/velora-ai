"use client";

import { useCallback } from "react";
import { formatUnits, type Address } from "viem";
import { useAccount, useWatchContractEvent } from "wagmi";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { erc20UsdcAbi, USDC_CONTRACT_ADDRESS, USDC_DECIMALS } from "@/lib/contracts/usdc";
import { ARC_CHAIN_ID } from "@/lib/web3/chains";

const SEEN_RECEIVE_KEY = "velora:seen-usdc-receives";

function readSeenReceives() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    return new Set(JSON.parse(window.localStorage.getItem(SEEN_RECEIVE_KEY) ?? "[]") as string[]);
  } catch {
    return new Set<string>();
  }
}

function rememberReceive(key: string) {
  if (typeof window === "undefined") return;
  const seen = readSeenReceives();
  seen.add(key);
  window.localStorage.setItem(SEEN_RECEIVE_KEY, JSON.stringify(Array.from(seen).slice(-500)));
}

function formatUSDCAmount(value: bigint) {
  const formatted = formatUnits(value, USDC_DECIMALS);
  const [whole, fraction = ""] = formatted.split(".");
  const trimmedFraction = fraction.slice(0, 6).replace(/0+$/, "");
  return `${whole}${trimmedFraction ? `.${trimmedFraction}` : ""}`;
}

export function WalletTransactionTracker() {
  const { address, isConnected } = useAccount();
  const { recordActivity } = useActivityRecorder();

  const onLogs = useCallback(
    (
      logs: Array<{
        args: { from?: Address; to?: Address; value?: bigint };
        transactionHash?: `0x${string}`;
        logIndex?: number;
      }>
    ) => {
      if (!address) return;
      const normalizedAddress = address.toLowerCase();

      logs.forEach((log) => {
        const to = log.args.to?.toLowerCase();
        const from = log.args.from?.toLowerCase();
        const value = log.args.value;
        const txHash = log.transactionHash;
        if (!to || to !== normalizedAddress || from === normalizedAddress || !value || !txHash) return;

        const dedupeKey = `${txHash}:${log.logIndex ?? 0}`;
        if (readSeenReceives().has(dedupeKey)) return;
        rememberReceive(dedupeKey);

        const amount = formatUSDCAmount(value);
        recordActivity({
          actionType: "usdc_receive_completed",
          title: "USDC received",
          description: `${amount} USDC received on Arc Testnet.`,
          feature: "send",
          token: "USDC",
          amount,
          walletAddress: address,
          network: "Arc Testnet",
          status: "success",
          txHash,
          metadata: {
            source: "wallet_watcher",
            from: log.args.from ?? null,
            to: log.args.to ?? null
          }
        });
      });
    },
    [address, recordActivity]
  );

  useWatchContractEvent({
    address: USDC_CONTRACT_ADDRESS,
    abi: erc20UsdcAbi,
    eventName: "Transfer",
    args: address ? { to: address } : undefined,
    chainId: ARC_CHAIN_ID,
    onLogs,
    enabled: Boolean(isConnected && address)
  });

  return null;
}
