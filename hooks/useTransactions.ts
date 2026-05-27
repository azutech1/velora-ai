"use client";

import { useCallback, useMemo, useState } from "react";
import { usePublicClient } from "wagmi";
import { explorerTxUrl } from "@/lib/utils/format";
import { ARC_EXPLORER_URL } from "@/lib/web3/chains";

export type ManagedTransactionStatus = "idle" | "pending" | "success" | "failed";

export type ManagedTransaction = {
  hash?: `0x${string}`;
  status: ManagedTransactionStatus;
  error?: string | null;
  explorerUrl?: string | null;
};

export function useTransactions() {
  const publicClient = usePublicClient();
  const [transaction, setTransaction] = useState<ManagedTransaction>({ status: "idle" });

  const trackTransaction = useCallback(
    async (hash: `0x${string}`) => {
      setTransaction({ hash, status: "pending", explorerUrl: explorerTxUrl(ARC_EXPLORER_URL, hash) });

      try {
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });
        const status = receipt?.status === "success" ? "success" : "failed";
        setTransaction({ hash, status, explorerUrl: explorerTxUrl(ARC_EXPLORER_URL, hash) });
        return receipt;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Transaction polling failed.";
        setTransaction({ hash, status: "failed", error: message, explorerUrl: explorerTxUrl(ARC_EXPLORER_URL, hash) });
        throw error;
      }
    },
    [publicClient]
  );

  const resetTransaction = useCallback(() => {
    setTransaction({ status: "idle" });
  }, []);

  return useMemo(
    () => ({
      transaction,
      trackTransaction,
      resetTransaction,
      isPending: transaction.status === "pending"
    }),
    [resetTransaction, trackTransaction, transaction]
  );
}
