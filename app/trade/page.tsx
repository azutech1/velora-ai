"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowDownUp, Check, ChevronDown, ExternalLink, Loader2, RefreshCw, Repeat2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { erc20Abi, parseUnits, type Address, type Hex } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { cx } from "@/components/azu/utils";
import { NetworkLogo } from "@/components/token/NetworkLogo";
import { TokenLogo } from "@/components/token/TokenLogo";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useArcAppKitSwap } from "@/hooks/useArcAppKitSwap";
import { useCrossChainSwap } from "@/hooks/useCrossChainSwap";
import { useStablecoinPrices } from "@/hooks/useStablecoinPrices";
import { useSwapTokenBalance } from "@/hooks/useSwapTokenBalance";
import { useTransactions } from "@/hooks/useTransactions";
import type { ArcAppKitSwapEstimate } from "@/lib/appkit/swap";
import { getChainById } from "@/lib/config/chains";
import { getTokenAddress } from "@/lib/config/tokens";
import {
  arcNativeBridgeProvider,
  arcNativeSwapProvider,
  createProviderExecutionRoute,
  createTransactionRequestProvider,
  fallbackProvider,
  findExecutableRoute,
  lifiBridgeProvider,
  lifiSwapProvider,
  stablefxProvider,
  type ExecutableRoute,
  type RouteRequest
} from "@/lib/routes/router";
import { CROSS_CHAIN_NETWORKS, type BridgeNetwork } from "@/lib/swap/networks";
import { SWAP_TOKENS, getSwapToken, type SwapToken } from "@/lib/swap/tokens";
import { getTradeProviderPriority, shouldPreferArcNativeRoute } from "@/lib/trade/provider-priority";
import { explorerTxUrl } from "@/lib/utils/format";
import { ARC_EXPLORER_URL } from "@/lib/web3/chains";

type TradeTab = "swap" | "bridge";

type ComingSoonToken = {
  symbol: string;
  name: string;
};

type SwapInputMode = "exactIn" | "exactOut";

const ACTIVE_STABLECOINS = ["USDC", "EURC", "USDT"] as const;

const COMING_SOON_SYMBOLS = new Set(["WETH", "WBTC", "ETH", "BTC"]);

type LifiEstimate = {
  toAmount: string | null;
  toAmountMin: string | null;
  provider: string;
  gasEstimateUsd: string | null;
  feeEstimateUsd: string | null;
  approvalAddress: string | null;
  fromAmount: string | null;
  fromTokenAddress: string | null;
  fromChainId: number | null;
  transactionRequest: {
    to?: string;
    from?: string;
    data?: string;
    value?: string;
    gas?: string;
    gasLimit?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    chainId?: number;
  } | null;
};

const NATIVE_TOKEN_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

function parseOptionalBigInt(value?: string) {
  if (!value) return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

function isNativeOrZeroAddress(value?: string | null) {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return normalized === NATIVE_TOKEN_ADDRESS || normalized === "0x0000000000000000000000000000000000000000";
}

function formatPrice(value: number) {
  return `$${value.toFixed(4)}`;
}

function formatChange(change: number) {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

function formatDisplayAmount(value: number) {
  if (!Number.isFinite(value)) return "";
  return value.toFixed(4).replace(/\.?0+$/, "");
}

function serializeSwapError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    };
  }

  if (error && typeof error === "object") {
    try {
      return JSON.parse(JSON.stringify(error)) as Record<string, unknown>;
    } catch {
      return { message: Object.prototype.toString.call(error) };
    }
  }

  return { message: String(error) };
}

function extractSwapErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  const serialized = serializeSwapError(error);
  const candidates = [
    serialized.message,
    serialized.shortMessage,
    serialized.details,
    serialized.reason,
    serialized.code ? `Wallet error code ${serialized.code}` : undefined
  ];
  const message = candidates.find((candidate): candidate is string => typeof candidate === "string" && candidate.trim().length > 0);
  return message ?? "Swap execution failed before wallet confirmation.";
}

function formatLifiAmount(value: string | null | undefined, decimals = 6) {
  if (!value) return "";
  const numeric = Number(value) / 10 ** decimals;
  return formatDisplayAmount(numeric);
}

function calculateRequiredSellAmount(receiveAmount: string, sellPrice: number, buyPrice: number) {
  const desiredReceive = Number(receiveAmount);
  if (!Number.isFinite(desiredReceive) || desiredReceive <= 0 || sellPrice <= 0) return "";
  const required = (desiredReceive * buyPrice) / sellPrice;
  return formatDisplayAmount(required * 1.0004);
}

function hasExecutableTransactionRequest(quote: LifiEstimate | null) {
  return Boolean(quote?.transactionRequest?.to && quote.transactionRequest.data);
}

function PriceTicker() {
  const prices = useStablecoinPrices();
  const rows = (["USDC", "EURC", "USDT"] as const).map((symbol) => prices.prices[symbol]);

  return (
    <section className="glass rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">Stablecoin ticker</p>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {prices.refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan" /> : <RefreshCw className="h-3.5 w-3.5 text-cyan" />}
          {prices.loading ? "Loading prices..." : `Updated ${new Date(prices.fetchedAt).toLocaleTimeString()}`}
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {rows.map((row) => (
          <div key={row.symbol} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{row.symbol}</span>
              <span className={row.change24h >= 0 ? "text-xs text-mint" : "text-xs text-red-300"}>{formatChange(row.change24h)}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-white">{formatPrice(row.price)}</p>
          </div>
        ))}
      </div>
      {prices.source === "fallback" ? (
        <div className="mt-3 inline-flex rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">Fallback pricing</div>
      ) : null}
      {prices.stale ? (
        <p className="mt-2 text-xs text-amber-300">Latest market prices may be delayed.</p>
      ) : null}
    </section>
  );
}

function TokenPicker({
  label,
  selected,
  activeTokens,
  comingSoon,
  onSelect
}: {
  label: string;
  selected: SwapToken;
  activeTokens: SwapToken[];
  comingSoon: ComingSoonToken[];
  onSelect: (token: SwapToken) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filteredActive = activeTokens.filter((token) => `${token.symbol} ${token.name}`.toLowerCase().includes(query.toLowerCase()));
  const filteredSoon = comingSoon.filter((token) => `${token.symbol} ${token.name}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-cyan/40">
        <span className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            <TokenLogo symbol={selected.symbol} size={34} />
            <span>
              <span className="block font-semibold text-white">{selected.symbol}</span>
              <span className="block text-xs text-slate-400">{selected.name}</span>
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 18, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 18, scale: 0.97 }} className="glass max-h-[86vh] w-full max-w-2xl overflow-hidden rounded-lg">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div>
                  <p className="text-sm text-slate-400">{label}</p>
                  <h2 className="text-xl font-bold text-white">Select token</h2>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white" aria-label="Close token selector">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5">
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan/60" placeholder="Search stablecoins and coming soon tokens" />
                </label>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Active</p>
                <div className="mt-2 space-y-2">
                  {filteredActive.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => {
                        onSelect(token);
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-cyan/45 hover:bg-cyan/10"
                    >
                      <span className="flex items-center gap-3">
                        <TokenLogo symbol={token.symbol} size={30} />
                        <span>
                          <span className="block font-semibold text-white">{token.symbol}</span>
                          <span className="block text-xs text-slate-400">{token.name}</span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Coming Soon</p>
                <div className="mt-2 space-y-2">
                  {filteredSoon.map((token) => (
                    <div key={token.symbol} className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3 opacity-70">
                      <span>
                        <span className="block font-semibold text-white">{token.symbol}</span>
                        <span className="block text-xs text-slate-400">{token.name}</span>
                      </span>
                      <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-xs font-semibold text-cyan">Coming Soon</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function NetworkPicker({ label, value, onSelect }: { label: string; value: BridgeNetwork; onSelect: (network: BridgeNetwork) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-cyan/40">
        <span className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <NetworkLogo id={value.iconId} size={30} />
            <span>
              <span className="block font-semibold text-white">{value.name}</span>
              <span className="block text-xs text-slate-400">Chain ID {value.chainId}</span>
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 18, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 18, scale: 0.97 }} className="glass w-full max-w-xl rounded-lg p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{label}</p>
                  <h2 className="text-xl font-bold text-white">Select network</h2>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white" aria-label="Close network selector">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {CROSS_CHAIN_NETWORKS.map((network) => (
                  <button
                    key={network.id}
                    onClick={() => {
                      onSelect(network);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-cyan/45 hover:bg-cyan/10"
                  >
                    <span className="flex items-center gap-3">
                      <NetworkLogo id={network.iconId} size={30} />
                      <span className="font-semibold text-white">{network.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export default function TradePage() {
  const { isConnected, address, chainId: walletChainId } = useAccount();
  const queryClient = useQueryClient();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { recordActivity } = useActivityRecorder();
  const autoSwapQuoteRef = useRef<() => void>(() => undefined);
  const appKitSwap = useArcAppKitSwap();
  const bridge = useCrossChainSwap();
  const prices = useStablecoinPrices();
  const transactions = useTransactions();
  const [tab, setTab] = useState<TradeTab>("swap");
  const [sellToken, setSellToken] = useState(getSwapToken("USDC"));
  const [buyToken, setBuyToken] = useState(getSwapToken("EURC"));
  const [swapAmount, setSwapAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [swapInputMode, setSwapInputMode] = useState<SwapInputMode>("exactIn");
  const [swapQuoteReady, setSwapQuoteReady] = useState(false);
  const [, setSwapMessage] = useState("");
  const [swapQuoteLoading, setSwapQuoteLoading] = useState(false);
  const [swapQuoteWarning, setSwapQuoteWarning] = useState("");
  const [swapQuoteKey, setSwapQuoteKey] = useState("");
  const [swapSuccess, setSwapSuccess] = useState<{ txHash: string; sentAmount: string; sentToken: SwapToken; receivedAmount: string; receivedToken: SwapToken } | null>(null);
  const [swapFailure, setSwapFailure] = useState<{ title: string; message: string; raw?: string } | null>(null);
  const [swapQuoteTimestamp, setSwapQuoteTimestamp] = useState<number | null>(null);
  const [swapWalletWaiting, setSwapWalletWaiting] = useState(false);
  const [swapSubmitting, setSwapSubmitting] = useState(false);
  const [bridgeQuoteReady, setBridgeQuoteReady] = useState(false);
  const [bridgeMessage, setBridgeMessage] = useState("");
  const [liveQuoteUnavailable, setLiveQuoteUnavailable] = useState(false);
  const [lifiQuote, setLifiQuote] = useState<LifiEstimate | null>(null);
  const [swapRoute, setSwapRoute] = useState<ExecutableRoute | null>(null);
  const [swapQuoteOnlyRoute, setSwapQuoteOnlyRoute] = useState<{ providerName: string; toAmount: string; reason: string } | null>(null);
  const [bridgeRoute, setBridgeRoute] = useState<ExecutableRoute | null>(null);
  const swapQuoteRequestIdRef = useRef(0);

  const activeTokens = useMemo(() => ACTIVE_STABLECOINS.map((symbol) => getSwapToken(symbol)).filter(Boolean), []);
  const sellTokenBalance = useSwapTokenBalance(sellToken);
  const buyTokenBalance = useSwapTokenBalance(buyToken);
  const bridgeToken = getSwapToken(bridge.tokenSymbol);
  const bridgeTokenBalance = useSwapTokenBalance(bridgeToken);
  const hasSellBalance = typeof sellTokenBalance.numericBalance === "number" && sellTokenBalance.numericBalance > 0;
  const balanceActionDisabled = !hasSellBalance || sellTokenBalance.isLoading;
  const hasBridgeBalance = typeof bridgeTokenBalance.numericBalance === "number" && bridgeTokenBalance.numericBalance > 0;
  const bridgeMaxDisabled = !hasBridgeBalance || bridgeTokenBalance.isLoading;
  const bridgeHasExecutableQuote = Boolean(bridgeRoute);
  const comingSoonTokens = useMemo<ComingSoonToken[]>(() => {
    const merged = SWAP_TOKENS.filter((token) => COMING_SOON_SYMBOLS.has(token.symbol)).map((token) => ({ symbol: token.symbol, name: token.name }));
    return merged.filter((item, index) => merged.findIndex((candidate) => candidate.symbol.toLowerCase() === item.symbol.toLowerCase()) === index);
  }, []);

  const liveSellPrice = prices.prices[sellToken.symbol as "USDC" | "EURC" | "USDT"]?.price ?? sellToken.mockPrice;
  const liveBuyPrice = prices.prices[buyToken.symbol as "USDC" | "EURC" | "USDT"]?.price ?? buyToken.mockPrice;
  const estimatedReceive = receiveAmount ? Number(receiveAmount) : lifiQuote?.toAmount ? Number(lifiQuote.toAmount) / 1_000_000 : appKitSwap.estimate?.estimatedOutput?.amount ? Number(appKitSwap.estimate.estimatedOutput.amount) : 0;
  const rate = liveSellPrice / Math.max(liveBuyPrice, 0.0001);
  const requiredSellAmount = calculateRequiredSellAmount(receiveAmount, liveSellPrice, liveBuyPrice);
  const realSwapEnabled = appKitSwap.canUseRealSwap(sellToken.symbol, buyToken.symbol);
  const hasDifferentSwapTokens = sellToken.symbol !== buyToken.symbol;
  const hasValidSwapAmount =
    hasDifferentSwapTokens &&
    (swapInputMode === "exactIn"
      ? Number.isFinite(Number(swapAmount)) && Number(swapAmount) > 0
      : Number.isFinite(Number(receiveAmount)) && Number(receiveAmount) > 0 && Number.isFinite(Number(requiredSellAmount)) && Number(requiredSellAmount) > 0);
  const isLifiEnabled = process.env.NEXT_PUBLIC_LIFI_ENABLED !== "false";
  const providerPriority = useMemo(
    () =>
      getTradeProviderPriority({
        fromChainId: bridge.fromNetwork.chainId,
        toChainId: bridge.fromNetwork.chainId,
        fromToken: sellToken.symbol,
        toToken: buyToken.symbol,
        lifiEnabled: isLifiEnabled
      }),
    [bridge.fromNetwork.chainId, buyToken.symbol, isLifiEnabled, sellToken.symbol]
  );
  const preferredProvider = providerPriority[0];
  const arcNativePreferred = shouldPreferArcNativeRoute({
    fromChainId: bridge.fromNetwork.chainId,
    toChainId: bridge.fromNetwork.chainId,
    fromToken: sellToken.symbol,
    toToken: buyToken.symbol,
    lifiEnabled: isLifiEnabled
  });
  const currentSwapQuoteKey = `${bridge.fromNetwork.chainId}:${sellToken.symbol}:${buyToken.symbol}:${swapInputMode}:${swapInputMode === "exactIn" ? swapAmount : receiveAmount}`;
  const swapRouteMatchesCurrentInput = Boolean(swapQuoteKey && swapQuoteKey === currentSwapQuoteKey);
  const showSwapQuoteDetails = hasValidSwapAmount && (swapQuoteLoading || swapQuoteReady || Boolean(receiveAmount) || Boolean(swapRoute) || Boolean(swapQuoteOnlyRoute) || Boolean(swapQuoteWarning));
  const swapPrimaryBusy = swapWalletWaiting || swapSubmitting || appKitSwap.state === "swapping" || transactions.isPending;
  const swapTransactionRequest = lifiQuote?.transactionRequest ?? null;
  const swapTransactionRequestChainId = swapTransactionRequest?.chainId ?? bridge.fromNetwork.chainId;
  const swapHasExecutableQuote = hasExecutableTransactionRequest(lifiQuote);
  const swapQuoteExpired = Boolean(swapQuoteTimestamp && Date.now() - swapQuoteTimestamp > 60_000);
  const appKitQuoteMatches =
    appKitSwap.estimate?.diagnostics?.tokenIn === sellToken.symbol &&
    appKitSwap.estimate?.diagnostics?.tokenOut === buyToken.symbol &&
    appKitSwap.estimate?.diagnostics?.amountIn === swapAmount;
  const appKitQuoteExpired = Boolean(appKitSwap.estimate?.diagnostics?.expiresAt && Date.now() > appKitSwap.estimate.diagnostics.expiresAt);
  const swapProviderEstimate = swapRoute?.executionMode === "provider" ? (swapRoute.quote.raw as ArcAppKitSwapEstimate | null) : null;
  const swapProviderQuoteExpired = Boolean(swapProviderEstimate?.diagnostics?.expiresAt && Date.now() > swapProviderEstimate.diagnostics.expiresAt);
  const swapHasProviderQuote =
    Boolean(swapRoute?.executionMode === "provider" && swapProviderEstimate?.estimatedOutput) &&
    swapProviderEstimate?.diagnostics?.tokenIn === sellToken.symbol &&
    swapProviderEstimate?.diagnostics?.tokenOut === buyToken.symbol &&
    swapProviderEstimate?.diagnostics?.amountIn === swapAmount &&
    !swapProviderQuoteExpired;
  const swapHasQuoteOnlyRoute = Boolean(swapQuoteOnlyRoute && swapRouteMatchesCurrentInput);
  const swapHasAppKitQuote = realSwapEnabled && Boolean(appKitSwap.estimate?.estimatedOutput) && appKitQuoteMatches && !appKitQuoteExpired;
  const swapHasProviderExecutableRoute = false;
  const swapHasAppKitExecutableQuote = false;
  const swapCanExecute =
    Boolean(isConnected && address) &&
    walletChainId === bridge.fromNetwork.chainId &&
    hasValidSwapAmount &&
    swapQuoteReady &&
    swapRouteMatchesCurrentInput &&
    !swapQuoteExpired &&
    Boolean(swapRoute) &&
    (swapHasProviderExecutableRoute || swapHasAppKitExecutableQuote || (swapHasExecutableQuote && swapTransactionRequestChainId === walletChainId));
  const swapExecutionNotice = !isConnected
    ? "Connect wallet to swap."
    : walletChainId !== bridge.fromNetwork.chainId
      ? "Switch to Arc Testnet."
      : !hasValidSwapAmount
        ? ""
        : swapQuoteExpired
          ? "Quote expired."
          : swapInputMode === "exactOut"
            ? "Exact receive quote is not available for this route."
          : swapProviderQuoteExpired
            ? "Quote expired."
          : swapHasProviderQuote || swapHasAppKitQuote || swapHasQuoteOnlyRoute
            ? "Quote available but executable route generation failed."
          : liveQuoteUnavailable || (swapQuoteReady && swapRouteMatchesCurrentInput && !swapHasExecutableQuote && !swapHasAppKitExecutableQuote && !swapHasProviderExecutableRoute)
              ? "No executable route available for this token pair."
              : swapHasExecutableQuote && swapTransactionRequestChainId !== walletChainId
                ? "Switch to Arc Testnet."
                : !swapQuoteReady || !swapRouteMatchesCurrentInput
                  ? swapQuoteLoading ? "Loading quote..." : "No executable route available for this token pair."
                  : "";
  const swapPrimaryLabel = swapWalletWaiting
    ? "Waiting for Wallet..."
    : swapSubmitting || appKitSwap.state === "swapping" || transactions.isPending
      ? "Swapping..."
      : "Swap";
  const swapQuoteTriggerValue = swapInputMode === "exactIn" ? swapAmount : receiveAmount;
  const swapRouteLabel = swapQuoteLoading && !swapRouteMatchesCurrentInput ? "Searching best route..." : swapRouteMatchesCurrentInput && swapRoute ? swapRoute.providerName : swapHasQuoteOnlyRoute ? swapQuoteOnlyRoute?.providerName ?? "Quote-only route" : "No executable route available";
  const swapFeeLabel = swapRouteMatchesCurrentInput && lifiQuote?.feeEstimateUsd ? `$${lifiQuote.feeEstimateUsd}` : swapRouteMatchesCurrentInput && (swapRoute || swapQuoteOnlyRoute) ? "Not returned by provider" : "--";
  const swapPriceImpactLabel = swapRouteMatchesCurrentInput && (swapRoute || swapQuoteOnlyRoute) ? "Not returned by provider" : "--";
  const swapEtaLabel = swapRouteMatchesCurrentInput && swapRoute ? "On-chain confirmation" : swapHasQuoteOnlyRoute ? "Not executable" : "--";

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
      throw new Error(payload?.error ?? "Live quote unavailable.");
    }
    const payload = (await response.json()) as { estimate?: LifiEstimate };
    if (!payload.estimate) {
      throw new Error("Live quote unavailable.");
    }
    return payload.estimate;
  }

  function debugSwap(label: string, details: Record<string, unknown> = {}) {
    if (process.env.NODE_ENV === "production") return;
    console.info(`[Velora Swap Debug] ${label}`, {
      walletAddress: address ?? null,
      walletChainId: walletChainId ?? null,
      expectedChainId: bridge.fromNetwork.chainId,
      sellToken: sellToken.symbol,
      receiveToken: buyToken.symbol,
      sellAmount: swapAmount,
      parsedAmount: Number(swapAmount),
      sellTokenDecimals: sellToken.decimals,
      receiveTokenDecimals: buyToken.decimals,
      sellTokenAddress: getTokenAddress(sellToken.symbol, bridge.fromNetwork.chainId),
      receiveTokenAddress: getTokenAddress(buyToken.symbol, bridge.fromNetwork.chainId),
      receiveAmount: receiveAmount || (Number.isFinite(estimatedReceive) ? formatDisplayAmount(estimatedReceive) : ""),
      quoteReady: swapQuoteReady,
      selectedProvider: swapRoute?.providerName ?? null,
      quoteOnlyProvider: swapQuoteOnlyRoute?.providerName ?? null,
      quoteOnlyReason: swapQuoteOnlyRoute?.reason ?? null,
      providerExecutionMode: swapRoute?.executionMode ?? null,
      providerQuote: swapRoute?.quote ?? null,
      providerDiagnostics: swapRoute?.diagnostics ?? null,
      liveQuoteUnavailable,
      transactionRequestExists: Boolean(lifiQuote?.transactionRequest),
      transactionRequestTo: lifiQuote?.transactionRequest?.to ?? null,
      transactionRequestDataLength: lifiQuote?.transactionRequest?.data?.length ?? 0,
      transactionRequestValue: lifiQuote?.transactionRequest?.value ?? null,
      transactionRequestChainId: lifiQuote?.transactionRequest?.chainId ?? null,
      quoteResponse: lifiQuote,
      ...details
    });
  }

  function debugRoute(label: string, details: Record<string, unknown> = {}) {
    if (process.env.NODE_ENV === "production") return;
    console.info(`[Velora Route Debug] ${label}`, details);
  }

  function swapFailureFromError(error: unknown) {
    const raw = extractSwapErrorMessage(error);
    const lower = raw.toLowerCase();
    if (lower.includes("user rejected") || lower.includes("user denied") || lower.includes("rejected") || lower.includes("4001")) {
      return { title: "Wallet rejected transaction", message: "Wallet rejected transaction.", raw };
    }
    if (lower.includes("insufficient")) {
      return { title: "Insufficient balance", message: "Insufficient balance.", raw };
    }
    if (lower.includes("chain") || lower.includes("network")) {
      return { title: "Wrong network", message: "Switch to Arc Testnet.", raw };
    }
    if (lower.includes("missing transaction request") || lower.includes("transaction request")) {
      return { title: "Missing transaction request", message: "Missing transaction request.", raw };
    }
    if (lower.includes("expired")) {
      return { title: "Quote expired", message: "Quote expired.", raw };
    }
    if (lower.includes("createswap") || lower.includes("stablecoin service") || lower.includes("failed to fetch") || lower.includes("maximum retry attempts")) {
      return {
        title: "Swap service unavailable",
        message: "The swap service could not create a wallet transaction for this route. Try again later or use another pair.",
        raw
      };
    }
    if (lower.includes("revert") || lower.includes("contract") || lower.includes("call failed")) {
      return { title: "Contract call failed", message: "Contract call failed.", raw };
    }
    if (lower.includes("unavailable") || lower.includes("preview")) {
      return { title: "Route unavailable", message: "No live executable route is available for this pair yet.", raw };
    }
    return { title: "Execution failed", message: process.env.NODE_ENV === "production" ? raw : `Execution failed: ${raw}`, raw };
  }

  async function ensureLifiAllowance(quote: LifiEstimate, feature: "swap" | "bridge") {
    if (!walletClient || !publicClient || !address) {
      throw new Error("Connect wallet before approving token allowance.");
    }

    const tokenAddress = quote.fromTokenAddress;
    const spender = quote.approvalAddress ?? quote.transactionRequest?.to ?? null;
    const requiredAmount = parseOptionalBigInt(quote.fromAmount ?? undefined);

    if (isNativeOrZeroAddress(tokenAddress) || !spender || !requiredAmount || requiredAmount <= BigInt(0)) {
      return null;
    }

    const allowance = (await publicClient.readContract({
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [address as Address, spender as Address]
    })) as bigint;

    if (allowance >= requiredAmount) {
      return null;
    }

    recordActivity({
      actionType: feature === "swap" ? "swap_started" : "bridge_execution_started",
      title: feature === "swap" ? "Token approval required" : "Bridge token approval required",
      description: "Wallet approval is required before the selected token can be swapped.",
      feature,
      token: feature === "swap" ? `${sellToken.symbol}/${buyToken.symbol}` : bridge.tokenSymbol,
      amount: feature === "swap" ? swapAmount : bridge.amount,
      network: feature === "bridge" ? `${bridge.fromNetwork.name} -> ${bridge.toNetwork.name}` : undefined,
      status: "pending",
      metadata: feature === "bridge" ? getBridgeActivityMetadata("approval_required", quote) : undefined
    });

    const approvalHash = await walletClient.writeContract({
      account: address as Address,
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender as Address, requiredAmount]
    });

    recordActivity({
      actionType: feature === "swap" ? "swap_started" : "bridge_transaction_submitted",
      title: feature === "swap" ? "Token approval submitted" : "Bridge token approval submitted",
      description: "Approval transaction submitted. Velora AI will execute the route after confirmation.",
      feature,
      token: feature === "swap" ? `${sellToken.symbol}/${buyToken.symbol}` : bridge.tokenSymbol,
      amount: feature === "swap" ? swapAmount : bridge.amount,
      network: feature === "bridge" ? `${bridge.fromNetwork.name} -> ${bridge.toNetwork.name}` : undefined,
      status: "pending",
      txHash: approvalHash,
      metadata: feature === "bridge" ? getBridgeActivityMetadata("approval_submitted", quote) : undefined
    });

    await transactions.trackTransaction(approvalHash);
    return approvalHash;
  }

  async function preflightLifiTransaction(quote: LifiEstimate) {
    if (!publicClient || !address) return;
    const request = quote.transactionRequest;
    if (!request?.to || !request.data) return;

    try {
      await publicClient.estimateGas({
        account: address as Address,
        to: request.to as Address,
        data: request.data as Hex,
        value: parseOptionalBigInt(request.value)
      });
    } catch (error) {
      console.warn("[Velora AI] Swap route preflight reverted", {
        routeProvider: quote.provider,
        to: request.to,
        fromToken: quote.fromTokenAddress,
        approvalAddress: quote.approvalAddress,
        error
      });
      throw new Error("Swap is unavailable right now. Try a smaller amount or wait for the estimate to refresh. No gas was spent.");
    }
  }

  function getSwapActivityMetadata(trackingStatus: string, quote: LifiEstimate | null = lifiQuote) {
    return {
      tradeType: "swap",
      quoteDirection: swapInputMode,
      fromToken: sellToken.symbol,
      toToken: buyToken.symbol,
      fromAmount: swapAmount,
      requestedReceiveAmount: receiveAmount || null,
      estimatedReceiveAmount: quote?.toAmount ? formatLifiAmount(quote.toAmount, buyToken.decimals) : formatDisplayAmount(estimatedReceive),
      fromChain: bridge.fromNetwork.name,
      toChain: bridge.fromNetwork.name,
      fromChainIconId: bridge.fromNetwork.iconId,
      toChainIconId: bridge.fromNetwork.iconId,
      routeProvider: quote?.provider ?? preferredProvider.label,
      quoteMode: quote?.transactionRequest ? "live" : liveQuoteUnavailable ? "fallback" : "preview",
      trackingStatus
    };
  }

  function getBridgeActivityMetadata(trackingStatus: string, quote: LifiEstimate | null = lifiQuote) {
    return {
      tradeType: "bridge",
      token: bridge.tokenSymbol,
      fromAmount: bridge.amount,
      estimatedReceiveAmount: quote?.toAmount ? formatLifiAmount(quote.toAmount, 6) : formatDisplayAmount(bridge.quote.estimatedReceive),
      fromChain: bridge.fromNetwork.name,
      toChain: bridge.toNetwork.name,
      fromChainIconId: bridge.fromNetwork.iconId,
      toChainIconId: bridge.toNetwork.iconId,
      routeProvider: quote?.provider ?? bridge.quote.route,
      quoteMode: quote?.transactionRequest ? "live" : "preview",
      trackingStatus,
      bridgeFee: quote?.feeEstimateUsd ? `$${quote.feeEstimateUsd}` : `${formatDisplayAmount(bridge.quote.bridgeFee)} ${bridge.tokenSymbol}`,
      eta: bridge.quote.estimatedTime
    };
  }

  async function executeLifiTransaction(quote: LifiEstimate, feature: "swap" | "bridge", onSubmitted?: (hash: Hex) => void) {
    if (!walletClient || !address) {
      throw new Error("Connect wallet to execute this transaction.");
    }

    const request = quote.transactionRequest;
    if (!request?.to || !request.data) {
      throw new Error("Missing transaction request.");
    }

    const requestChainId = request.chainId ?? bridge.fromNetwork.chainId;
    if (walletChainId !== requestChainId) {
      throw new Error("Wrong network.");
    }

    await ensureLifiAllowance(quote, feature);
    await preflightLifiTransaction(quote);

    debugSwap("sendTransaction request", {
      feature,
      requestTo: request.to,
      requestData: request.data,
      requestValue: request.value,
      requestChainId,
      walletChainId
    });

    let hash: Hex;
    try {
      hash = await walletClient.sendTransaction({
        account: address as Address,
        to: request.to as Address,
        data: request.data as Hex,
        value: parseOptionalBigInt(request.value),
        gas: parseOptionalBigInt(request.gas ?? request.gasLimit),
        maxFeePerGas: parseOptionalBigInt(request.maxFeePerGas),
        maxPriorityFeePerGas: parseOptionalBigInt(request.maxPriorityFeePerGas)
      });
    } catch (error) {
      debugSwap("sendTransaction error", { error });
      throw error;
    }
    onSubmitted?.(hash);

    recordActivity({
      actionType: feature === "swap" ? "swap_started" : "bridge_transaction_submitted",
      title: feature === "swap" ? "Swap transaction submitted" : "Bridge transaction submitted",
      description: "Wallet submitted the transaction.",
      feature,
      token: feature === "swap" ? `${sellToken.symbol}/${buyToken.symbol}` : bridge.tokenSymbol,
      amount: feature === "swap" ? swapAmount : bridge.amount,
      status: "pending",
      txHash: hash,
      metadata: feature === "swap" ? getSwapActivityMetadata("transaction_submitted", quote) : getBridgeActivityMetadata("transaction_submitted", quote)
    });

    const receipt = await transactions.trackTransaction(hash);
    if (receipt?.status === "reverted") {
      throw new Error("Wallet transaction reverted.");
    }
    return hash;
  }

  async function requestCurrentSwapLifiQuote() {
    const chainId = bridge.fromNetwork.chainId;
    const fromTokenAddress = getTokenAddress(sellToken.symbol, chainId);
    const toTokenAddress = getTokenAddress(buyToken.symbol, chainId);
    const fromChain = getChainById(chainId);

    if (!address || !fromChain || !fromTokenAddress || !toTokenAddress) {
      throw new Error("Live route is unavailable for the selected token pair.");
    }

    return requestLifiQuote({
      fromChain: fromChain.lifiChainId,
      toChain: fromChain.lifiChainId,
      fromToken: fromTokenAddress,
      toToken: toTokenAddress,
      fromAmount: parseUnits(swapAmount, sellToken.decimals).toString(),
      fromAddress: address,
      slippage: 0.5
    });
  }

  useEffect(() => {
    recordActivity({
      actionType: "trade_tab_opened",
      title: tab === "swap" ? "Swap tab opened" : "Bridge tab opened",
      description: tab === "swap" ? "User opened Bridge & Swap swap tab." : "User opened Bridge & Swap bridge tab.",
      feature: tab === "swap" ? "swap" : "bridge",
      status: "info"
    });
  }, [recordActivity, tab]);

  useEffect(() => {
    setSwapQuoteReady(false);
    setSwapSuccess(null);
    setSwapFailure(null);
    setLifiQuote(null);
    setSwapRoute(null);
    setSwapQuoteOnlyRoute(null);
    setSwapQuoteTimestamp(null);
    setSwapQuoteKey("");
    setSwapQuoteWarning("");
    setReceiveAmount("");
    setSwapMessage("");
  }, [bridge.fromNetwork.chainId, buyToken.symbol, sellToken.symbol]);

  useEffect(() => {
    setBridgeQuoteReady(false);
    setBridgeRoute(null);
    setLifiQuote(null);
    setBridgeMessage("");
  }, [bridge.amount, bridge.fromNetwork.chainId, bridge.toNetwork.chainId, bridge.tokenSymbol]);

  useEffect(() => {
    if (swapInputMode !== "exactOut") return;
    const nextRequiredSell = calculateRequiredSellAmount(receiveAmount, liveSellPrice, liveBuyPrice);
    setSwapAmount((current) => (current === nextRequiredSell ? current : nextRequiredSell));
  }, [liveBuyPrice, liveSellPrice, receiveAmount, swapInputMode]);

  function setPercent(percent: 0.5 | 1) {
    const available = sellTokenBalance.numericBalance ?? 0;
    setSwapInputMode("exactIn");
    if (available <= 0) {
      setSwapAmount("");
      return;
    }

    const value = available * percent;
    const precision = sellToken.decimals > 6 ? 6 : 2;
    const formatted = value.toFixed(precision).replace(/\.?0+$/, "");
    setSwapAmount(formatted || "0");
    setSwapQuoteWarning("");
  }

  function handleSellAmountChange(value: string) {
    setSwapInputMode("exactIn");
    setSwapAmount(value);
    setSwapQuoteWarning("");
    setSwapMessage("");
  }

  function handleReceiveAmountChange(value: string) {
    setSwapInputMode("exactOut");
    setReceiveAmount(value);
    setSwapAmount(calculateRequiredSellAmount(value, liveSellPrice, liveBuyPrice));
    setSwapQuoteWarning("");
    setSwapMessage("");
  }

  function setBridgeMaxAmount() {
    const available = bridgeTokenBalance.numericBalance ?? 0;
    if (available <= 0) return;
    const precision = bridgeToken.decimals > 6 ? 6 : 2;
    const formatted = available.toFixed(precision).replace(/\.?0+$/, "");
    bridge.setAmount(formatted || "0");
  }

  async function handleSwapQuote({ silent = false }: { silent?: boolean } = {}) {
    const requestId = swapQuoteRequestIdRef.current + 1;
    swapQuoteRequestIdRef.current = requestId;
    const requestKey = currentSwapQuoteKey;
    setSwapMessage("");
    setSwapSuccess(null);
    setSwapQuoteWarning("");
    setSwapQuoteLoading(true);
    debugSwap("quote request scheduled", { requestId, requestKey });
    if (!silent) {
      recordActivity({
        actionType: "quote_requested",
        title: "Swap quote requested",
        description: `Requested quote for ${swapAmount} ${sellToken.symbol} to ${buyToken.symbol}.`,
        feature: "swap",
        token: `${sellToken.symbol}/${buyToken.symbol}`,
        amount: swapAmount,
        status: "pending",
        metadata: getSwapActivityMetadata("quote_requested")
      });
    }

    try {
      if (!isConnected || !address) {
        setSwapMessage("Connect wallet to request a quote.");
        setSwapQuoteWarning("Connect wallet first.");
        return;
      }

      if (sellToken.symbol === buyToken.symbol) {
        setSwapQuoteReady(true);
        setLiveQuoteUnavailable(true);
        setSwapMessage("Select different tokens.");
        setSwapQuoteWarning("Select different tokens.");
        return;
      }

      if (!hasValidSwapAmount) {
        if (!silent) {
          recordActivity({
            actionType: "quote_failed",
            title: "Swap quote failed",
            description: "Invalid swap amount or token pair.",
            feature: "swap",
            token: `${sellToken.symbol}/${buyToken.symbol}`,
            amount: swapAmount,
            status: "failed",
            metadata: getSwapActivityMetadata("quote_failed")
          });
        }
        setSwapMessage("");
        setSwapQuoteWarning("");
        return;
      }

      if (swapInputMode === "exactOut") {
        setLiveQuoteUnavailable(true);
        setSwapQuoteReady(true);
        setSwapQuoteKey(requestKey);
        if (!silent) {
          recordActivity({
            actionType: "quote_failed",
            title: "Exact receive quote unavailable",
            description: "Exact receive quote is not available for this route.",
            feature: "swap",
            token: `${sellToken.symbol}/${buyToken.symbol}`,
            amount: swapAmount,
            status: "failed",
            metadata: getSwapActivityMetadata("exact_out_unsupported")
          });
        }
        setSwapMessage("Exact receive quote is not available for this route.");
        setSwapQuoteWarning("Exact receive quote is not available for this route.");
        return;
      }

      const walletChain = bridge.fromNetwork.chainId;
      if (arcNativePreferred && !silent) {
        recordActivity({
          actionType: "arc_native_route_checked",
          title: "Swap estimate checked",
          description: "Velora AI checked the best available estimate for this pair.",
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          network: "Arc Testnet",
          status: "info",
          metadata: getSwapActivityMetadata("arc_native_route_checked")
        });
      }

      const fromTokenAddress = getTokenAddress(sellToken.symbol, walletChain);
      const toTokenAddress = getTokenAddress(buyToken.symbol, walletChain);
      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error("Selected tokens are not available for live execution.");
      }

      setSwapMessage("Searching best available route...");
      const swapRouteRequest: RouteRequest = {
        routeType: "swap",
        walletAddress: address as Address,
        walletChainId: walletChainId ?? walletChain,
        fromChainId: walletChain,
        toChainId: walletChain,
        fromToken: { symbol: sellToken.symbol, address: fromTokenAddress, decimals: sellToken.decimals },
        toToken: { symbol: buyToken.symbol, address: toTokenAddress, decimals: buyToken.decimals },
        amount: swapAmount,
        slippage: 0.5,
        balance: sellTokenBalance.numericBalance ?? null
      };
      debugSwap("quote request payload", {
        quoteRequestPayload: swapRouteRequest,
        quoteInputMode: swapInputMode
      });
      const stablefxRouteProvider = createProviderExecutionRoute({
        providerName: stablefxProvider.providerName,
        routeType: "swap",
        supportedChains: [walletChain],
        supportedTokens: ["USDC", "EURC", "USDT"],
        getQuote: async () => {
          const estimate = await appKitSwap.estimateSwap(sellToken.symbol, buyToken.symbol, swapAmount, 50);
          return {
            provider: "Circle AppKit",
            toAmount: estimate.estimatedOutput?.amount ?? null,
            raw: estimate
          };
        },
        execute: async (quote) => {
          const estimate = quote.raw as NonNullable<typeof appKitSwap.estimate>;
          const result = await appKitSwap.executeSwap(sellToken.symbol, buyToken.symbol, swapAmount, 50, estimate);
          return { txHash: result.txHash as Hex, receivedAmount: result.amountOut ?? estimate.estimatedOutput?.amount };
        }
      });
      const lifiRouteProvider = createTransactionRequestProvider({
        providerName: lifiSwapProvider.providerName,
        routeType: "swap",
        supportedChains: [walletChain],
        getQuote: async () => {
          if (!isLifiEnabled) throw new Error("LI.FI disabled.");
          const quote = await requestCurrentSwapLifiQuote();
          return {
            provider: quote.provider,
            toAmount: quote.toAmount,
            toAmountMin: quote.toAmountMin,
            approvalAddress: quote.approvalAddress,
            feeEstimateUsd: quote.feeEstimateUsd,
            gasEstimateUsd: quote.gasEstimateUsd,
            raw: quote
          };
        }
      });
      const routeResult = await findExecutableRoute(swapRouteRequest, [arcNativeSwapProvider, stablefxRouteProvider, lifiRouteProvider, fallbackProvider]);
      if (requestId !== swapQuoteRequestIdRef.current) {
        debugSwap("quote response ignored", { requestId, activeRequestId: swapQuoteRequestIdRef.current });
        return;
      }
      debugRoute("swap route diagnostics", routeResult.diagnostics);
      debugSwap("quote route result", {
        routeFound: Boolean(routeResult.route),
        selectedProvider: routeResult.diagnostics.selectedProvider,
        providerFailureReasons: routeResult.diagnostics.failureReasons,
        transactionRequestExists: Boolean(routeResult.route?.transactionRequest),
        transactionRequestTo: routeResult.route?.transactionRequest?.to ?? null,
        transactionRequestDataLength: routeResult.route?.transactionRequest?.data?.length ?? 0,
        transactionRequestValue: routeResult.route?.transactionRequest?.value ?? null,
        transactionRequestChainId: routeResult.route?.transactionRequest?.chainId ?? null
      });

      if (!routeResult.route) {
        const quoteOnlyEntry = Object.entries(routeResult.diagnostics.quoteOnlyProviders)[0];
        const quoteOnlyRoute = quoteOnlyEntry
          ? {
              providerName: quoteOnlyEntry[0],
              toAmount: quoteOnlyEntry[1].toAmount ?? "",
              reason: quoteOnlyEntry[1].reason
            }
          : null;
        setLiveQuoteUnavailable(true);
        setSwapQuoteReady(true);
        setSwapQuoteKey(requestKey);
        setSwapRoute(null);
        setSwapQuoteOnlyRoute(quoteOnlyRoute);
        setLifiQuote(null);
        if (quoteOnlyRoute?.toAmount) {
          setReceiveAmount(quoteOnlyRoute.toAmount);
        }
        setSwapQuoteWarning(quoteOnlyRoute ? "Quote available but executable route generation failed." : "No executable route available for this token pair.");
        if (!silent) {
          recordActivity({
            actionType: "quote_failed",
            title: "Swap route unavailable",
            description: "No live executable route is available for this pair yet.",
            feature: "swap",
            token: `${sellToken.symbol}/${buyToken.symbol}`,
            amount: swapAmount,
            status: "failed",
            metadata: {
              ...getSwapActivityMetadata("route_unavailable"),
              diagnostics: JSON.stringify(routeResult.diagnostics)
            }
          });
        }
        setSwapMessage(quoteOnlyRoute ? "Quote available but executable route generation failed." : "No executable route available for this token pair.");
        return;
      }

      setSwapRoute(routeResult.route);
      setSwapQuoteOnlyRoute(null);
      const quote = routeResult.route.quote.raw as LifiEstimate | null;
      if (routeResult.route.executionMode === "transactionRequest" && quote) {
        setLifiQuote(quote);
      }
      setSwapQuoteTimestamp(Date.now());
      setSwapQuoteKey(requestKey);
      setLiveQuoteUnavailable(false);
      setSwapQuoteWarning("");
      setSwapQuoteReady(true);
      setReceiveAmount(routeResult.route.executionMode === "transactionRequest" ? formatLifiAmount(routeResult.route.quote.toAmount, buyToken.decimals) : routeResult.route.quote.toAmount ?? "");
      if (!silent) {
        recordActivity({
          actionType: "live_quote_success",
          title: "Live quote success",
          description: "Best route ready.",
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          status: "success",
          metadata: {
            ...getSwapActivityMetadata("live_quote_success", quote),
            selectedProvider: routeResult.route.providerName,
            diagnostics: JSON.stringify(routeResult.diagnostics)
          }
        });
      }
      setSwapMessage("Best route ready");
    } catch (error) {
      if (requestId !== swapQuoteRequestIdRef.current) {
        debugSwap("quote error ignored", { requestId, activeRequestId: swapQuoteRequestIdRef.current, error: serializeSwapError(error) });
        return;
      }
      const reason = extractSwapErrorMessage(error);
      setLiveQuoteUnavailable(true);
      setSwapQuoteReady(true);
      setSwapQuoteKey(requestKey);
      setSwapQuoteTimestamp(Date.now());
      setSwapQuoteWarning(reason || "No executable route available for this token pair.");
      if (!silent) {
        recordActivity({
          actionType: "live_quote_failed",
          title: "Live quote failed",
          description: reason,
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          status: "failed",
          metadata: getSwapActivityMetadata("live_quote_failed")
        });
      }
      setSwapMessage("No executable route available for this token pair.");
    } finally {
      if (requestId === swapQuoteRequestIdRef.current) {
        setSwapQuoteLoading(false);
      }
    }
  }

  autoSwapQuoteRef.current = () => {
    void handleSwapQuote({ silent: true });
  };

  useEffect(() => {
    if (tab !== "swap") return;

    if (!isConnected || !address) {
      setSwapQuoteReady(false);
      setLifiQuote(null);
      setSwapRoute(null);
      setSwapQuoteOnlyRoute(null);
      setSwapQuoteKey("");
      setSwapMessage("Connect wallet to prepare a live swap.");
      return;
    }

    if (!hasValidSwapAmount) {
      setSwapQuoteReady(false);
      setLifiQuote(null);
      setSwapRoute(null);
      setSwapQuoteOnlyRoute(null);
      setLiveQuoteUnavailable(false);
      setSwapMessage(sellToken.symbol === buyToken.symbol ? "Select different tokens." : "");
      if (!swapQuoteTriggerValue) {
        setReceiveAmount("");
        setSwapQuoteKey("");
        setSwapQuoteWarning("");
      }
      return;
    }

    const timer = window.setTimeout(() => {
      autoSwapQuoteRef.current();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [address, bridge.fromNetwork.chainId, buyToken.symbol, hasValidSwapAmount, isConnected, isLifiEnabled, realSwapEnabled, sellToken.symbol, swapInputMode, swapQuoteTriggerValue, tab]);

  function handleSwapPrimaryAction() {
    void executeConfirmedSwap();
  }

  function refreshSwapRouteAfterSuccess() {
    swapQuoteRequestIdRef.current += 1;
    setSwapRoute(null);
    setSwapQuoteOnlyRoute(null);
    setLifiQuote(null);
    setSwapQuoteReady(false);
    setSwapQuoteKey("");
    setSwapQuoteTimestamp(null);
    setSwapQuoteWarning("");
    setLiveQuoteUnavailable(false);
    window.setTimeout(() => {
      autoSwapQuoteRef.current();
    }, 600);
  }

  async function executeConfirmedSwap() {
    setSwapFailure(null);
    if (!hasValidSwapAmount) {
      setSwapFailure({ title: "Route unavailable", message: "No live executable route is available for this pair yet." });
      return;
    }

    if (!isConnected || !address) {
      setSwapFailure({ title: "Connect wallet to swap", message: "Connect wallet to swap." });
      return;
    }

    if (walletChainId !== bridge.fromNetwork.chainId) {
      setSwapFailure({ title: "Wrong network", message: "Switch to Arc Testnet." });
      return;
    }

    if (swapInputMode === "exactOut") {
      setSwapFailure({ title: "Route unavailable", message: "No live executable route is available for this pair yet." });
      return;
    }

    if (!swapRouteMatchesCurrentInput) {
      setSwapFailure({ title: "Route unavailable", message: "No executable route available for this token pair." });
      return;
    }

    if (swapQuoteExpired || swapProviderQuoteExpired) {
      setSwapFailure({ title: "Quote expired", message: "Quote expired." });
      return;
    }

    if (!swapRoute) {
      setSwapFailure({ title: "Route unavailable", message: "No live executable route is available for this pair yet." });
      return;
    }

    if (swapHasProviderExecutableRoute && swapRoute) {
      setSwapSubmitting(true);
      setSwapWalletWaiting(true);
      try {
        debugSwap("execute provider swap start", {
          providerExecutable: true,
          selectedProvider: swapRoute.providerName,
          estimate: swapProviderEstimate
        });
        recordActivity({
          actionType: "swap_started",
          title: "Swap started",
          description: `Wallet confirmation requested for ${swapAmount} ${sellToken.symbol} to ${buyToken.symbol}.`,
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          status: "pending",
          metadata: {
            ...getSwapActivityMetadata("execution_started"),
            routeProvider: swapRoute.providerName,
            providerExecutable: true
          }
        });

        const result = await swapRoute.execute({
          sendTransaction: async () => {
            throw new Error("Missing transaction request for provider execution.");
          }
        });
        setSwapWalletWaiting(false);
        recordActivity({
          actionType: "swap_completed",
          title: "Swap confirmed",
          description: "Swap transaction confirmed.",
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          status: "success",
          txHash: result.txHash,
          metadata: {
            ...getSwapActivityMetadata("confirmed"),
            quoteMode: "live",
            routeProvider: swapRoute.providerName,
            providerExecutable: true
          }
        });
        setSwapSuccess({
          txHash: result.txHash,
          sentAmount: swapAmount,
          sentToken: sellToken,
          receivedAmount: result.receivedAmount ?? swapProviderEstimate?.estimatedOutput?.amount ?? formatDisplayAmount(estimatedReceive),
          receivedToken: buyToken
        });
        void queryClient.invalidateQueries();
        refreshSwapRouteAfterSuccess();
      } catch (error) {
        const failure = swapFailureFromError(error);
        debugSwap("execute provider swap failed", { error: serializeSwapError(error), failure });
        recordActivity({
          actionType: "swap_failed",
          title: "Swap failed",
          description: failure.message,
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          status: "failed",
          metadata: {
            ...getSwapActivityMetadata("failed"),
            routeProvider: swapRoute.providerName,
            error: failure.raw ?? failure.message
          }
        });
        setSwapFailure(failure);
      } finally {
        setSwapWalletWaiting(false);
        setSwapSubmitting(false);
      }
      return;
    }

    if (!lifiQuote?.transactionRequest) {
      setSwapFailure({ title: "Route unavailable", message: "No live executable route is available for this pair yet." });
      return;
    }

    if (!hasExecutableTransactionRequest(lifiQuote)) {
      setSwapFailure({ title: "Missing transaction request", message: "Missing transaction request." });
      return;
    }

    const requestChainId = lifiQuote.transactionRequest.chainId ?? bridge.fromNetwork.chainId;
    if (requestChainId !== walletChainId) {
      setSwapFailure({ title: "Wrong network", message: "Switch to Arc Testnet." });
      return;
    }

    setSwapSubmitting(true);
    setSwapWalletWaiting(true);
    try {
      debugSwap("execute swap start", {
        transactionRequestExists: true,
        transactionRequestTo: lifiQuote.transactionRequest.to,
        transactionRequestData: lifiQuote.transactionRequest.data,
        transactionRequestValue: lifiQuote.transactionRequest.value,
        transactionRequestChainId: requestChainId
      });
      recordActivity({
        actionType: "swap_started",
        title: "Swap started",
        description: `Wallet confirmation requested for ${swapAmount} ${sellToken.symbol} to ${buyToken.symbol}.`,
        feature: "swap",
        token: `${sellToken.symbol}/${buyToken.symbol}`,
        amount: swapAmount,
        status: "pending",
        metadata: getSwapActivityMetadata("execution_started")
      });

      const hash = await executeLifiTransaction(lifiQuote, "swap", () => {
        setSwapWalletWaiting(false);
      });
      recordActivity({
        actionType: "swap_completed",
        title: "Swap confirmed",
        description: "Swap transaction confirmed.",
        feature: "swap",
        token: `${sellToken.symbol}/${buyToken.symbol}`,
        amount: swapAmount,
        status: "success",
        txHash: hash,
        metadata: getSwapActivityMetadata("confirmed", lifiQuote)
      });
      setSwapSuccess({
        txHash: hash,
        sentAmount: swapAmount,
        sentToken: sellToken,
        receivedAmount: formatLifiAmount(lifiQuote.toAmount, buyToken.decimals),
        receivedToken: buyToken
      });
      void queryClient.invalidateQueries();
      refreshSwapRouteAfterSuccess();
    } catch (error) {
      const failure = swapFailureFromError(error);
      debugSwap("execute swap failed", { error, failure });
      recordActivity({
        actionType: "swap_failed",
        title: "Swap failed",
        description: failure.message,
        feature: "swap",
        token: `${sellToken.symbol}/${buyToken.symbol}`,
        amount: swapAmount,
        status: "failed",
        metadata: {
          ...getSwapActivityMetadata("failed"),
          error: failure.raw ?? failure.message
        }
      });
      setSwapFailure(failure);
    } finally {
      setSwapWalletWaiting(false);
      setSwapSubmitting(false);
    }
  }
  async function handleBridgeQuote() {
    setBridgeQuoteReady(false);
    setBridgeMessage("");
    setLifiQuote(null);
    setBridgeRoute(null);
    recordActivity({
      actionType: "bridge_quote_requested",
      title: "Bridge quote requested",
      description: `Requested bridge quote for ${bridge.amount} ${bridge.tokenSymbol}.`,
      feature: "bridge",
      token: bridge.tokenSymbol,
      amount: bridge.amount,
      network: `${bridge.fromNetwork.name} -> ${bridge.toNetwork.name}`,
      status: "pending",
      metadata: getBridgeActivityMetadata("quote_requested")
    });
    if (!isConnected || !address) {
      setBridgeMessage("Connect wallet to request a quote.");
      return;
    }

    const bridgeAmountValue = Number(bridge.amount);
    if (!bridge.amount || !Number.isFinite(bridgeAmountValue) || bridgeAmountValue <= 0) {
      recordActivity({
        actionType: "bridge_quote_failed",
        title: "Bridge quote failed",
        description: "Enter a valid bridge amount.",
        feature: "bridge",
        token: bridge.tokenSymbol,
        amount: bridge.amount,
        status: "failed",
        metadata: getBridgeActivityMetadata("quote_failed")
      });
      setBridgeMessage("Enter a valid bridge amount.");
      return;
    }

    if (!bridge.quote.valid) {
      recordActivity({
        actionType: "bridge_quote_failed",
        title: "Bridge quote failed",
        description: bridge.quote.reason ?? "Bridge quote was invalid.",
        feature: "bridge",
        token: bridge.tokenSymbol,
        amount: bridge.amount,
        status: "failed",
        metadata: getBridgeActivityMetadata("quote_failed")
      });
      setBridgeMessage(bridge.quote.reason ?? "Bridge quote invalid.");
      return;
    }

    if (bridge.fromNetwork.chainId === bridge.toNetwork.chainId) {
      setBridgeMessage("Choose different source and destination networks.");
      return;
    }

    const fromTokenAddress = getTokenAddress(bridge.tokenSymbol, bridge.fromNetwork.chainId);
    const toTokenAddress = getTokenAddress(bridge.tokenSymbol, bridge.toNetwork.chainId);
    if (!fromTokenAddress || !toTokenAddress) {
      setLiveQuoteUnavailable(true);
      recordActivity({
        actionType: "bridge_quote_failed",
        title: "Live bridge quote failed",
        description: "Route currently unavailable for live execution.",
        feature: "bridge",
        token: bridge.tokenSymbol,
        amount: bridge.amount,
        status: "failed",
        metadata: getBridgeActivityMetadata("live_quote_failed")
      });
      setBridgeQuoteReady(false);
      setBridgeMessage("Route unavailable.");
      return;
    }

    if (!isLifiEnabled) {
      setLiveQuoteUnavailable(true);
      recordActivity({
        actionType: "bridge_quote_failed",
        title: "Bridge route unavailable",
        description: "Live routing is unavailable.",
        feature: "bridge",
        token: bridge.tokenSymbol,
        amount: bridge.amount,
        status: "failed",
        metadata: getBridgeActivityMetadata("route_unavailable")
      });
      setBridgeMessage("Route unavailable.");
      setBridgeQuoteReady(false);
      return;
    }

    try {
      setBridgeMessage("Searching best available route...");
      const fromChain = getChainById(bridge.fromNetwork.chainId);
      const toChain = getChainById(bridge.toNetwork.chainId);
      if (!fromChain || !toChain) {
        throw new Error("Route currently unavailable.");
      }
      const bridgeRouteRequest: RouteRequest = {
        routeType: "bridge",
        walletAddress: address as Address,
        walletChainId: walletChainId ?? bridge.fromNetwork.chainId,
        fromChainId: bridge.fromNetwork.chainId,
        toChainId: bridge.toNetwork.chainId,
        fromToken: { symbol: bridge.tokenSymbol, address: fromTokenAddress, decimals: bridgeToken.decimals },
        toToken: { symbol: bridge.tokenSymbol, address: toTokenAddress, decimals: bridgeToken.decimals },
        amount: bridge.amount,
        slippage: 0.5,
        balance: bridgeTokenBalance.numericBalance ?? null
      };
      const lifiRouteProvider = createTransactionRequestProvider({
        providerName: lifiBridgeProvider.providerName,
        routeType: "bridge",
        getQuote: async () => {
          const quote = await requestLifiQuote({
            fromChain: fromChain.lifiChainId,
            toChain: toChain.lifiChainId,
            fromToken: fromTokenAddress,
            toToken: toTokenAddress,
            fromAmount: parseUnits(bridge.amount, 6).toString(),
            fromAddress: address,
            slippage: 0.5
          });
          return {
            provider: quote.provider,
            toAmount: quote.toAmount,
            toAmountMin: quote.toAmountMin,
            approvalAddress: quote.approvalAddress,
            feeEstimateUsd: quote.feeEstimateUsd,
            gasEstimateUsd: quote.gasEstimateUsd,
            raw: quote
          };
        }
      });
      const routeResult = await findExecutableRoute(bridgeRouteRequest, [arcNativeBridgeProvider, lifiRouteProvider, fallbackProvider]);
      debugRoute("bridge route diagnostics", routeResult.diagnostics);
      if (!routeResult.route) {
        setLiveQuoteUnavailable(true);
        setLifiQuote(null);
        setBridgeRoute(null);
        recordActivity({
          actionType: "bridge_quote_failed",
          title: "Bridge route unavailable",
          description: "No live executable route is available for this bridge yet.",
          feature: "bridge",
          token: bridge.tokenSymbol,
          amount: bridge.amount,
          status: "failed",
          metadata: {
            ...getBridgeActivityMetadata("route_unavailable"),
            diagnostics: JSON.stringify(routeResult.diagnostics)
          }
        });
        setBridgeMessage("No live executable route is available for this pair yet.");
        setBridgeQuoteReady(false);
        return;
      }
      const quote = routeResult.route.quote.raw as LifiEstimate;
      setBridgeRoute(routeResult.route);
      setLifiQuote(quote);
      setLiveQuoteUnavailable(false);
      recordActivity({
        actionType: "bridge_preview_shown",
        title: "Live bridge quote ready",
        description: "Best route ready.",
        feature: "bridge",
        token: bridge.tokenSymbol,
        amount: bridge.amount,
        status: "success",
        metadata: {
          ...getBridgeActivityMetadata("live_quote_success", quote),
          selectedProvider: routeResult.route.providerName,
          diagnostics: JSON.stringify(routeResult.diagnostics)
        }
      });
      setBridgeMessage("Best route ready");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Route unavailable.";
      setLiveQuoteUnavailable(true);
      setLifiQuote(null);
      setBridgeRoute(null);
      recordActivity({
        actionType: "bridge_quote_failed",
        title: "Bridge route unavailable",
        description: reason,
        feature: "bridge",
        token: bridge.tokenSymbol,
        amount: bridge.amount,
        status: "failed",
        metadata: getBridgeActivityMetadata("live_quote_failed")
      });
      setBridgeMessage("Route unavailable.");
      setBridgeQuoteReady(false);
      return;
    }

    setBridgeQuoteReady(true);
  }

  async function handleReviewBridge() {
    if (!bridgeRoute) {
      setBridgeMessage("No live executable route is available for this pair yet.");
      return;
    }

    const ok = bridge.reviewBridge();
    if (!ok) {
      recordActivity({
        actionType: "bridge_quote_failed",
        title: "Bridge execution blocked",
        description: bridge.error ?? "Bridge execution prerequisites failed.",
        feature: "bridge",
        token: bridge.tokenSymbol,
        amount: bridge.amount,
        status: "failed",
        metadata: getBridgeActivityMetadata("failed")
      });
      setBridgeMessage(bridge.error ?? "Bridge execution prerequisites failed.");
      return;
    }

    recordActivity({
      actionType: "bridge_execution_started",
      title: "Bridge execution started",
      description: `Starting live bridge from ${bridge.fromNetwork.name} to ${bridge.toNetwork.name}.`,
      feature: "bridge",
      token: bridge.tokenSymbol,
      amount: bridge.amount,
      network: `${bridge.fromNetwork.name} -> ${bridge.toNetwork.name}`,
      status: "pending",
      metadata: getBridgeActivityMetadata("execution_started")
    });

    try {
      setBridgeMessage("Waiting for wallet confirmation...");
      let hash: Hex;
      const selectedQuote = bridgeRoute.quote.raw as LifiEstimate | null;
      if (bridgeRoute.executionMode === "transactionRequest" && selectedQuote && hasExecutableTransactionRequest(selectedQuote)) {
        setLifiQuote(selectedQuote);
        hash = await executeLifiTransaction(selectedQuote, "bridge");
      } else {
        const result = await bridgeRoute.execute({
          sendTransaction: async (transactionRequest) => {
            if (!walletClient || !publicClient || !address) {
              throw new Error("Connect wallet.");
            }
            if (!transactionRequest.to || !transactionRequest.data) {
              throw new Error("Route unavailable.");
            }
            const requestChainId = transactionRequest.chainId ?? bridge.fromNetwork.chainId;
            if (walletChainId !== requestChainId) {
              throw new Error("Wrong network.");
            }
            const submittedHash = await walletClient.sendTransaction({
              account: address as Address,
              to: transactionRequest.to as Address,
              data: transactionRequest.data as Hex,
              value: parseOptionalBigInt(transactionRequest.value),
              gas: parseOptionalBigInt(transactionRequest.gas ?? transactionRequest.gasLimit),
              maxFeePerGas: parseOptionalBigInt(transactionRequest.maxFeePerGas),
              maxPriorityFeePerGas: parseOptionalBigInt(transactionRequest.maxPriorityFeePerGas)
            });
            const receipt = await transactions.trackTransaction(submittedHash);
            if (receipt?.status === "reverted") {
              throw new Error("Contract call failed.");
            }
            return submittedHash;
          }
        });
        hash = result.txHash;
      }
      recordActivity({
        actionType: "bridge_completed",
        title: "Bridge completed",
        description: "Bridge transaction confirmed.",
        feature: "bridge",
        token: bridge.tokenSymbol,
        amount: bridge.amount,
        network: `${bridge.fromNetwork.name} -> ${bridge.toNetwork.name}`,
        status: "success",
        txHash: hash,
        metadata: {
          ...getBridgeActivityMetadata("confirmed", selectedQuote),
          selectedProvider: bridgeRoute.providerName
        }
      });
      setBridgeMessage(`Live bridge confirmed: ${hash}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Live bridge execution failed.";
      recordActivity({
        actionType: "bridge_failed",
        title: "Bridge failed",
        description: reason,
        feature: "bridge",
        token: bridge.tokenSymbol,
        amount: bridge.amount,
        network: `${bridge.fromNetwork.name} -> ${bridge.toNetwork.name}`,
        status: "failed",
        metadata: getBridgeActivityMetadata("failed")
      });
      setBridgeMessage(reason);
    }
  }

  return (
    <AppShell title="Bridge & Swap" eyebrow="Stablecoin-first trading terminal">
      <div className="mx-auto max-w-5xl space-y-6">
        <PriceTicker />

        <section className="glass rounded-lg p-4 sm:p-6">
          <div className="mx-auto max-w-2xl">
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-black/20 p-1">
              {(["swap", "bridge"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={cx(
                    "rounded-lg px-4 py-3 text-sm font-semibold transition",
                    tab === item ? "bg-cyan text-white shadow-neon" : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  {item === "swap" ? "Swap" : "Bridge"}
                </button>
              ))}
            </div>

            {tab === "swap" ? (
              <div className="space-y-4">
                <label className="block text-sm text-slate-300">
                  Sell
                  <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_220px]">
                    <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                      <input value={swapAmount} onChange={(event) => handleSellAmountChange(event.target.value)} className="w-full bg-transparent px-2 py-2 text-lg text-white outline-none placeholder:text-slate-600" inputMode="decimal" placeholder="Enter amount" />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPercent(0.5)}
                          disabled={balanceActionDisabled}
                          className={cx(
                            "rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:text-white",
                            balanceActionDisabled && "cursor-not-allowed opacity-50 hover:text-slate-300"
                          )}
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => setPercent(1)}
                          disabled={balanceActionDisabled}
                          className={cx(
                            "rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint",
                            balanceActionDisabled && "cursor-not-allowed opacity-50"
                          )}
                        >
                          Max
                        </button>
                      </div>
                      <p className={cx("mt-2 flex items-center gap-1.5 text-xs", sellTokenBalance.isReal && !sellTokenBalance.error ? "text-mint" : "text-slate-400")}>
                        {sellTokenBalance.isReal && !sellTokenBalance.error ? <TokenLogo symbol={sellToken.symbol} size={16} /> : null}
                        {sellTokenBalance.label}
                      </p>
                    </div>
                    <TokenPicker label="Sell token" selected={sellToken} activeTokens={activeTokens} comingSoon={comingSoonTokens} onSelect={setSellToken} />
                  </div>
                </label>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const nextSell = buyToken;
                      const nextBuy = sellToken;
                      setSellToken(nextSell);
                      setBuyToken(nextBuy);
                    }}
                    className="grid h-11 w-11 place-items-center rounded-full border border-mint/30 bg-mint/10 text-mint"
                    aria-label="Flip swap direction"
                  >
                    <ArrowDownUp className="h-4 w-4" />
                  </button>
                </div>

                <label className="block text-sm text-slate-300">
                  Receive
                  <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_220px]">
                    <div>
                      <input value={swapInputMode === "exactOut" ? receiveAmount : receiveAmount} onChange={(event) => handleReceiveAmountChange(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-slate-600" inputMode="decimal" placeholder="Estimated amount" />
                      <p className={cx("mt-2 flex items-center gap-1.5 text-xs", buyTokenBalance.isReal && !buyTokenBalance.error ? "text-mint" : "text-slate-400")}>
                        {buyTokenBalance.isReal && !buyTokenBalance.error ? <TokenLogo symbol={buyToken.symbol} size={16} /> : null}
                        {buyTokenBalance.label}
                      </p>
                    </div>
                    <TokenPicker label="Receive token" selected={buyToken} activeTokens={activeTokens} comingSoon={comingSoonTokens} onSelect={setBuyToken} />
                  </div>
                </label>

                {showSwapQuoteDetails ? (
                  <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm sm:grid-cols-2">
                    {swapQuoteLoading ? <p className="text-slate-300 sm:col-span-2"><Loader2 className="mr-2 inline h-4 w-4 animate-spin text-cyan" />Loading quote...</p> : null}
                    {swapInputMode === "exactOut" ? (
                      <>
                        <p className="text-slate-300">Requested receive: <span className="font-semibold text-white">{receiveAmount} {buyToken.symbol}</span></p>
                        <p className="text-slate-300">Required sell estimate: <span className="font-semibold text-white">{swapAmount || "--"} {sellToken.symbol}</span></p>
                      </>
                    ) : (
                      <p className="text-slate-300">Estimated receive: <span className="font-semibold text-white">{receiveAmount || "--"} {buyToken.symbol}</span></p>
                    )}
                    <p className="text-slate-300">Rate: <span className="font-semibold text-white">1 {sellToken.symbol} ~ {rate.toFixed(6)} {buyToken.symbol}</span></p>
                    <p className="text-slate-300">Route: <span className="font-semibold text-white">{swapRouteLabel}</span></p>
                    <p className="text-slate-300">Network fee: <span className="font-semibold text-white">{swapFeeLabel}</span></p>
                    <p className="text-slate-300">Price impact: <span className="font-semibold text-white">{swapPriceImpactLabel}</span></p>
                    <p className="text-slate-300">ETA: <span className="font-semibold text-white">{swapEtaLabel}</span></p>
                    {swapQuoteWarning ? <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-amber-200 sm:col-span-2">{swapQuoteWarning}</p> : null}
                  </div>
                ) : (
                  null
                )}

                <button
                  onClick={handleSwapPrimaryAction}
                  disabled={swapPrimaryBusy || !swapCanExecute}
                  className={cx(
                    "flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 font-bold shadow-neon transition",
                    !swapCanExecute ? "cursor-not-allowed border border-white/10 bg-white/[0.04] text-slate-500 shadow-none" : "bg-cyan text-white hover:scale-[1.01]",
                    swapPrimaryBusy && "cursor-wait opacity-70"
                  )}
                >
                  {swapPrimaryBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownUp className="h-4 w-4" />}
                  {swapPrimaryLabel}
                </button>
                {swapExecutionNotice ? (
                  <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                    {swapExecutionNotice}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    From network
                    <div className="mt-2">
                      <NetworkPicker label="From network" value={bridge.fromNetwork} onSelect={(network) => bridge.setFromNetworkId(network.id)} />
                    </div>
                  </label>
                  <label className="text-sm text-slate-300">
                    To network
                    <div className="mt-2">
                      <NetworkPicker label="To network" value={bridge.toNetwork} onSelect={(network) => bridge.setToNetworkId(network.id)} />
                    </div>
                  </label>
                </div>

                <label className="block text-sm text-slate-300">
                  Token
                  <div className="mt-2">
                    <TokenPicker
                      label="Bridge token"
                      selected={bridgeToken}
                      activeTokens={activeTokens}
                      comingSoon={comingSoonTokens}
                      onSelect={(token) => bridge.setTokenSymbol(token.symbol)}
                    />
                  </div>
                </label>

                <label className="block text-sm text-slate-300">
                  Amount
                  <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-2">
                    <input value={bridge.amount} onChange={(event) => bridge.setAmount(event.target.value)} className="w-full bg-transparent px-2 py-2 text-lg text-white outline-none" inputMode="decimal" placeholder="0.00" />
                    <div className="mt-2 flex items-center justify-between gap-3 px-2 pb-1">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        {bridgeTokenBalance.isReal && !bridgeTokenBalance.error ? <TokenLogo symbol={bridge.tokenSymbol} size={16} /> : null}
                        {bridgeTokenBalance.formattedBalance ? `${bridgeTokenBalance.formattedBalance} ${bridge.tokenSymbol}` : bridgeTokenBalance.label}
                      </span>
                      <button
                        type="button"
                        onClick={setBridgeMaxAmount}
                        disabled={bridgeMaxDisabled}
                        className={cx(
                          "rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint",
                          bridgeMaxDisabled && "cursor-not-allowed opacity-50"
                        )}
                      >
                        Max
                      </button>
                    </div>
                  </div>
                </label>

                <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm sm:grid-cols-2">
                  <p className="text-slate-300">Estimated receive: <span className="font-semibold text-white">{lifiQuote?.toAmount ? (Number(lifiQuote.toAmount) / 1_000_000).toFixed(4) : bridge.quote.estimatedReceive.toFixed(4)} {bridge.tokenSymbol}</span></p>
                  <p className="text-slate-300">Bridge fee: <span className="font-semibold text-white">{lifiQuote?.feeEstimateUsd ? `$${lifiQuote.feeEstimateUsd}` : `${bridge.quote.bridgeFee.toFixed(4)} ${bridge.tokenSymbol}`}</span></p>
                  <p className="text-slate-300">ETA: <span className="font-semibold text-white">{bridge.quote.estimatedTime}</span></p>
                  <p className="text-slate-300">Path: <span className="font-semibold text-white">{bridge.fromNetwork.name} to {bridge.toNetwork.name}</span></p>
                </div>
                <button onClick={handleBridgeQuote} className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan px-5 py-3 font-bold text-white shadow-neon">
                  <Repeat2 className="h-4 w-4" /> Get Bridge Quote
                </button>
                {bridgeQuoteReady ? (
                  <button onClick={handleReviewBridge} disabled={transactions.isPending || !bridgeHasExecutableQuote} className="flex w-full items-center justify-center gap-2 rounded-lg border border-mint/30 bg-mint/10 px-5 py-3 font-semibold text-mint disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-500">
                    {transactions.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {bridgeHasExecutableQuote ? "Bridge" : "Route unavailable"}
                  </button>
                ) : null}
                {bridgeMessage ? <p className="text-sm text-cyan">{bridgeMessage}</p> : null}
              </div>
            )}
          </div>
        </section>
        <AnimatePresence>
          {swapSuccess ? (
            <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ y: 18, scale: 0.96, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 18, scale: 0.96, opacity: 0 }} transition={{ duration: 0.24 }} className="glass w-full max-w-md rounded-lg p-6 text-center">
                <div className="relative mx-auto h-24 w-24">
                  <motion.div initial={{ x: -18, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.08 }} className="absolute left-0 top-3 grid h-14 w-14 place-items-center rounded-full border border-cyan/30 bg-cyan/10 shadow-neon">
                    <TokenLogo symbol={swapSuccess.sentToken.symbol} size={34} />
                  </motion.div>
                  <motion.div initial={{ x: 18, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.16 }} className="absolute right-0 top-3 grid h-14 w-14 place-items-center rounded-full border border-mint/30 bg-mint/10 shadow-neon">
                    <TokenLogo symbol={swapSuccess.receivedToken.symbol} size={34} />
                  </motion.div>
                  <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.26, type: "spring", stiffness: 320, damping: 18 }} className="absolute bottom-0 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full bg-mint text-white shadow-[0_0_28px_rgba(16,185,129,0.28)]">
                    <Check className="h-5 w-5" />
                  </motion.div>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-white">Swap Successful</h2>
                <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Swapped</p>
                  <div className="flex items-center justify-center gap-2 text-xl font-bold text-white">
                    <TokenLogo symbol={swapSuccess.sentToken.symbol} size={26} />
                    {swapSuccess.sentAmount} {swapSuccess.sentToken.symbol}
                  </div>
                  <ArrowDown className="mx-auto my-3 h-5 w-5 text-slate-400" />
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Received</p>
                  <div className="flex items-center justify-center gap-2 text-xl font-bold text-mint">
                    <TokenLogo symbol={swapSuccess.receivedToken.symbol} size={26} />
                    {swapSuccess.receivedAmount || "--"} {swapSuccess.receivedToken.symbol}
                  </div>
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-300">Transaction confirmed.</p>
                <p className="mt-4 break-all text-xs text-slate-500">{swapSuccess.txHash}</p>
                <a href={explorerTxUrl(ARC_EXPLORER_URL, swapSuccess.txHash)} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan px-5 py-3 font-bold text-white shadow-neon transition hover:scale-[1.01]">
                  <ExternalLink className="h-4 w-4" /> View Transaction
                </a>
                <button onClick={() => setSwapSuccess(null)} className="mt-3 w-full rounded-lg border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:border-cyan/40 hover:text-white">
                  Close
                </button>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <AnimatePresence>
          {swapFailure ? (
            <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ y: 18, scale: 0.96, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 18, scale: 0.96, opacity: 0 }} transition={{ duration: 0.24 }} className="glass w-full max-w-md rounded-lg p-6 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-red-400/30 bg-red-400/10 text-red-300">
                  <X className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-white">{swapFailure.title}</h2>
                <p className="mt-3 text-sm text-slate-300">{swapFailure.message}</p>
                {process.env.NODE_ENV !== "production" && swapFailure.raw ? (
                  <p className="mt-3 max-h-28 overflow-auto rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-left text-xs text-red-100">
                    {swapFailure.raw}
                  </p>
                ) : null}
                <button onClick={() => setSwapFailure(null)} className="mt-6 w-full rounded-lg border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:border-cyan/40 hover:text-white">
                  Close
                </button>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

