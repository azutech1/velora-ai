"use client";

import { useCallback, useMemo, useState } from "react";
import { isAddress, parseUnits, type Address, type Hex } from "viem";
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useArcAppKitSwap } from "@/hooks/useArcAppKitSwap";
import { usePortfolioBalances } from "@/hooks/usePortfolioBalances";
import { useRewardsCenter } from "@/hooks/useRewardsCenter";
import { useTransactions } from "@/hooks/useTransactions";
import { useUSDC } from "@/hooks/useUSDC";
import { APP_CHAINS, getChainById } from "@/lib/config/chains";
import { getTokenAddress } from "@/lib/config/tokens";
import { erc20UsdcAbi } from "@/lib/contracts/usdc";
import { createBridgeServiceProviders, executeCircleBridgeRoute } from "@/lib/bridge/service";
import { createSwapServiceProviders, findExecutableSwapRoute } from "@/lib/swap/service";
import { getSwapToken } from "@/lib/swap/tokens";
import { findExecutableRoute, type ExecutableRoute, type RouteProvider, type RouteRequest, type RouteTransactionRequest } from "@/lib/routes/router";
import { explorerTxUrl } from "@/lib/utils/format";
import { ARC_CHAIN_ID } from "@/lib/web3/chains";
import type { ParsedCommand } from "./types";

export type AssistantProgressStep =
  | "idle"
  | "validating"
  | "checkingWallet"
  | "checkingBalance"
  | "preparingTransaction"
  | "waitingWalletConfirmation"
  | "transactionSubmitted"
  | "confirmingOnchain"
  | "completed"
  | "failed";

export type AssistantActionResult = {
  title: string;
  message: string;
  txHash?: Hex;
  explorerLink?: string;
  details?: Array<{ label: string; value: string }>;
};

const progressLabels: Record<AssistantProgressStep, string> = {
  idle: "Ready",
  validating: "Validating request",
  checkingWallet: "Checking wallet",
  checkingBalance: "Checking balance",
  preparingTransaction: "Preparing transaction",
  waitingWalletConfirmation: "Waiting for wallet confirmation",
  transactionSubmitted: "Transaction submitted",
  confirmingOnchain: "Confirming onchain",
  completed: "Completed",
  failed: "Failed"
};

function parseOptionalBigInt(value?: string | number | bigint | null) {
  if (value === undefined || value === null || value === "") return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

function getChainByAssistantName(name?: string, fallbackChainId: number = ARC_CHAIN_ID) {
  if (!name || name === "Current network") return getChainById(fallbackChainId) ?? getChainById(ARC_CHAIN_ID);
  const normalized = name.toLowerCase();
  return (
    APP_CHAINS.find((chain) => chain.name.toLowerCase() === normalized || chain.id.replace(/-/g, " ") === normalized || normalized.includes(chain.name.toLowerCase().replace(" sepolia", ""))) ??
    null
  );
}

function formatProviderFailure(failureReasons: Record<string, string>) {
  const values = Object.values(failureReasons).filter(Boolean);
  const firstReason = values.find((reason) => !/unsupported|not configured/i.test(reason)) ?? values[0];
  if (!firstReason) return "No route available for this request.";
  if (/network connection|failed to fetch|fetch failed/i.test(firstReason)) return "Provider unavailable. Please try again.";
  if (/quote without wallet transaction|no executable|transaction request/i.test(firstReason)) return "Provider returned a quote but no executable transaction.";
  if (/insufficient/i.test(firstReason)) return "Insufficient balance.";
  if (/wrong chain|wrong network/i.test(firstReason)) return "Please switch to the correct network.";
  return firstReason;
}

function cleanMetadata(values: Record<string, string | number | boolean | null | undefined>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) as Record<string, string | number | boolean | null>;
}

function estimatedOutputLabel(value?: string | null, token?: string) {
  if (!value || !token) return null;
  return `${value} ${token}`;
}

function isWalletRejected(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /user rejected|rejected|denied|cancelled|canceled/i.test(message);
}

function normalizeAssistantError(actionType: ParsedCommand["actionType"], error: unknown) {
  const raw = error instanceof Error ? error.message : "Request failed.";
  if (isWalletRejected(error)) return "Transaction rejected by user.";
  if (/transaction submitted but hash missing|hash missing|hash unavailable/i.test(raw)) return "Transaction submitted but hash missing.";
  if (/network connection|failed to fetch|fetch failed/i.test(raw)) return actionType === "swap" ? "Swap Preparation Failed: Provider unavailable. Please try again." : "Bridge Preparation Failed: Provider unavailable. Please try again.";
  if (/insufficient balance/i.test(raw)) return "Insufficient balance.";
  if (/wrong network|correct network|wrong chain/i.test(raw)) return "Please switch to the correct network.";
  if (/no route|route unavailable|unsupported/i.test(raw)) return actionType === "swap" ? "Swap Preparation Failed: Route unavailable." : "Bridge Preparation Failed: Route unavailable.";
  return raw;
}

async function requestLifiQuote(params: {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  slippage: number;
}) {
  const response = await fetch("/api/lifi/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Route unavailable for this request.");
  }
  const payload = (await response.json()) as { estimate?: unknown };
  if (!payload.estimate) throw new Error("Provider returned no executable route.");
  return payload.estimate as {
    toAmount: string | null;
    toAmountMin: string | null;
    provider: string;
    gasEstimateUsd: string | null;
    feeEstimateUsd: string | null;
    approvalAddress: string | null;
    transactionRequest: unknown;
  };
}

export function useAssistantActions() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const portfolio = usePortfolioBalances();
  const transactions = useTransactions();
  const usdc = useUSDC();
  const appKitSwap = useArcAppKitSwap();
  const activity = useActivityRecorder();
  const rewards = useRewardsCenter(activity.activities);
  const [progressStep, setProgressStep] = useState<AssistantProgressStep>("idle");
  const [progressMessage, setProgressMessage] = useState("Ready");
  const [isRunning, setIsRunning] = useState(false);

  const setProgress = useCallback((step: AssistantProgressStep, message?: string) => {
    setProgressStep(step);
    setProgressMessage(message ?? progressLabels[step]);
  }, []);

  const sendTransactionRequest = useCallback(
    async (transactionRequest: RouteTransactionRequest, expectedChainId: number) => {
      if (!walletClient || !publicClient || !address) throw new Error("Connect wallet first.");
      if (!transactionRequest.to || !transactionRequest.data) throw new Error("No executable wallet transaction is available for this route.");
      const requestChainId = transactionRequest.chainId ?? expectedChainId;
      if (chainId !== requestChainId) throw new Error("Please switch to the correct network.");
      setProgress("waitingWalletConfirmation", "Waiting for wallet confirmation");
      const txHash = await walletClient.sendTransaction({
        account: address,
        to: transactionRequest.to as Address,
        data: transactionRequest.data as Hex,
        value: parseOptionalBigInt(transactionRequest.value),
        gas: parseOptionalBigInt(transactionRequest.gas ?? transactionRequest.gasLimit),
        maxFeePerGas: parseOptionalBigInt(transactionRequest.maxFeePerGas),
        maxPriorityFeePerGas: parseOptionalBigInt(transactionRequest.maxPriorityFeePerGas)
      });
      setProgress("transactionSubmitted", "Transaction submitted");
      setProgress("confirmingOnchain", "Confirming onchain");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("Contract call failed.");
      return txHash;
    },
    [address, chainId, publicClient, setProgress, walletClient]
  );

  const ensureTokenBalance = useCallback(
    async (tokenAddress: Address, amount: string, decimals: number) => {
      if (!publicClient || !address) throw new Error("Connect wallet first.");
      const required = parseUnits(amount, decimals);
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20UsdcAbi,
        functionName: "balanceOf",
        args: [address]
      });
      if (balance < required) throw new Error("Insufficient balance.");
      return balance;
    },
    [address, publicClient]
  );

  const executeSend = useCallback(
    async (parsed: ParsedCommand): Promise<AssistantActionResult> => {
      if (parsed.token !== "USDC") throw new Error("Phase 2 send currently supports USDC only.");
      if (!parsed.destinationAddress || !isAddress(parsed.destinationAddress)) throw new Error("Invalid destination address.");
      if (!parsed.amount) throw new Error("Enter an amount.");
      if (chainId !== ARC_CHAIN_ID) throw new Error("Please switch to the correct network.");
      setProgress("checkingBalance", "Checking balance");
      const usdcAddress = getTokenAddress("USDC", ARC_CHAIN_ID);
      if (!usdcAddress) throw new Error("USDC is not configured for Arc Testnet.");
      await ensureTokenBalance(usdcAddress, parsed.amount, 6);
      const preview = await usdc.previewSendUSDC(parsed.destinationAddress, parsed.amount);
      if (!preview.valid) throw new Error(preview.reason);
      setProgress("waitingWalletConfirmation", "Waiting for wallet confirmation");
      const txHash = await usdc.sendUSDC(preview.recipient, parsed.amount);
      setProgress("transactionSubmitted", "Transaction submitted");
      setProgress("confirmingOnchain", "Confirming onchain");
      const receipt = await transactions.trackTransaction(txHash);
      if (receipt?.status !== "success") throw new Error("Contract call failed.");
      const explorerLink = explorerTxUrl(getChainById(ARC_CHAIN_ID)?.explorer ?? "", txHash);
      activity.recordActivity({
        actionType: "usdc_send_completed",
        title: "USDC sent",
        description: `Sent ${parsed.amount} USDC to ${parsed.destinationAddress.slice(0, 6)}...${parsed.destinationAddress.slice(-4)}`,
        feature: "send",
        token: "USDC",
        amount: parsed.amount,
        network: "Arc Testnet",
        status: "success",
        txHash,
        metadata: cleanMetadata({
          destinationAddress: parsed.destinationAddress,
          source: "velora_ai_assistant"
        })
      });
      return {
        title: "Send Completed",
        message: `${parsed.amount} USDC was sent successfully.`,
        txHash,
        explorerLink,
        details: [
          { label: "Amount", value: `${parsed.amount} USDC` },
          { label: "Destination", value: parsed.destinationAddress }
        ]
      };
    },
    [activity, chainId, ensureTokenBalance, setProgress, transactions, usdc]
  );

  const executeSwap = useCallback(
    async (parsed: ParsedCommand): Promise<AssistantActionResult> => {
      if (!address) throw new Error("Connect wallet first.");
      if (chainId !== ARC_CHAIN_ID) throw new Error("Please switch to the correct network.");
      if (!parsed.amount || !parsed.token || !parsed.receiveToken) throw new Error("Enter a sell amount, sell token, and receive token.");
      const from = getSwapToken(parsed.token);
      const to = getSwapToken(parsed.receiveToken);
      const fromAddress = getTokenAddress(from.symbol, ARC_CHAIN_ID);
      const toAddress = getTokenAddress(to.symbol, ARC_CHAIN_ID);
      if (!fromAddress || !toAddress) throw new Error("Route unavailable for this token pair.");
      setProgress("checkingBalance", "Checking balance");
      await ensureTokenBalance(fromAddress, parsed.amount, from.decimals);
      const balance = portfolio.positions.find((position) => position.token.symbol === from.symbol)?.balance ?? null;
      setProgress("preparingTransaction", "Preparing swap route");
      const request: RouteRequest = {
        routeType: "swap",
        walletAddress: address,
        walletChainId: chainId,
        fromChainId: ARC_CHAIN_ID,
        toChainId: ARC_CHAIN_ID,
        fromToken: { symbol: from.symbol, address: fromAddress, decimals: from.decimals },
        toToken: { symbol: to.symbol, address: toAddress, decimals: to.decimals },
        amount: parsed.amount,
        slippage: 0.5,
        balance
      };
      const providers = createSwapServiceProviders({
        appKitSwap,
        fetchLifiQuote: () =>
          requestLifiQuote({
            fromChain: ARC_CHAIN_ID,
            toChain: ARC_CHAIN_ID,
            fromToken: fromAddress,
            toToken: toAddress,
            fromAmount: parseUnits(parsed.amount ?? "0", from.decimals).toString(),
            fromAddress: address,
            slippage: 0.5
          }),
        lifiEnabled: true,
        arcChainId: ARC_CHAIN_ID
      });
      const failedProviders = new Set<string>();
      const executionFailures: Record<string, string> = {};
      let selectedRoute: ExecutableRoute | null = null;
      let result: Awaited<ReturnType<ExecutableRoute["execute"]>> | null = null;

      while (failedProviders.size < providers.length) {
        const availableProviders: RouteProvider[] = providers.filter((provider) => !failedProviders.has(provider.providerName));
        console.info("[Velora Assistant Swap] route request", {
          request,
          skippedProviders: Array.from(failedProviders),
          availableProviders: availableProviders.map((provider) => provider.providerName)
        });
        const routeResult = await findExecutableSwapRoute(request, availableProviders);
        console.info("[Velora Assistant Swap] route result", {
          diagnostics: routeResult.diagnostics,
          route: routeResult.route,
          executionFailures
        });
        if (!routeResult.route) {
          throw new Error(formatProviderFailure({ ...routeResult.diagnostics.failureReasons, ...executionFailures }));
        }

        selectedRoute = routeResult.route;
        setProgress(
          "waitingWalletConfirmation",
          `Route ready via ${selectedRoute.providerName}${estimatedOutputLabel(selectedRoute.quote.toAmount, to.symbol) ? ` for about ${estimatedOutputLabel(selectedRoute.quote.toAmount, to.symbol)}` : ""}. Confirm in wallet.`
        );

        let lastError: unknown = null;
        const maxAttempts = selectedRoute.executionMode === "provider" ? 2 : 1;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            console.info("[Velora Assistant Swap] executing route", {
              provider: selectedRoute.providerName,
              attempt,
              executionMode: selectedRoute.executionMode,
              quote: selectedRoute.quote,
              transactionRequest: selectedRoute.transactionRequest
            });
            result = await selectedRoute.execute({
              sendTransaction: (transactionRequest) => sendTransactionRequest(transactionRequest, ARC_CHAIN_ID)
            });
            lastError = null;
            break;
          } catch (error) {
            lastError = error;
            console.error("[Velora Assistant Swap] route execution failed", {
              provider: selectedRoute.providerName,
              attempt,
              error
            });
            if (isWalletRejected(error)) throw error;
          }
        }

        if (result) break;
        const reason = lastError instanceof Error ? lastError.message : "Provider execution failed.";
        executionFailures[selectedRoute.providerName] = reason;
        failedProviders.add(selectedRoute.providerName);
        setProgress("preparingTransaction", `${selectedRoute.providerName} failed. Trying another route...`);
      }

      if (!selectedRoute || !result) throw new Error(formatProviderFailure(executionFailures));
      const txHash = result.txHash;
      const explorerLink = explorerTxUrl(getChainById(ARC_CHAIN_ID)?.explorer ?? "", txHash);
      activity.recordActivity({
        actionType: "swap_completed",
        title: "Swap completed",
        description: `Swapped ${parsed.amount} ${from.symbol} to ${result.receivedAmount ?? selectedRoute.quote.toAmount ?? parsed.receiveToken} ${to.symbol}`,
        feature: "swap",
        token: from.symbol,
        amount: parsed.amount,
        network: "Arc Testnet",
        status: "success",
        txHash,
        metadata: cleanMetadata({
          fromToken: from.symbol,
          toToken: to.symbol,
          fromAmount: parsed.amount,
          toAmount: result.receivedAmount ?? selectedRoute.quote.toAmount ?? null,
          routeProvider: selectedRoute.providerName,
          source: "velora_ai_assistant"
        })
      });
      return {
        title: "Swap Completed",
        message: `Swapped ${parsed.amount} ${from.symbol} to ${to.symbol}.`,
        txHash,
        explorerLink,
        details: [
          { label: "Provider", value: selectedRoute.providerName },
          { label: "Sold", value: `${parsed.amount} ${from.symbol}` },
          { label: "Estimated received", value: `${result.receivedAmount ?? selectedRoute.quote.toAmount ?? "Confirmed"} ${to.symbol}` }
        ]
      };
    },
    [activity, address, appKitSwap, chainId, ensureTokenBalance, portfolio.positions, sendTransactionRequest, setProgress]
  );

  const executeBridge = useCallback(
    async (parsed: ParsedCommand): Promise<AssistantActionResult> => {
      if (!address) throw new Error("Connect wallet first.");
      if (!parsed.amount || !parsed.token) throw new Error("Enter an amount and token.");
      if (parsed.token !== "USDC") throw new Error("Phase 2 bridge currently supports USDC only.");
      const fromChain = getChainByAssistantName(parsed.sourceChain, chainId);
      const toChain = getChainByAssistantName(parsed.destinationChain, ARC_CHAIN_ID);
      if (!fromChain || !toChain || fromChain.chainId === toChain.chainId) throw new Error("No route available for this request.");
      if (chainId !== fromChain.chainId) throw new Error("Please switch to the correct network.");
      const fromAddress = getTokenAddress("USDC", fromChain.chainId);
      const toAddress = getTokenAddress("USDC", toChain.chainId);
      if (!fromAddress || !toAddress) throw new Error("Destination chain not supported.");
      setProgress("checkingBalance", "Checking balance");
      await ensureTokenBalance(fromAddress, parsed.amount, 6);
      const balance = fromChain.chainId === ARC_CHAIN_ID ? portfolio.positions.find((position) => position.token.symbol === "USDC")?.balance ?? null : null;
      setProgress("preparingTransaction", "Preparing bridge route");
      const request: RouteRequest = {
        routeType: "bridge",
        walletAddress: address,
        walletChainId: chainId,
        fromChainId: fromChain.chainId,
        toChainId: toChain.chainId,
        fromToken: { symbol: "USDC", address: fromAddress, decimals: 6 },
        toToken: { symbol: "USDC", address: toAddress, decimals: 6 },
        amount: parsed.amount,
        slippage: 0.5,
        balance
      };
      console.info("[Velora Assistant Bridge] route request", request);
      const routeResult = await findExecutableRoute(request, createBridgeServiceProviders(requestLifiQuote, true));
      console.info("[Velora Assistant Bridge] route result", routeResult);
      if (!routeResult.route) throw new Error(formatProviderFailure(routeResult.diagnostics.failureReasons));
      setProgress(
        "waitingWalletConfirmation",
        `Route ready via ${routeResult.route.providerName}${estimatedOutputLabel(routeResult.route.quote.toAmount, "USDC") ? ` for about ${estimatedOutputLabel(routeResult.route.quote.toAmount, "USDC")}` : ""}. Confirm in wallet.`
      );
      const result = await routeResult.route.execute({
        executeProviderRoute: () =>
          executeCircleBridgeRoute({
            fromChainId: fromChain.chainId,
            toChainId: toChain.chainId,
            amount: parsed.amount ?? "0",
            walletAddress: address,
            onStage: (stage, message) => {
              if (stage === "waitingWalletConfirmation") setProgress("waitingWalletConfirmation", message);
              if (stage === "sendingTransaction") setProgress("transactionSubmitted", message);
              if (stage === "waitingForBridgeMessage" || stage === "waitingForDestinationConfirmation") setProgress("confirmingOnchain", message);
            }
          }),
        sendTransaction: (transactionRequest) => sendTransactionRequest(transactionRequest, fromChain.chainId)
      });
      console.info("[Velora Assistant Bridge] execution result", {
        provider: routeResult.route.providerName,
        txHash: result.txHash,
        confirmationStatus: result.confirmationStatus,
        raw: result.raw
      });
      const txHash = result.txHash;
      const explorerLink = explorerTxUrl(fromChain.explorer, txHash);
      activity.recordActivity({
        actionType: "bridge_completed",
        title: "Bridge completed",
        description: `Bridged ${parsed.amount} USDC from ${fromChain.name} to ${toChain.name}`,
        feature: "bridge",
        token: "USDC",
        amount: parsed.amount,
        network: fromChain.name,
        status: result.confirmationStatus === "pending" ? "pending" : "success",
        txHash,
        metadata: cleanMetadata({
          fromChain: fromChain.name,
          toChain: toChain.name,
          routeProvider: routeResult.route.providerName,
          source: "velora_ai_assistant"
        })
      });
      return {
        title: result.confirmationStatus === "pending" ? "Bridge Submitted" : "Bridge Completed",
        message: `${parsed.amount} USDC bridge from ${fromChain.name} to ${toChain.name} was submitted.`,
        txHash,
        explorerLink,
        details: [
          { label: "Provider", value: routeResult.route.providerName },
          { label: "From", value: fromChain.name },
          { label: "To", value: toChain.name },
          { label: "Amount", value: `${parsed.amount} USDC` }
        ]
      };
    },
    [activity, address, chainId, ensureTokenBalance, portfolio.positions, sendTransactionRequest, setProgress]
  );

  const readBalances = useCallback((): AssistantActionResult => {
    if (!isConnected) throw new Error("Connect wallet first.");
    if (!portfolio.arcConnected) throw new Error("Please switch to the correct network.");
    return {
      title: "Wallet Balance",
      message: `Your Arc portfolio value is ${portfolio.totalValueLabel}.`,
      details: [
        { label: "Total value", value: portfolio.totalValueLabel },
        ...portfolio.positions.map((position) => ({ label: position.token.symbol, value: `${position.balanceLabel} ${position.token.symbol}` }))
      ]
    };
  }, [isConnected, portfolio.arcConnected, portfolio.positions, portfolio.totalValueLabel]);

  const readRewards = useCallback((): AssistantActionResult => {
    if (!isConnected) throw new Error("Connect wallet first.");
    return {
      title: "XP Balance",
      message: `You have ${rewards.xp.toLocaleString()} XP and are Level ${rewards.level.level}.`,
      details: [
        { label: "XP", value: `${rewards.xp.toLocaleString()} XP` },
        { label: "Level", value: `${rewards.level.level}` },
        { label: "Current streak", value: `${rewards.currentStreak} Days` },
        { label: "Next milestone", value: `${rewards.level.remaining.toLocaleString()} XP to Level ${rewards.level.nextLevel}` }
      ]
    };
  }, [isConnected, rewards.currentStreak, rewards.level, rewards.xp]);

  const executeAssistantAction = useCallback(
    async (parsed: ParsedCommand) => {
      if (isRunning) return null;
      setIsRunning(true);
      setProgress("validating", "Validating request");
      try {
        if (!isConnected) throw new Error("Connect wallet first.");
        setProgress("checkingWallet", "Checking wallet");
        let result: AssistantActionResult;
        if (parsed.actionType === "send") result = await executeSend(parsed);
        else if (parsed.actionType === "swap") result = await executeSwap(parsed);
        else if (parsed.actionType === "bridge") result = await executeBridge(parsed);
        else if (parsed.actionType === "balance") result = readBalances();
        else if (parsed.actionType === "rewards") result = readRewards();
        else if (parsed.actionType === "dailyReward") {
          result = {
            title: "Daily Reward Preview",
            message: rewards.canClaimDaily ? `You can claim +${rewards.dailyReward.toLocaleString()} XP today.` : "Your daily reward has already been claimed today.",
            details: [
              { label: "Current streak", value: `${rewards.currentStreak} Days` },
              { label: "Cycle day", value: `Day ${rewards.cycleDay}` },
              { label: "Reward", value: `+${rewards.dailyReward.toLocaleString()} XP` }
            ]
          };
        } else {
          throw new Error("This command is not supported yet.");
        }
        setProgress("completed", "Completed");
        return result;
      } catch (error) {
        const normalized = normalizeAssistantError(parsed.actionType, error);
        setProgress("failed", normalized);
        activity.recordActivity({
          actionType: "ai_action_failed",
          title: "AI action failed",
          description: normalized,
          feature: "automation",
          token: parsed.token,
          amount: parsed.amount,
          status: "failed",
          metadata: cleanMetadata({
            actionType: parsed.actionType,
            receiveToken: parsed.receiveToken,
            sourceChain: parsed.sourceChain,
            destinationChain: parsed.destinationChain,
            source: "velora_ai_assistant"
          })
        });
        return {
          title: "Action Failed",
          message: normalized
        };
      } finally {
        setIsRunning(false);
      }
    },
    [activity, executeBridge, executeSend, executeSwap, isConnected, isRunning, readBalances, readRewards, rewards.canClaimDaily, rewards.currentStreak, rewards.cycleDay, rewards.dailyReward, setProgress]
  );

  return useMemo(
    () => ({
      executeAssistantAction,
      isRunning,
      progressStep,
      progressLabel: progressLabels[progressStep],
      progressMessage
    }),
    [executeAssistantAction, isRunning, progressMessage, progressStep]
  );
}
