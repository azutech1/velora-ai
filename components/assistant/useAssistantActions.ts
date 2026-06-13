"use client";

import { useCallback, useMemo, useState } from "react";
import { erc20Abi, isAddress, parseUnits, type Address, type Hex } from "viem";
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
import { CIRCLE_FAUCET_URL } from "@/lib/faucet/tokens";
import { ASSISTANT_SCOPE_RESPONSE, findAssistantKnowledgeAnswer } from "@/lib/assistant/knowledge";
import {
  estimatePairedAmount,
  findLiquidityPoolByTokens,
  LIQUIDITY_CONTRACT_NOTICE,
  LIQUIDITY_POOL_DISCLAIMER,
  LIQUIDITY_POOLS,
  USDT_COMING_SOON_MESSAGE,
  isLiquidityPoolActive,
  isUsdtRelated
} from "@/lib/liquidity/pools";
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
  approvalTxHash?: Hex | null;
  destinationTxHash?: Hex | null;
  explorerLink?: string;
  destinationExplorerLink?: string | null;
  completionTime?: string | null;
  details?: Array<{ label: string; value: string }>;
};

const progressLabels: Record<AssistantProgressStep, string> = {
  idle: "Ready",
  validating: "Validating request",
  checkingWallet: "Checking wallet",
  checkingBalance: "Checking balance",
  preparingTransaction: "Preparing route",
  waitingWalletConfirmation: "Waiting for wallet confirmation",
  transactionSubmitted: "Submitted",
  confirmingOnchain: "Confirming",
  completed: "Completed",
  failed: "Failed"
};

const EVM_TX_HASH = /^0x[a-fA-F0-9]{64}$/;

type TraceLike = {
  txHash?: unknown;
  transactionHash?: unknown;
  hash?: unknown;
  explorerUrl?: unknown;
};

type AssistantLifiQuote = Awaited<ReturnType<typeof requestLifiQuote>>;

function getTraceCandidate(value: unknown): TraceLike | null {
  if (!value || typeof value !== "object") return null;
  const record = value as { trace?: unknown; cause?: unknown };
  if (record.trace && typeof record.trace === "object") return record.trace as TraceLike;
  const cause = record.cause as { trace?: unknown } | undefined;
  if (cause?.trace && typeof cause.trace === "object") return cause.trace as TraceLike;
  return null;
}

function collectEvmHashes(value: unknown, seen = new Set<unknown>()): Hex[] {
  if (!value || seen.has(value)) return [];
  if (typeof value === "string") return EVM_TX_HASH.test(value) ? [value as Hex] : [];
  if (typeof value !== "object") return [];
  seen.add(value);

  const hashes: Hex[] = [];
  const record = value as Record<string, unknown>;
  const explicitValues = [record.txHash, record.transactionHash, record.hash];
  for (const explicitValue of explicitValues) {
    hashes.push(...collectEvmHashes(explicitValue, seen));
  }
  const trace = getTraceCandidate(value);
  if (trace) {
    hashes.push(...collectEvmHashes(trace.txHash, seen));
    hashes.push(...collectEvmHashes(trace.transactionHash, seen));
    hashes.push(...collectEvmHashes(trace.hash, seen));
  }
  for (const entry of Object.values(record)) {
    hashes.push(...collectEvmHashes(entry, seen));
  }
  return Array.from(new Set(hashes));
}

function extractSubmittedTransaction(error: unknown) {
  const trace = getTraceCandidate(error);
  const traceHash = [trace?.txHash, trace?.transactionHash, trace?.hash].find((value) => typeof value === "string" && EVM_TX_HASH.test(value)) as Hex | undefined;
  const nestedHash = collectEvmHashes(error).find(Boolean);
  const explorerUrl = typeof trace?.explorerUrl === "string" ? trace.explorerUrl : null;
  return {
    txHash: traceHash ?? nestedHash,
    explorerUrl
  };
}

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

function formatSwapProviderFailure(failureReasons: Record<string, string>) {
  const fallbackReason = failureReasons["LI.FI fallback"] || failureReasons["LI.FI Swap"];
  if (fallbackReason) {
    if (/no available quotes|provider code 1002|requested transfer|route unavailable|no route|not supported|unsupported/i.test(fallbackReason)) {
      return "Swap Preparation Failed: No executable swap route is currently available for this token pair.";
    }
    if (/quote without wallet transaction|without wallet transaction|no executable|transaction request/i.test(fallbackReason)) {
      return "Swap Preparation Failed: Provider returned a quote but no executable transaction.";
    }
    if (/wrong chain|wrong network/i.test(fallbackReason)) return "Please switch to the correct network.";
    if (/insufficient/i.test(fallbackReason)) return "Insufficient balance.";
    if (!/network connection|failed to fetch|fetch failed/i.test(fallbackReason)) return `Swap Preparation Failed: ${fallbackReason}`;
  }

  const values = Object.values(failureReasons).filter(Boolean);
  if (values.some((reason) => /no available quotes|provider code 1002|requested transfer|route unavailable|no route|not supported|unsupported/i.test(reason))) {
    return "Swap Preparation Failed: No executable swap route is currently available for this token pair.";
  }
  const nonNetworkReason = values.find((reason) => !/unsupported|not configured|network connection|failed to fetch|fetch failed/i.test(reason));
  if (nonNetworkReason) return `Swap Preparation Failed: ${nonNetworkReason}`;
  return "Swap Preparation Failed: All swap providers are currently unavailable.";
}

function cleanMetadata(values: Record<string, string | number | boolean | null | undefined>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) as Record<string, string | number | boolean | null>;
}

type AssistantAutomationRule = {
  id: string;
  command: string;
  type: string;
  status: "active";
  createdAt: string;
};

function automationStorageKey(address: string) {
  return `velora:assistant-automation:${address.toLowerCase()}`;
}

function automationTypeFromCommand(command: string) {
  if (/receive.*usdc|usdc.*receive/i.test(command)) return "Wallet alert";
  if (/claim.*xp|daily|reward/i.test(command)) return "Rewards reminder";
  if (/campaign|arc.*release|new.*arc/i.test(command)) return "Ecosystem update alert";
  if (/bridge.*route|route.*available/i.test(command)) return "Bridge route alert";
  return "General alert";
}

function readAutomationRules(address: string): AssistantAutomationRule[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(automationStorageKey(address)) ?? "[]") as AssistantAutomationRule[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAutomationRules(address: string, rules: AssistantAutomationRule[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(automationStorageKey(address), JSON.stringify(rules));
}

function estimatedOutputLabel(value?: string | null, token?: string) {
  if (!value || !token) return null;
  return `${value} ${token}`;
}

function formatRawTokenAmount(value: string | null | undefined, decimals: number) {
  if (!value) return null;
  const numeric = Number(value) / 10 ** decimals;
  if (!Number.isFinite(numeric)) return null;
  return numeric.toFixed(6).replace(/\.?0+$/, "");
}

function isLifiRoute(providerName?: string | null, raw?: unknown) {
  return Boolean(providerName?.toLowerCase().includes("li.fi") || (raw && typeof raw === "object" && "transactionRequest" in raw));
}

function readableSwapOutputAmount(options: {
  providerName?: string | null;
  raw?: unknown;
  receivedAmount?: string | null;
  quoteAmount?: string | null;
  decimals: number;
}) {
  const value = options.receivedAmount ?? options.quoteAmount ?? null;
  if (!value) return null;
  if (isLifiRoute(options.providerName, options.raw)) {
    return formatRawTokenAmount(value, options.decimals) ?? value;
  }
  return value;
}

function isWalletRejected(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /user rejected|rejected|denied|cancelled|canceled/i.test(message);
}

function normalizeAssistantError(actionType: ParsedCommand["actionType"], error: unknown) {
  const raw = error instanceof Error ? error.message : "Request failed.";
  if (isWalletRejected(error)) return "Transaction rejected by user.";
  if (/approval completed.*bridge/i.test(raw)) return raw;
  if (/approval failed|token approval failed/i.test(raw)) return "Approval failed.";
  if (/bridge transaction hash missing/i.test(raw)) return "Bridge provider did not submit a source transaction. Please retry the bridge.";
  if (/bridge provider did not submit|bridge submission failed/i.test(raw)) return raw;
  if (/destination confirmation timeout|destination settlement/i.test(raw)) return "Waiting for destination confirmation.";
  if (/transaction submitted but hash missing|hash missing|hash unavailable/i.test(raw)) return "Transaction submitted but hash missing.";
  if (/network connection|failed to fetch|fetch failed/i.test(raw)) return actionType === "swap" ? "Swap Preparation Failed: Provider unavailable. Please try again." : "Bridge Preparation Failed: Provider unavailable. Please try again.";
  if (/insufficient balance/i.test(raw)) return "Insufficient balance.";
  if (/wrong network|correct network|wrong chain/i.test(raw)) return "Please switch to the correct network.";
  if (/no route|route unavailable|unsupported/i.test(raw)) return actionType === "swap" ? "Swap Preparation Failed: Route unavailable." : "Bridge Preparation Failed: Route unavailable.";
  return raw;
}

function assistantFailureTitle(actionType: ParsedCommand["actionType"]) {
  if (actionType === "swap") return "Swap Failed";
  if (actionType === "bridge") return "Bridge Failed";
  if (actionType === "liquidity") return "Liquidity Preview Unavailable";
  if (actionType === "send") return "Send Failed";
  if (actionType === "faucet") return "Faucet Unavailable";
  if (actionType === "knowledge") return "Answer Unavailable";
  if (actionType === "profile") return "Profile Unavailable";
  if (actionType === "transactionHistory") return "Transaction History Unavailable";
  return "Request Failed";
}

function isProviderNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /network connection|failed to fetch|fetch failed|service createswap failed/i.test(message);
}

function isAppKitBackedProvider(providerName: string) {
  return providerName === "Arc Native" || providerName === "Circle StableFX";
}

function isExecutableLifiQuote(quote: AssistantLifiQuote) {
  const transactionRequest = quote.transactionRequest as RouteTransactionRequest | null | undefined;
  return Boolean(transactionRequest?.to && transactionRequest.data);
}

function getApprovalSpender(quote: { approvalAddress?: string | null; transactionRequest?: unknown }) {
  const transactionRequest = quote.transactionRequest as RouteTransactionRequest | null | undefined;
  const spender = quote.approvalAddress ?? transactionRequest?.to ?? null;
  return spender && isAddress(spender) ? spender : null;
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
  const walletAddress = address ?? walletClient?.account.address ?? null;
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
      if (!walletClient || !publicClient || !walletAddress) throw new Error("Connect wallet first.");
      if (!transactionRequest.to || !transactionRequest.data) throw new Error("No executable wallet transaction is available for this route.");
      const requestChainId = transactionRequest.chainId ?? expectedChainId;
      if (chainId !== requestChainId) throw new Error("Please switch to the correct network.");
      setProgress("waitingWalletConfirmation", "Waiting for wallet confirmation");
      const txHash = await walletClient.sendTransaction({
        account: walletAddress,
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
      if (receipt.status !== "success") {
        const error = new Error("Contract call failed.");
        (error as Error & { cause?: { trace: { txHash: Hex } } }).cause = { trace: { txHash } };
        throw error;
      }
      return txHash;
    },
    [chainId, publicClient, setProgress, walletAddress, walletClient]
  );

  const ensureTokenBalance = useCallback(
    async (tokenAddress: Address, amount: string, decimals: number) => {
      if (!publicClient || !walletAddress) throw new Error("Connect wallet first.");
      const required = parseUnits(amount, decimals);
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: erc20UsdcAbi,
        functionName: "balanceOf",
        args: [walletAddress]
      });
      if (balance < required) throw new Error("Insufficient balance.");
      return balance;
    },
    [publicClient, walletAddress]
  );

  const ensureGasBalance = useCallback(async () => {
    if (!publicClient || !walletAddress) throw new Error("Connect wallet first.");
    const balance = await publicClient.getBalance({ address: walletAddress });
    if (balance <= BigInt(0)) throw new Error("Insufficient gas.");
    return balance;
  }, [publicClient, walletAddress]);

  const ensureTokenAllowance = useCallback(
    async (options: { tokenAddress: Address; spender: Address | null; amount: string; decimals: number; tokenSymbol: string }) => {
      if (!options.spender) return null;
      if (!walletClient || !publicClient || !walletAddress) throw new Error("Connect wallet first.");
      const requiredAmount = parseUnits(options.amount, options.decimals);
      if (requiredAmount <= BigInt(0)) return null;
      const allowance = (await publicClient.readContract({
        address: options.tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [walletAddress, options.spender]
      })) as bigint;
      if (allowance >= requiredAmount) return null;

      setProgress("waitingWalletConfirmation", `Approve ${options.tokenSymbol} spending in wallet.`);
      const approvalHash = await walletClient.writeContract({
        account: walletAddress,
        address: options.tokenAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [options.spender, requiredAmount]
      });
      setProgress("transactionSubmitted", "Approval submitted");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash });
      if (receipt.status !== "success") {
        const error = new Error("Token approval failed.");
        (error as Error & { cause?: { trace: { txHash: Hex } } }).cause = { trace: { txHash: approvalHash } };
        throw error;
      }
      setProgress("preparingTransaction", "Token approved. Preparing swap transaction...");
      return approvalHash;
    },
    [publicClient, setProgress, walletAddress, walletClient]
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
      await ensureGasBalance();
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
    [activity, chainId, ensureGasBalance, ensureTokenBalance, setProgress, transactions, usdc]
  );

  const executeSwap = useCallback(
    async (parsed: ParsedCommand): Promise<AssistantActionResult> => {
      if (isUsdtRelated(parsed.token, parsed.receiveToken)) throw new Error(USDT_COMING_SOON_MESSAGE);
      if (!walletAddress) throw new Error("Connect wallet first.");
      if (chainId !== ARC_CHAIN_ID) throw new Error("Please switch to the correct network.");
      if (!parsed.amount || !parsed.token || !parsed.receiveToken) throw new Error("Enter a sell amount, sell token, and receive token.");
      const from = getSwapToken(parsed.token);
      const to = getSwapToken(parsed.receiveToken);
      const fromAddress = getTokenAddress(from.symbol, ARC_CHAIN_ID);
      const toAddress = getTokenAddress(to.symbol, ARC_CHAIN_ID);
      if (!fromAddress || !toAddress) throw new Error("Route unavailable for this token pair.");
      setProgress("checkingBalance", "Checking balance");
      await ensureTokenBalance(fromAddress, parsed.amount, from.decimals);
      await ensureGasBalance();
      const balance = portfolio.positions.find((position) => position.token.symbol === from.symbol)?.balance ?? null;
      setProgress("preparingTransaction", "Preparing swap route");
      const request: RouteRequest = {
        routeType: "swap",
        walletAddress,
        walletChainId: chainId,
        fromChainId: ARC_CHAIN_ID,
        toChainId: ARC_CHAIN_ID,
        fromToken: { symbol: from.symbol, address: fromAddress, decimals: from.decimals },
        toToken: { symbol: to.symbol, address: toAddress, decimals: to.decimals },
        amount: parsed.amount,
        slippage: 0.5,
        balance
      };
      const fetchAssistantLifiQuote = () =>
        requestLifiQuote({
          fromChain: getChainById(ARC_CHAIN_ID)?.lifiChainId ?? ARC_CHAIN_ID,
          toChain: getChainById(ARC_CHAIN_ID)?.lifiChainId ?? ARC_CHAIN_ID,
          fromToken: fromAddress,
          toToken: toAddress,
          fromAmount: parseUnits(parsed.amount ?? "0", from.decimals).toString(),
          fromAddress: walletAddress,
          slippage: 0.5
        });
      const providers = createSwapServiceProviders({
        appKitSwap,
        fetchLifiQuote: fetchAssistantLifiQuote,
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
          Object.assign(executionFailures, routeResult.diagnostics.failureReasons);
          console.warn("[Velora Assistant Swap] no executable route from router, preparing direct fallback", {
            diagnostics: routeResult.diagnostics,
            executionFailures
          });
          break;
        }

        selectedRoute = routeResult.route;
        const readableRouteOutput = readableSwapOutputAmount({
          providerName: selectedRoute.providerName,
          raw: selectedRoute.quote.raw,
          quoteAmount: selectedRoute.quote.toAmount,
          decimals: to.decimals
        });
        setProgress(
          "waitingWalletConfirmation",
          `Route ready via ${selectedRoute.providerName}${estimatedOutputLabel(readableRouteOutput, to.symbol) ? ` for about ${estimatedOutputLabel(readableRouteOutput, to.symbol)}` : ""}. Confirm in wallet.`
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
            if (selectedRoute.executionMode === "transactionRequest") {
              const spender = getApprovalSpender(selectedRoute.quote);
              if (spender) {
                await ensureTokenAllowance({
                  tokenAddress: fromAddress,
                  spender,
                  amount: parsed.amount,
                  decimals: from.decimals,
                  tokenSymbol: from.symbol
                });
              }
            }
            result = await selectedRoute.execute({
              sendTransaction: (transactionRequest) => sendTransactionRequest(transactionRequest, ARC_CHAIN_ID)
            });
            lastError = null;
            break;
          } catch (error) {
            lastError = error;
            const submittedTransaction = extractSubmittedTransaction(error);
            console.error("[Velora Assistant Swap] route execution failed", {
              provider: selectedRoute.providerName,
              attempt,
              error,
              recoveredTxHash: submittedTransaction.txHash,
              recoveredExplorerUrl: submittedTransaction.explorerUrl
            });
            if (submittedTransaction.txHash) {
              setProgress("transactionSubmitted", "Transaction submitted");
              let confirmationStatus: "confirmed" | "pending" = "pending";
              try {
                setProgress("confirmingOnchain", "Confirming onchain");
                const receipt = await publicClient?.waitForTransactionReceipt({ hash: submittedTransaction.txHash });
                confirmationStatus = receipt?.status === "success" ? "confirmed" : "pending";
              } catch (receiptError) {
                console.warn("[Velora Assistant Swap] submitted transaction confirmation is pending", {
                  provider: selectedRoute.providerName,
                  txHash: submittedTransaction.txHash,
                  receiptError
                });
              }
              result = {
                txHash: submittedTransaction.txHash,
                receivedAmount: selectedRoute.quote.toAmount ?? undefined,
                confirmationStatus,
                raw: {
                  recoveredFromErrorTrace: true,
                  provider: selectedRoute.providerName,
                  explorerUrl: submittedTransaction.explorerUrl,
                  error
                }
              };
              lastError = null;
              break;
            }
            if (isWalletRejected(error)) throw error;
          }
        }

        if (result) break;
        const reason = lastError instanceof Error ? lastError.message : "Provider execution failed.";
        executionFailures[selectedRoute.providerName] = reason;
        failedProviders.add(selectedRoute.providerName);
        if (isProviderNetworkError(lastError) && isAppKitBackedProvider(selectedRoute.providerName)) {
          failedProviders.add("Arc Native");
          failedProviders.add("Circle StableFX");
          executionFailures["Arc Native"] = executionFailures["Arc Native"] ?? reason;
          executionFailures["Circle StableFX"] = executionFailures["Circle StableFX"] ?? reason;
        }
        setProgress("preparingTransaction", `${selectedRoute.providerName} failed. Trying another route...`);
      }

      if (!selectedRoute || !result) {
        try {
          setProgress("preparingTransaction", "Native providers unavailable. Trying LI.FI fallback...");
          const fallbackQuote = await fetchAssistantLifiQuote();
          const transactionRequest = fallbackQuote.transactionRequest as RouteTransactionRequest | null | undefined;
          console.info("[Velora Assistant Swap] direct LI.FI fallback response", {
            quote: fallbackQuote,
            transactionRequest,
            transactionRequestExists: isExecutableLifiQuote(fallbackQuote),
            priorExecutionFailures: executionFailures
          });
          if (!isExecutableLifiQuote(fallbackQuote) || !transactionRequest) {
            throw new Error("LI.FI fallback returned a quote without wallet transaction data.");
          }
          const requestChainId = transactionRequest.chainId ?? ARC_CHAIN_ID;
          if (requestChainId !== chainId) {
            throw new Error(`LI.FI fallback transaction is for chain ${requestChainId}, but wallet is on chain ${chainId}.`);
          }
          const approvalHash = await ensureTokenAllowance({
            tokenAddress: fromAddress,
            spender: getApprovalSpender(fallbackQuote),
            amount: parsed.amount,
            decimals: from.decimals,
            tokenSymbol: from.symbol
          });
          const txHash = await sendTransactionRequest(transactionRequest, ARC_CHAIN_ID);
          const receivedAmount = formatRawTokenAmount(fallbackQuote.toAmount, to.decimals) ?? fallbackQuote.toAmount ?? undefined;
          result = {
            txHash,
            receivedAmount,
            confirmationStatus: "confirmed",
            raw: {
              fallbackFromProviders: executionFailures,
              approvalHash,
              quote: fallbackQuote
            }
          };
          selectedRoute = {
            routeType: "swap",
            providerName: fallbackQuote.provider ?? "LI.FI Swap",
            quote: {
              provider: fallbackQuote.provider ?? "LI.FI Swap",
              toAmount: receivedAmount,
              toAmountMin: formatRawTokenAmount(fallbackQuote.toAmountMin, to.decimals) ?? fallbackQuote.toAmountMin,
              feeEstimateUsd: fallbackQuote.feeEstimateUsd,
              gasEstimateUsd: fallbackQuote.gasEstimateUsd,
              approvalAddress: fallbackQuote.approvalAddress,
              raw: fallbackQuote
            },
            transactionRequest,
            executionMode: "transactionRequest",
            diagnostics: {
              providersTried: providers.map((provider) => provider.providerName),
              selectedProvider: fallbackQuote.provider ?? "LI.FI Swap",
              failureReasons: executionFailures,
              quoteOnlyProviders: {},
              executable: true,
              routeType: "swap",
              chainId: ARC_CHAIN_ID,
              tokenPair: `${from.symbol}/${to.symbol}`
            },
            execute: async () => result as NonNullable<typeof result>
          };
        } catch (fallbackError) {
          const fallbackReason = fallbackError instanceof Error ? fallbackError.message : "LI.FI fallback failed.";
          console.error("[Velora Assistant Swap] direct LI.FI fallback failed", {
            fallbackError,
            executionFailures
          });
          throw new Error(formatSwapProviderFailure({ ...executionFailures, "LI.FI fallback": fallbackReason }));
        }
      }

      if (!selectedRoute || !result) throw new Error(formatSwapProviderFailure(executionFailures));
      const txHash = result.txHash;
      const explorerLink = explorerTxUrl(getChainById(ARC_CHAIN_ID)?.explorer ?? "", txHash);
      const receivedAmount = readableSwapOutputAmount({
        providerName: selectedRoute.providerName,
        raw: selectedRoute.quote.raw,
        receivedAmount: result.receivedAmount,
        quoteAmount: selectedRoute.quote.toAmount,
        decimals: to.decimals
      });
      activity.recordActivity({
        actionType: "swap_completed",
        title: "Swap completed",
        description: `Swapped ${parsed.amount} ${from.symbol} to ${receivedAmount ?? parsed.receiveToken} ${to.symbol}`,
        feature: "swap",
        token: from.symbol,
        amount: parsed.amount,
        network: "Arc Testnet",
        status: result.confirmationStatus === "pending" ? "pending" : "success",
        txHash,
        metadata: cleanMetadata({
          fromToken: from.symbol,
          toToken: to.symbol,
          fromAmount: parsed.amount,
          toAmount: receivedAmount,
          routeProvider: selectedRoute.providerName,
          source: "velora_ai_assistant"
        })
      });
      return {
        title: result.confirmationStatus === "pending" ? "Swap Submitted" : "Swap Completed",
        message: result.confirmationStatus === "pending" ? `${parsed.amount} ${from.symbol} swap to ${to.symbol} was submitted.` : `Swapped ${parsed.amount} ${from.symbol} to ${to.symbol}.`,
        txHash,
        explorerLink,
        details: [
          { label: "Provider", value: selectedRoute.providerName },
          { label: "Sold", value: `${parsed.amount} ${from.symbol}` },
          { label: "Estimated received", value: `${receivedAmount ?? "Confirmed"} ${to.symbol}` }
        ]
      };
    },
    [activity, appKitSwap, chainId, ensureGasBalance, ensureTokenAllowance, ensureTokenBalance, portfolio.positions, publicClient, sendTransactionRequest, setProgress, walletAddress]
  );

  const executeBridge = useCallback(
    async (parsed: ParsedCommand): Promise<AssistantActionResult> => {
      if (isUsdtRelated(parsed.token, parsed.receiveToken)) throw new Error(USDT_COMING_SOON_MESSAGE);
      if (!walletAddress) throw new Error("Connect wallet first.");
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
      await ensureGasBalance();
      const balance = fromChain.chainId === ARC_CHAIN_ID ? portfolio.positions.find((position) => position.token.symbol === "USDC")?.balance ?? null : null;
      setProgress("preparingTransaction", "Preparing bridge route");
      const request: RouteRequest = {
        routeType: "bridge",
        walletAddress,
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
            walletAddress,
            onStage: (stage, message) => {
              console.info("[Velora Assistant Bridge] lifecycle stage", {
                command: parsed,
                sourceChain: fromChain.name,
                destinationChain: toChain.name,
                provider: routeResult.route?.providerName,
                stage,
                message
              });
              if (stage === "approvalRequired" || stage === "waitingApprovalConfirmation" || stage === "waitingWalletConfirmation") setProgress("waitingWalletConfirmation", message);
              if (stage === "approvalCompleted" || stage === "preparingBridgeTransaction") setProgress("preparingTransaction", message);
              if (stage === "bridgeTransactionSubmitted" || stage === "sendingTransaction") setProgress("transactionSubmitted", message);
              if (
                stage === "sendingCrossChainMessage" ||
                stage === "waitingGateway" ||
                stage === "waitingDestinationSettlement" ||
                stage === "verifyingDestinationReceipt" ||
                stage === "waitingForBridgeMessage" ||
                stage === "waitingForDestinationConfirmation"
              ) {
                setProgress("confirmingOnchain", message);
              }
              if (stage === "bridgeCompleted") setProgress("completed", message);
            }
          }),
        sendTransaction: (transactionRequest) => sendTransactionRequest(transactionRequest, fromChain.chainId)
      });
      console.info("[Velora Assistant Bridge] execution result", {
        provider: routeResult.route.providerName,
        txHash: result.txHash,
        approvalTxHash: result.approvalTxHash,
        destinationTxHash: result.destinationTxHash,
        destinationExplorerLink: result.destinationExplorerLink,
        completionTime: result.completionTime,
        confirmationStatus: result.confirmationStatus,
        raw: result.raw
      });
      const txHash = result.txHash;
      const explorerLink = explorerTxUrl(fromChain.explorer, txHash);
      const destinationExplorerLink = result.destinationExplorerLink ?? (result.destinationTxHash ? explorerTxUrl(toChain.explorer, result.destinationTxHash) : null);
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
          approvalTxHash: result.approvalTxHash ?? null,
          destinationTxHash: result.destinationTxHash ?? null,
          destinationExplorerLink,
          completionTime: result.completionTime ?? null,
          source: "velora_ai_assistant"
        })
      });
      return {
        title: result.confirmationStatus === "pending" ? "Bridge in Progress" : "Bridge Completed",
        message:
          result.confirmationStatus === "pending"
            ? `${parsed.amount} USDC bridge from ${fromChain.name} to ${toChain.name} is in progress.`
            : `${parsed.amount} USDC bridge from ${fromChain.name} to ${toChain.name} completed.`,
        txHash,
        approvalTxHash: result.approvalTxHash,
        destinationTxHash: result.destinationTxHash,
        explorerLink,
        destinationExplorerLink,
        completionTime: result.completionTime,
        details: [
          { label: "Provider", value: routeResult.route.providerName },
          { label: "From", value: fromChain.name },
          { label: "To", value: toChain.name },
          { label: "Destination Wallet", value: walletAddress },
          { label: "Amount", value: `${parsed.amount} USDC` },
          ...(result.completionTime ? [{ label: "Completion Time", value: new Date(result.completionTime).toLocaleString() }] : [])
        ]
      };
    },
    [activity, chainId, ensureGasBalance, ensureTokenBalance, portfolio.positions, sendTransactionRequest, setProgress, walletAddress]
  );

  const readBalances = useCallback((): AssistantActionResult => {
    if (!isConnected || !walletAddress) throw new Error("Connect wallet first.");
    if (!portfolio.arcConnected) throw new Error("Please switch to the correct network.");
    const chain = getChainById(chainId);
    return {
      title: "Portfolio Summary",
      message: `Your connected wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} is on ${chain?.name ?? "the current network"} with an estimated portfolio value of ${portfolio.totalValueLabel}.`,
      details: [
        { label: "Wallet", value: walletAddress },
        { label: "Connected network", value: chain?.name ?? `Chain ${chainId}` },
        { label: "Total value", value: portfolio.totalValueLabel },
        ...portfolio.positions.map((position) => ({ label: `${position.token.symbol} balance`, value: `${position.balanceLabel} ${position.token.symbol}` }))
      ]
    };
  }, [chainId, isConnected, portfolio.arcConnected, portfolio.positions, portfolio.totalValueLabel, walletAddress]);

  const readRewards = useCallback((): AssistantActionResult => {
    if (!isConnected) throw new Error("Connect wallet first.");
    const nextAchievement = rewards.achievements.find((achievement) => !achievement.claimed);
    const claimedAchievements = rewards.achievements.filter((achievement) => achievement.claimed);
    return {
      title: "Rewards Summary",
      message: `You have ${rewards.xp.toLocaleString()} XP, a ${rewards.currentStreak}-day streak, and you need ${rewards.level.remaining.toLocaleString()} XP to reach Level ${rewards.level.nextLevel}.`,
      details: [
        { label: "XP", value: `${rewards.xp.toLocaleString()} XP` },
        { label: "Level", value: `${rewards.level.level}` },
        { label: "Current streak", value: `${rewards.currentStreak} Days` },
        { label: "Next level", value: `${rewards.level.remaining.toLocaleString()} XP to Level ${rewards.level.nextLevel}` },
        { label: "Next achievement", value: nextAchievement ? `${nextAchievement.title} (${Math.max(0, nextAchievement.requirement - rewards.xp).toLocaleString()} XP remaining)` : "All current XP achievements claimed" },
        { label: "Claimed achievements", value: claimedAchievements.length ? claimedAchievements.map((achievement) => achievement.title).join(", ") : "None claimed yet" },
        { label: "Early Pioneer Badge", value: rewards.earlyPioneerBadge.claimed ? "Claimed" : rewards.earlyPioneerBadge.readyToClaim ? "Ready to claim" : `${rewards.earlyPioneerBadge.progress}% complete` }
      ]
    };
  }, [isConnected, rewards.achievements, rewards.currentStreak, rewards.earlyPioneerBadge, rewards.level, rewards.xp]);

  const readProfile = useCallback((): AssistantActionResult => {
    if (!isConnected || !walletAddress) throw new Error("Connect wallet first.");
    const chain = getChainById(chainId);
    return {
      title: "Profile Summary",
      message: `Your connected profile is ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} on ${chain?.name ?? "the current network"}.`,
      details: [
        { label: "Wallet", value: walletAddress },
        { label: "Network", value: chain?.name ?? `Chain ${chainId}` },
        { label: "Portfolio", value: portfolio.totalValueLabel },
        { label: "XP", value: `${rewards.xp.toLocaleString()} XP` },
        { label: "Level", value: `${rewards.level.level}` },
        { label: "Current streak", value: `${rewards.currentStreak} Days` }
      ]
    };
  }, [chainId, isConnected, portfolio.totalValueLabel, rewards.currentStreak, rewards.level.level, rewards.xp, walletAddress]);

  const readTransactionHistory = useCallback((parsed?: ParsedCommand): AssistantActionResult => {
    if (!isConnected) throw new Error("Connect wallet first.");
    const question = parsed?.question ?? "";
    const requestedFeature = /swap/i.test(question) ? "swap" : /bridge/i.test(question) ? "bridge" : /\b(send|sent)\b/i.test(question) ? "send" : null;
    const recentActivities = activity.activities
      .filter((record) => ["swap", "bridge", "send", "faucet", "agent_payments"].includes(record.feature))
      .filter((record) => (requestedFeature ? record.feature === requestedFeature : true))
      .slice(0, 5);
    return {
      title: requestedFeature ? `${requestedFeature[0].toUpperCase()}${requestedFeature.slice(1)} History` : "Recent Transactions",
      message: recentActivities.length ? `I found ${recentActivities.length} recent ${requestedFeature ?? "wallet"} activity records.` : `No ${requestedFeature ?? "wallet"} transaction activity is recorded yet.`,
      details: recentActivities.length
        ? recentActivities.map((record) => ({
            label: `${record.title} - ${new Date(record.timestamp).toLocaleDateString()}`,
            value: `${record.amount ? `${record.amount} ${record.token ?? ""} - ` : ""}${record.status}${record.txHash ? ` - ${record.txHash.slice(0, 10)}...${record.txHash.slice(-6)}` : ""}`
          }))
        : [{ label: "Status", value: "No wallet activity yet" }]
    };
  }, [activity.activities, isConnected]);

  const createAutomationAlert = useCallback(
    (parsed: ParsedCommand): AssistantActionResult => {
      if (!isConnected || !walletAddress) throw new Error("Connect wallet first.");
      const command = parsed.question ?? "Assistant alert";
      const createdAt = new Date().toISOString();
      const rule: AssistantAutomationRule = {
        id: `assistant_alert_${Date.now()}`,
        command,
        type: automationTypeFromCommand(command),
        status: "active",
        createdAt
      };
      const rules = [rule, ...readAutomationRules(walletAddress)].slice(0, 25);
      writeAutomationRules(walletAddress, rules);
      activity.recordActivity({
        actionType: "ai_automation_created",
        title: "Assistant alert created",
        description: rule.command,
        feature: "automation",
        status: "info",
        metadata: cleanMetadata({
          alertType: rule.type,
          source: "velora_ai_assistant"
        })
      });
      return {
        title: "Alert Created",
        message: `${rule.type} created. This is notification-only and will never move funds automatically.`,
        details: [
          { label: "Alert", value: rule.command },
          { label: "Type", value: rule.type },
          { label: "Status", value: "Active" },
          { label: "Created", value: new Date(createdAt).toLocaleString() }
        ]
      };
    },
    [activity, isConnected, walletAddress]
  );

  const readOrPreviewLiquidity = useCallback(
    (parsed: ParsedCommand): AssistantActionResult => {
      if (parsed.liquidityAction === "show") {
        return {
          title: "Liquidity Pools",
          message: `Velora supports testnet preview pools for ${LIQUIDITY_POOLS.map((pool) => pool.pair).join(", ")}. ${LIQUIDITY_CONTRACT_NOTICE}`,
          details: [
            ...LIQUIDITY_POOLS.map((pool) => ({
              label: pool.pair,
              value: `${pool.status} - ${pool.availability === "coming-soon" ? "Coming Soon" : pool.totalLiquidityLabel}`
            })),
            { label: "Safety", value: LIQUIDITY_POOL_DISCLAIMER }
          ]
        };
      }

      if (!isConnected || !walletAddress) throw new Error("Connect wallet first.");
      if (chainId !== ARC_CHAIN_ID) throw new Error("Please switch to the correct network.");

      const pool = findLiquidityPoolByTokens(parsed.token, parsed.receiveToken);
      if (!pool) throw new Error("Liquidity pool unavailable for this pair.");
      if (!isLiquidityPoolActive(pool)) throw new Error(USDT_COMING_SOON_MESSAGE);

      if (parsed.liquidityAction === "remove") {
        return {
          title: "Remove Liquidity Preview",
          message: `I found the ${pool.pair} pool, but no verified on-chain LP position can be removed yet because pool contracts are not integrated.`,
          details: [
            { label: "Pair", value: pool.pair },
            { label: "Network", value: "Arc Testnet" },
            { label: "Status", value: "Testnet Preview" },
            { label: "Execution", value: LIQUIDITY_CONTRACT_NOTICE }
          ]
        };
      }

      if (!parsed.amount) throw new Error("Enter an amount.");
      const pairedAmount = estimatePairedAmount(parsed.amount);
      if (!pairedAmount) throw new Error("Enter a valid liquidity amount.");

      const tokenABalance = portfolio.positions.find((position) => position.token.symbol === pool.tokenA)?.balance ?? 0;
      const tokenBBalance = portfolio.positions.find((position) => position.token.symbol === pool.tokenB)?.balance ?? 0;
      const numericAmount = Number(parsed.amount);
      if (tokenABalance < numericAmount || tokenBBalance < numericAmount) throw new Error("Insufficient balance.");

      return {
        title: "Liquidity Preview Ready",
        message: `I prepared a safe preview for adding ${parsed.amount} ${pool.tokenA} and ${pairedAmount} ${pool.tokenB} to ${pool.pair}. No wallet transaction was requested because the pool contract integration is not live yet.`,
        details: [
          { label: "Pair", value: pool.pair },
          { label: "Token A", value: `${parsed.amount} ${pool.tokenA}` },
          { label: "Token B", value: `${pairedAmount} ${pool.tokenB}` },
          { label: "Estimated pool share", value: "Available after pool contract integration" },
          { label: "Network", value: "Arc Testnet" },
          { label: "Execution", value: LIQUIDITY_CONTRACT_NOTICE }
        ]
      };
    },
    [chainId, isConnected, portfolio.positions, walletAddress]
  );

  const openFaucetWorkflow = useCallback(
    (parsed: ParsedCommand): AssistantActionResult => {
      const targetWallet = parsed.destinationAddress ?? walletAddress;
      if (!targetWallet || !isAddress(targetWallet)) {
        throw new Error("Connect wallet first or include a valid wallet address.");
      }
      const requestedAsset = parsed.token ?? "USDC";
      if (typeof window === "undefined") {
        throw new Error("Faucet workflow is unavailable in this environment.");
      }
      const popup = window.open(CIRCLE_FAUCET_URL, "_blank", "noopener,noreferrer");
      if (!popup) {
        throw new Error("Faucet popup was blocked. Please allow popups and try again.");
      }
      activity.recordActivity({
        actionType: "faucet_claim",
        title: "Faucet opened",
        description: `Opened Circle faucet for ${requestedAsset}.`,
        feature: "faucet",
        token: requestedAsset,
        network: "Arc Testnet",
        status: "pending",
        metadata: cleanMetadata({
          walletAddress: targetWallet,
          faucetUrl: CIRCLE_FAUCET_URL,
          source: "velora_ai_assistant"
        })
      });
      return {
        title: "Faucet Workflow Opened",
        message: `I opened the official Circle faucet for ${requestedAsset}. Complete the request there to receive supported testnet assets.`,
        details: [
          { label: "Faucet", value: "Circle Faucet" },
          { label: "Requested asset", value: requestedAsset },
          { label: "Wallet", value: targetWallet },
          { label: "URL", value: CIRCLE_FAUCET_URL }
        ]
      };
    },
    [activity, walletAddress]
  );

  const answerKnowledgeQuestion = useCallback((parsed: ParsedCommand): AssistantActionResult => {
    const question = parsed.question ?? "";
    const entry = findAssistantKnowledgeAnswer(question);
    if (!entry) {
      return {
        title: "Focused on Velora AI",
        message: ASSISTANT_SCOPE_RESPONSE,
        details: [
          { label: "Scope", value: "Velora AI, Arc, Circle, stablecoins, and wallet actions" }
        ]
      };
    }
    return {
      title: entry.title,
      message: entry.answer,
      details: [
        { label: "Category", value: entry.category },
        ...(entry.relatedCommands?.length ? [{ label: "Try next", value: entry.relatedCommands.join(" | ") }] : [])
      ]
    };
  }, []);

  const executeAssistantAction = useCallback(
    async (parsed: ParsedCommand) => {
      if (isRunning) return null;
      setIsRunning(true);
      setProgress("validating", "Validating request");
      try {
        const requiresWallet = !["knowledge", "faucet"].includes(parsed.actionType) && !(parsed.actionType === "liquidity" && parsed.liquidityAction === "show");
        if (requiresWallet && (!isConnected || !walletAddress)) {
          console.warn("[Velora Assistant] wallet unavailable for action", {
            actionType: parsed.actionType,
            isConnected,
            wagmiAddress: address ?? null,
            walletClientAddress: walletClient?.account.address ?? null,
            chainId
          });
          throw new Error("Connect wallet first.");
        }
        setProgress("checkingWallet", "Checking wallet");
        let result: AssistantActionResult;
        if (parsed.actionType === "send") result = await executeSend(parsed);
        else if (parsed.actionType === "swap") result = await executeSwap(parsed);
        else if (parsed.actionType === "bridge") result = await executeBridge(parsed);
        else if (parsed.actionType === "balance") result = readBalances();
        else if (parsed.actionType === "rewards") result = readRewards();
        else if (parsed.actionType === "profile") result = readProfile();
        else if (parsed.actionType === "transactionHistory") result = readTransactionHistory(parsed);
        else if (parsed.actionType === "automation") result = createAutomationAlert(parsed);
        else if (parsed.actionType === "liquidity") result = readOrPreviewLiquidity(parsed);
        else if (parsed.actionType === "faucet") result = openFaucetWorkflow(parsed);
        else if (parsed.actionType === "knowledge") result = answerKnowledgeQuestion(parsed);
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
          title: assistantFailureTitle(parsed.actionType),
          message: normalized
        };
      } finally {
        setIsRunning(false);
      }
    },
    [activity, address, answerKnowledgeQuestion, chainId, createAutomationAlert, executeBridge, executeSend, executeSwap, isConnected, isRunning, openFaucetWorkflow, readBalances, readOrPreviewLiquidity, readProfile, readRewards, readTransactionHistory, rewards.canClaimDaily, rewards.currentStreak, rewards.cycleDay, rewards.dailyReward, setProgress, walletAddress, walletClient?.account.address]
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
