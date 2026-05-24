"use client";

import { useCallback, useMemo, useState } from "react";
import { type Address, type Hash } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { erc20UsdcAbi, USDC_CONTRACT_ADDRESS } from "@/lib/contracts/usdc";
import { ARC_CHAIN_ID } from "@/lib/web3/chains";
import { createSendUSDCRequest, prepareSendUSDC } from "@/lib/web3/usdc";
import { useArcNetwork } from "./useArcNetwork";

export type USDCSendPreview =
  | {
      valid: true;
      recipient: Address;
      amountUnits: bigint;
      gas?: bigint;
    }
  | {
      valid: false;
      reason: string;
    };

export function useUSDC() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID });
  const { isArc, isConnected } = useArcNetwork();
  const { writeContractAsync } = useWriteContract();
  const [hash, setHash] = useState<Hash | undefined>();
  const [gasEstimate, setGasEstimate] = useState<bigint | undefined>();
  const [error, setError] = useState<string | null>(null);

  const receipt = useWaitForTransactionReceipt({
    hash,
    chainId: ARC_CHAIN_ID,
    confirmations: 1,
    query: {
      enabled: Boolean(hash)
    }
  });

  const previewSendUSDC = useCallback(
    async (recipient: string, amount: string): Promise<USDCSendPreview> => {
      setError(null);
      setGasEstimate(undefined);

      if (!isConnected || !address) {
        return { valid: false, reason: "Connect a wallet before sending USDC." };
      }

      if (!isArc) {
        return { valid: false, reason: "Switch your wallet to Arc Testnet before sending USDC." };
      }

      const prepared = prepareSendUSDC(recipient, amount);
      if (!prepared.ready) {
        return { valid: false, reason: prepared.reason };
      }

      if (!publicClient) {
        return { valid: false, reason: "Arc RPC client is not ready yet." };
      }

      try {
        const gas = await publicClient.estimateContractGas({
          account: address,
          address: USDC_CONTRACT_ADDRESS,
          abi: erc20UsdcAbi,
          functionName: "transfer",
          args: [recipient as Address, prepared.amountUnits]
        });
        setGasEstimate(gas);
        return { valid: true, recipient: recipient as Address, amountUnits: prepared.amountUnits, gas };
      } catch (err) {
        const reason = err instanceof Error ? err.message : "Gas estimation failed.";
        setError(reason);
        return { valid: false, reason };
      }
    },
    [address, isArc, isConnected, publicClient]
  );

  const sendUSDC = useCallback(
    async (recipient: Address, amount: string) => {
      setError(null);
      try {
        const txHash = await writeContractAsync({
          ...createSendUSDCRequest(recipient, amount)
        });
        setHash(txHash);
        return txHash;
      } catch (err) {
        const reason = err instanceof Error ? err.message : "USDC transaction failed.";
        setError(reason);
        throw err;
      }
    },
    [writeContractAsync]
  );

  return useMemo(
    () => ({
      previewSendUSDC,
      sendUSDC,
      hash,
      gasEstimate,
      error,
      isConfirming: receipt.isLoading,
      isConfirmed: receipt.isSuccess,
      receipt: receipt.data
    }),
    [error, gasEstimate, hash, previewSendUSDC, receipt.data, receipt.isLoading, receipt.isSuccess, sendUSDC]
  );
}
