"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownUp, Check, ChevronDown, Loader2, RefreshCw, Repeat2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { erc20Abi, parseUnits, type Address, type Hex } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { cx } from "@/components/azu/utils";
import { NetworkLogo } from "@/components/token/NetworkLogo";
import { TokenLogo } from "@/components/token/TokenLogo";
import { TradingModeBadge } from "@/components/swap/TradingModeBadge";
import { WalletConnectButton } from "@/components/web3/WalletConnectButton";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useArcAppKitSwap } from "@/hooks/useArcAppKitSwap";
import { useCrossChainSwap } from "@/hooks/useCrossChainSwap";
import { useStablecoinPrices } from "@/hooks/useStablecoinPrices";
import { useSwapTokenBalance } from "@/hooks/useSwapTokenBalance";
import { useTransactions } from "@/hooks/useTransactions";
import { getChainById } from "@/lib/config/chains";
import { getTokenAddress } from "@/lib/config/tokens";
import { CROSS_CHAIN_NETWORKS, type BridgeNetwork } from "@/lib/swap/networks";
import { SWAP_TOKENS, estimateDemoSwap, getSwapToken, type SwapToken } from "@/lib/swap/tokens";
import { getTradeProviderPriority, shouldPreferArcNativeRoute } from "@/lib/trade/provider-priority";

type TradeTab = "swap" | "bridge";

type ComingSoonToken = {
  symbol: string;
  name: string;
};

const ACTIVE_STABLECOINS = ["USDC", "EURC", "USDT"] as const;

const EXTRA_COMING_SOON_TOKENS: ComingSoonToken[] = [
  { symbol: "DAI", name: "Dai Stablecoin" },
  { symbol: "PYUSD", name: "PayPal USD" },
  { symbol: "cirBTC", name: "Circle BTC" }
];

type TradingMode = "live" | "demo" | "live-unavailable";

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

function formatLifiAmount(value: string | null | undefined, decimals = 6) {
  if (!value) return "";
  const numeric = Number(value) / 10 ** decimals;
  return formatDisplayAmount(numeric);
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
        <p className="mt-2 text-xs text-amber-300">Stale price warning: live API unavailable, displaying safe fallback values.</p>
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
                      className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-mint/40 hover:bg-mint/10"
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
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-mint/40 hover:bg-mint/10"
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
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { recordActivity } = useActivityRecorder();
  const appKitSwap = useArcAppKitSwap();
  const bridge = useCrossChainSwap();
  const prices = useStablecoinPrices();
  const transactions = useTransactions();
  const [tab, setTab] = useState<TradeTab>("swap");
  const [sellToken, setSellToken] = useState(getSwapToken("USDC"));
  const [buyToken, setBuyToken] = useState(getSwapToken("EURC"));
  const [swapAmount, setSwapAmount] = useState("0");
  const [swapQuoteReady, setSwapQuoteReady] = useState(false);
  const [swapMessage, setSwapMessage] = useState("");
  const [bridgeQuoteReady, setBridgeQuoteReady] = useState(false);
  const [bridgeMessage, setBridgeMessage] = useState("");
  const [liveQuoteUnavailable, setLiveQuoteUnavailable] = useState(false);
  const [lifiQuote, setLifiQuote] = useState<LifiEstimate | null>(null);

  const activeTokens = useMemo(() => ACTIVE_STABLECOINS.map((symbol) => getSwapToken(symbol)).filter(Boolean), []);
  const sellTokenBalance = useSwapTokenBalance(sellToken);
  const buyTokenBalance = useSwapTokenBalance(buyToken);
  const hasSellBalance = typeof sellTokenBalance.numericBalance === "number" && sellTokenBalance.numericBalance > 0;
  const balanceActionDisabled = !hasSellBalance || sellTokenBalance.isLoading;
  const comingSoonTokens = useMemo<ComingSoonToken[]>(() => {
    const fromExisting = SWAP_TOKENS.filter((token) => !ACTIVE_STABLECOINS.includes(token.symbol as (typeof ACTIVE_STABLECOINS)[number])).map((token) => ({ symbol: token.symbol, name: token.name }));
    const merged = [...fromExisting, ...EXTRA_COMING_SOON_TOKENS];
    return merged.filter((item, index) => merged.findIndex((candidate) => candidate.symbol.toLowerCase() === item.symbol.toLowerCase()) === index);
  }, []);

  const swapQuote = useMemo(() => estimateDemoSwap(sellToken.symbol, buyToken.symbol, swapAmount), [buyToken.symbol, sellToken.symbol, swapAmount]);
  const liveSellPrice = prices.prices[sellToken.symbol as "USDC" | "EURC" | "USDT"]?.price ?? sellToken.mockPrice;
  const liveBuyPrice = prices.prices[buyToken.symbol as "USDC" | "EURC" | "USDT"]?.price ?? buyToken.mockPrice;
  const estimatedReceive = lifiQuote?.toAmount ? Number(lifiQuote.toAmount) / 1_000_000 : appKitSwap.estimate?.estimatedOutput?.amount ? Number(appKitSwap.estimate.estimatedOutput.amount) : swapQuote.output;
  const rate = liveSellPrice / Math.max(liveBuyPrice, 0.0001);
  const realSwapEnabled = appKitSwap.canUseRealSwap(sellToken.symbol, buyToken.symbol);
  const isLifiEnabled = process.env.NEXT_PUBLIC_LIFI_ENABLED !== "false";
  const tradingMode: TradingMode = liveQuoteUnavailable ? "live-unavailable" : isLifiEnabled ? "live" : "demo";
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
      throw new Error("Live quote unavailable.");
    }
    const payload = (await response.json()) as { estimate?: LifiEstimate };
    if (!payload.estimate) {
      throw new Error("Live quote unavailable.");
    }
    return payload.estimate;
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
      actionType: feature === "swap" ? "swap_started" : "bridge_started",
      title: feature === "swap" ? "Token approval required" : "Bridge token approval required",
      description: "Wallet approval is required before LI.FI can move the selected ERC20 token.",
      feature,
      token: feature === "swap" ? `${sellToken.symbol}/${buyToken.symbol}` : bridge.tokenSymbol,
      amount: feature === "swap" ? swapAmount : bridge.amount,
      status: "pending"
    });

    const approvalHash = await walletClient.writeContract({
      account: address as Address,
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender as Address, requiredAmount]
    });

    recordActivity({
      actionType: feature === "swap" ? "swap_started" : "bridge_started",
      title: feature === "swap" ? "Token approval submitted" : "Bridge token approval submitted",
      description: "Approval transaction submitted. Velora AI will execute the route after confirmation.",
      feature,
      token: feature === "swap" ? `${sellToken.symbol}/${buyToken.symbol}` : bridge.tokenSymbol,
      amount: feature === "swap" ? swapAmount : bridge.amount,
      status: "pending",
      txHash: approvalHash
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
      console.warn("[Velora AI] LI.FI route preflight reverted", {
        routeProvider: quote.provider,
        to: request.to,
        fromToken: quote.fromTokenAddress,
        approvalAddress: quote.approvalAddress,
        error
      });
      throw new Error("Live route is not executable right now. Click Get Quote again, try a smaller amount, or wait for a fresh LI.FI route. No gas was spent.");
    }
  }

  function getSwapActivityMetadata(trackingStatus: string, quote: LifiEstimate | null = lifiQuote) {
    return {
      tradeType: "swap",
      fromToken: sellToken.symbol,
      toToken: buyToken.symbol,
      fromAmount: swapAmount,
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
      quoteMode: quote?.transactionRequest ? "live" : liveQuoteUnavailable ? "fallback" : "preview",
      trackingStatus,
      bridgeFee: quote?.feeEstimateUsd ? `$${quote.feeEstimateUsd}` : `${formatDisplayAmount(bridge.quote.bridgeFee)} ${bridge.tokenSymbol}`,
      eta: bridge.quote.estimatedTime
    };
  }

  async function executeLifiTransaction(quote: LifiEstimate, feature: "swap" | "bridge") {
    if (!walletClient || !address) {
      throw new Error("Connect wallet to execute this transaction.");
    }

    const request = quote.transactionRequest;
    if (!request?.to || !request.data) {
      throw new Error("This live quote does not include executable transaction data.");
    }

    await ensureLifiAllowance(quote, feature);
    await preflightLifiTransaction(quote);

    const hash = await walletClient.sendTransaction({
      account: address as Address,
      to: request.to as Address,
      data: request.data as Hex,
      value: parseOptionalBigInt(request.value),
      gas: parseOptionalBigInt(request.gas ?? request.gasLimit),
      maxFeePerGas: parseOptionalBigInt(request.maxFeePerGas),
      maxPriorityFeePerGas: parseOptionalBigInt(request.maxPriorityFeePerGas)
    });

    recordActivity({
      actionType: feature === "swap" ? "swap_started" : "bridge_started",
      title: feature === "swap" ? "Swap transaction submitted" : "Bridge transaction submitted",
      description: "Wallet submitted a LI.FI transaction for the live route.",
      feature,
      token: feature === "swap" ? `${sellToken.symbol}/${buyToken.symbol}` : bridge.tokenSymbol,
      amount: feature === "swap" ? swapAmount : bridge.amount,
      status: "pending",
      txHash: hash,
      metadata: feature === "swap" ? getSwapActivityMetadata("transaction_submitted", quote) : getBridgeActivityMetadata("transaction_submitted", quote)
    });

    await transactions.trackTransaction(hash);
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

  function setPercent(percent: 0.5 | 1) {
    const available = sellTokenBalance.numericBalance ?? 0;
    if (available <= 0) {
      setSwapAmount("0");
      return;
    }

    const value = available * percent;
    const precision = sellToken.decimals > 6 ? 6 : 2;
    const formatted = value.toFixed(precision).replace(/\.?0+$/, "");
    setSwapAmount(formatted || "0");
  }

  async function handleSwapQuote() {
    setSwapQuoteReady(false);
    setSwapMessage("");
    setLifiQuote(null);
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

    if (!isConnected || !address) {
      setSwapMessage("Connect wallet to request a quote.");
      return;
    }

    if (!swapAmount || Number(swapAmount) <= 0 || sellToken.symbol === buyToken.symbol) {
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
      setSwapMessage("Enter a valid amount and choose different tokens.");
      return;
    }

    const walletChain = bridge.fromNetwork.chainId;
    if (arcNativePreferred) {
      recordActivity({
        actionType: "arc_native_route_checked",
        title: "Arc-native route checked",
        description: "Velora AI checked the preferred Arc-native USDC/EURC route before using fallback liquidity.",
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
      setLiveQuoteUnavailable(true);
      recordActivity({
        actionType: "live_quote_failed",
        title: "Live quote failed",
        description: "Token is not available for live quote on selected chain.",
        feature: "swap",
        token: `${sellToken.symbol}/${buyToken.symbol}`,
        amount: swapAmount,
        status: "failed",
        metadata: getSwapActivityMetadata("live_quote_failed")
      });
      recordActivity({
        actionType: "fallback_quote_used",
        title: "Fallback quote used",
        description: "Estimated quote shown because live quote token mapping is unavailable.",
        feature: "swap",
        token: `${sellToken.symbol}/${buyToken.symbol}`,
        amount: swapAmount,
        status: "info",
        metadata: getSwapActivityMetadata("fallback_quote_used")
      });
      setSwapQuoteReady(true);
      setSwapMessage("Live quote unavailable — showing estimated quote.");
      return;
    }

    if (isLifiEnabled) {
      try {
        const quote = await requestCurrentSwapLifiQuote();
        setLifiQuote(quote);
        setLiveQuoteUnavailable(false);
        recordActivity({
          actionType: "live_quote_success",
          title: "Live quote success",
          description: arcNativePreferred ? "Arc-native adapter is not enabled yet; LI.FI fallback quote returned successfully." : "LI.FI live quote returned successfully.",
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          status: "success",
          metadata: getSwapActivityMetadata("live_quote_success", quote)
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Live quote unavailable.";
        setLiveQuoteUnavailable(true);
        setLifiQuote(null);
        recordActivity({
          actionType: "live_quote_failed",
          title: "Live quote failed",
          description: arcNativePreferred ? "Arc-native adapter is reserved and LI.FI fallback quote failed." : "LI.FI quote request failed.",
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          status: "failed",
          metadata: getSwapActivityMetadata("live_quote_failed")
        });
        recordActivity({
          actionType: "fallback_quote_used",
          title: "Fallback quote used",
          description: "Estimated quote shown after live quote failure.",
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          status: "info",
          metadata: getSwapActivityMetadata("fallback_quote_used")
        });
        setSwapMessage(reason === "Live quote unavailable." ? "Live quote unavailable — showing estimated quote." : "Live quote unavailable — showing estimated quote.");
      }
    }

    setSwapQuoteReady(true);
    setSwapMessage("Quote ready. Review swap.");
  }

  async function handleReviewSwap() {
    recordActivity({
      actionType: "swap_reviewed",
      title: "Swap reviewed",
      description: `Reviewed quote for ${swapAmount} ${sellToken.symbol} to ${buyToken.symbol}.`,
      feature: "swap",
      token: `${sellToken.symbol}/${buyToken.symbol}`,
      amount: swapAmount,
      status: "info",
      metadata: getSwapActivityMetadata("reviewed")
    });

    if (realSwapEnabled && appKitSwap.estimate) {
      try {
        const result = await appKitSwap.executeSwap(sellToken.symbol, buyToken.symbol, swapAmount, 50);
        recordActivity({
          actionType: "swap_completed",
          title: "Swap completed",
          description: "Real swap submitted through Circle App Kit.",
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          status: "success",
          txHash: result.txHash,
          metadata: getSwapActivityMetadata("confirmed")
        });
        setSwapMessage(`Swap submitted: ${result.txHash}`);
        return;
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Swap execution failed.";
        recordActivity({
          actionType: "quote_failed",
          title: "Swap execution failed",
          description: reason,
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          status: "failed",
          metadata: getSwapActivityMetadata("failed")
        });
        setSwapMessage(reason);
        return;
      }
    }

    if (lifiQuote?.transactionRequest) {
      try {
        setSwapMessage("Refreshing live route before wallet confirmation...");
        const freshQuote = await requestCurrentSwapLifiQuote();
        setLifiQuote(freshQuote);
        const hash = await executeLifiTransaction(freshQuote, "swap");
        recordActivity({
          actionType: "swap_completed",
          title: "Swap confirmed",
          description: "Live LI.FI swap transaction confirmed.",
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          status: "success",
          txHash: hash,
          metadata: getSwapActivityMetadata("confirmed", freshQuote)
        });
        setSwapMessage(`Live swap confirmed: ${hash}`);
        return;
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Live swap execution failed.";
        recordActivity({
          actionType: "swap_failed",
          title: "Swap failed",
          description: reason,
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          status: "failed",
          metadata: getSwapActivityMetadata("failed")
        });
        setSwapMessage(reason);
        return;
      }
    }

    recordActivity({
      actionType: "swap_completed",
      title: "Swap completed",
      description: "Estimated quote reviewed. No live transaction route was available.",
      feature: "swap",
      token: `${sellToken.symbol}/${buyToken.symbol}`,
      amount: swapAmount,
      status: "success",
      metadata: getSwapActivityMetadata("reviewed")
    });
    setSwapMessage("Estimated quote reviewed. Execute is available only when LI.FI returns transaction data.");
  }

  async function handleBridgeQuote() {
    setBridgeQuoteReady(false);
    setBridgeMessage("");
    setLifiQuote(null);
    recordActivity({
      actionType: "quote_requested",
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

    if (!bridge.quote.valid) {
      recordActivity({
        actionType: "quote_failed",
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
        actionType: "live_quote_failed",
        title: "Live bridge quote failed",
        description: "Token is not available for live bridge quote on selected networks.",
        feature: "bridge",
        token: bridge.tokenSymbol,
        amount: bridge.amount,
        status: "failed",
        metadata: getBridgeActivityMetadata("live_quote_failed")
      });
      recordActivity({
        actionType: "fallback_quote_used",
        title: "Fallback bridge quote used",
        description: "Estimated bridge quote shown due to missing live token mapping.",
        feature: "bridge",
        token: bridge.tokenSymbol,
        amount: bridge.amount,
        status: "info",
        metadata: getBridgeActivityMetadata("fallback_quote_used")
      });
      setBridgeQuoteReady(true);
      setBridgeMessage("Live quote unavailable — showing estimated quote.");
      return;
    }

    if (isLifiEnabled) {
      try {
        const fromChain = getChainById(bridge.fromNetwork.chainId);
        const toChain = getChainById(bridge.toNetwork.chainId);
        if (!fromChain || !toChain) {
          throw new Error("Route currently unavailable.");
        }
        const quote = await requestLifiQuote({
          fromChain: fromChain.lifiChainId,
          toChain: toChain.lifiChainId,
          fromToken: fromTokenAddress,
          toToken: toTokenAddress,
          fromAmount: parseUnits(bridge.amount, 6).toString(),
          fromAddress: address,
          slippage: 0.5
        });
        setLifiQuote(quote);
        setLiveQuoteUnavailable(false);
        recordActivity({
          actionType: "live_quote_success",
          title: "Live bridge quote success",
          description: "LI.FI bridge quote returned successfully.",
          feature: "bridge",
          token: bridge.tokenSymbol,
          amount: bridge.amount,
          status: "success",
          metadata: getBridgeActivityMetadata("live_quote_success", quote)
        });
      } catch {
        setLiveQuoteUnavailable(true);
        setLifiQuote(null);
        recordActivity({
          actionType: "live_quote_failed",
          title: "Live bridge quote failed",
          description: "LI.FI bridge quote failed.",
          feature: "bridge",
          token: bridge.tokenSymbol,
          amount: bridge.amount,
          status: "failed",
          metadata: getBridgeActivityMetadata("live_quote_failed")
        });
        recordActivity({
          actionType: "fallback_quote_used",
          title: "Fallback bridge quote used",
          description: "Estimated bridge quote shown after live quote failure.",
          feature: "bridge",
          token: bridge.tokenSymbol,
          amount: bridge.amount,
          status: "info",
          metadata: getBridgeActivityMetadata("fallback_quote_used")
        });
        setBridgeMessage("Live quote unavailable — showing estimated quote.");
      }
    }

    setBridgeQuoteReady(true);
    setBridgeMessage("Bridge quote ready. Review bridge.");
  }

  async function handleReviewBridge() {
    recordActivity({
      actionType: "bridge_reviewed",
      title: "Bridge reviewed",
      description: `Reviewed bridge quote from ${bridge.fromNetwork.name} to ${bridge.toNetwork.name}.`,
      feature: "bridge",
      token: bridge.tokenSymbol,
      amount: bridge.amount,
      network: `${bridge.fromNetwork.name} -> ${bridge.toNetwork.name}`,
      status: "info",
      metadata: getBridgeActivityMetadata("reviewed")
    });
    const ok = bridge.reviewBridge();
    if (!ok) {
      recordActivity({
        actionType: "quote_failed",
        title: "Bridge review failed",
        description: bridge.error ?? "Bridge review failed.",
        feature: "bridge",
        token: bridge.tokenSymbol,
        amount: bridge.amount,
        status: "failed",
        metadata: getBridgeActivityMetadata("failed")
      });
      setBridgeMessage(bridge.error ?? "Bridge review failed.");
      return;
    }

    if (lifiQuote?.transactionRequest) {
      try {
        const hash = await executeLifiTransaction(lifiQuote, "bridge");
        recordActivity({
          actionType: "bridge_completed",
          title: "Bridge confirmed",
          description: "Live LI.FI bridge transaction confirmed.",
          feature: "bridge",
          token: bridge.tokenSymbol,
          amount: bridge.amount,
          network: `${bridge.fromNetwork.name} -> ${bridge.toNetwork.name}`,
          status: "success",
          txHash: hash,
          metadata: getBridgeActivityMetadata("confirmed")
        });
        setBridgeMessage(`Live bridge confirmed: ${hash}`);
        return;
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
        return;
      }
    }

    await bridge.confirmBridge();
    recordActivity({
      actionType: "bridge_completed",
      title: "Bridge completed",
      description: "Bridge quote confirmed in quote mode.",
      feature: "bridge",
      token: bridge.tokenSymbol,
      amount: bridge.amount,
      network: `${bridge.fromNetwork.name} -> ${bridge.toNetwork.name}`,
      status: "success",
      txHash: bridge.quote.hashPlaceholder,
      metadata: getBridgeActivityMetadata("reviewed")
    });
    setBridgeMessage(`Bridge reviewed in quote mode: ${bridge.quote.hashPlaceholder}`);
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
                    tab === item ? "bg-gradient-to-r from-mint to-cyan text-[#031018] shadow-neon" : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  {item === "swap" ? "Swap" : "Bridge"}
                </button>
              ))}
            </div>

            <TradingModeBadge mode={tradingMode} />

            {tab === "swap" ? (
              <div className="space-y-4">
                <label className="block text-sm text-slate-300">
                  Sell
                  <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_220px]">
                    <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                      <input value={swapAmount} onChange={(event) => setSwapAmount(event.target.value)} className="w-full bg-transparent px-2 py-2 text-lg text-white outline-none" inputMode="decimal" />
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
                      <p className={cx("mt-2 text-xs", sellTokenBalance.isReal && !sellTokenBalance.error ? "text-mint" : "text-slate-400")}>{sellTokenBalance.label}</p>
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
                      <input value={estimatedReceive ? estimatedReceive.toFixed(4) : "0"} readOnly className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" />
                      <p className={cx("mt-2 text-xs", buyTokenBalance.isReal && !buyTokenBalance.error ? "text-mint" : "text-slate-400")}>{buyTokenBalance.label}</p>
                    </div>
                    <TokenPicker label="Receive token" selected={buyToken} activeTokens={activeTokens} comingSoon={comingSoonTokens} onSelect={setBuyToken} />
                  </div>
                </label>

                <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm sm:grid-cols-2">
                  <p className="text-slate-300">Live token price: <span className="font-semibold text-white">{formatPrice(liveSellPrice)}</span></p>
                  <p className="text-slate-300">Estimated receive: <span className="font-semibold text-white">{estimatedReceive.toFixed(4)} {buyToken.symbol}</span></p>
                  <p className="text-slate-300">Preferred route: <span className="font-semibold text-white">{preferredProvider.label}</span></p>
                  {lifiQuote?.provider ? <p className="text-slate-300">Route provider: <span className="font-semibold text-white">{lifiQuote.provider}</span></p> : null}
                  <p className="text-slate-300">Rate: <span className="font-semibold text-white">1 {sellToken.symbol} ≈ {rate.toFixed(6)} {buyToken.symbol}</span></p>
                  <p className="text-slate-300">Price impact: <span className="font-semibold text-white">{swapQuote.priceImpact.toFixed(3)}%</span></p>
                  <p className="text-slate-300">Network fee: <span className="font-semibold text-white">{lifiQuote?.feeEstimateUsd ? `$${lifiQuote.feeEstimateUsd}` : `$${swapQuote.networkFee.toFixed(4)}`}</span></p>
                  {lifiQuote?.gasEstimateUsd ? <p className="text-slate-300">Gas estimate: <span className="font-semibold text-white">${lifiQuote.gasEstimateUsd}</span></p> : null}
                </div>

                {!isConnected ? (
                  <div className="pt-1">
                    <WalletConnectButton />
                  </div>
                ) : (
                  <>
                    <button onClick={handleSwapQuote} disabled={appKitSwap.state === "estimating"} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mint to-cyan px-5 py-3 font-bold text-[#031018] shadow-neon disabled:opacity-60">
                      {appKitSwap.state === "estimating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat2 className="h-4 w-4" />}
                      Get Quote
                    </button>
                    {swapQuoteReady ? (
                      <button onClick={handleReviewSwap} disabled={appKitSwap.state === "swapping" || transactions.isPending} className="flex w-full items-center justify-center gap-2 rounded-lg border border-mint/30 bg-mint/10 px-5 py-3 font-semibold text-mint disabled:opacity-60">
                        {appKitSwap.state === "swapping" || transactions.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {lifiQuote?.transactionRequest ? "Execute Swap" : "Review Swap"}
                      </button>
                    ) : null}
                  </>
                )}
                {swapMessage ? <p className="text-sm text-cyan">{swapMessage}</p> : null}
                {arcNativePreferred ? (
                  <p className="text-xs text-slate-400">
                    Arc-native USDC/EURC is checked first. Until the official StableFX/App Kit execution adapter is enabled, executable quotes can fall back to LI.FI.
                  </p>
                ) : null}
                <p className="text-xs text-slate-500">Arc Testnet only. These tokens have no real monetary value.</p>
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
                      selected={getSwapToken(bridge.tokenSymbol)}
                      activeTokens={activeTokens}
                      comingSoon={comingSoonTokens}
                      onSelect={(token) => bridge.setTokenSymbol(token.symbol)}
                    />
                  </div>
                </label>

                <label className="block text-sm text-slate-300">
                  Amount
                  <input value={bridge.amount} onChange={(event) => bridge.setAmount(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan/60" inputMode="decimal" />
                </label>

                <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm sm:grid-cols-2">
                  <p className="text-slate-300">Estimated receive: <span className="font-semibold text-white">{lifiQuote?.toAmount ? (Number(lifiQuote.toAmount) / 1_000_000).toFixed(4) : bridge.quote.estimatedReceive.toFixed(4)} {bridge.tokenSymbol}</span></p>
                  <p className="text-slate-300">Bridge fee: <span className="font-semibold text-white">{lifiQuote?.feeEstimateUsd ? `$${lifiQuote.feeEstimateUsd}` : `${bridge.quote.bridgeFee.toFixed(4)} ${bridge.tokenSymbol}`}</span></p>
                  <p className="text-slate-300">ETA: <span className="font-semibold text-white">{bridge.quote.estimatedTime}</span></p>
                  <p className="text-slate-300">Route preview: <span className="font-semibold text-white">{lifiQuote?.provider ?? bridge.quote.route}</span></p>
                  {lifiQuote?.gasEstimateUsd ? <p className="text-slate-300">Gas estimate: <span className="font-semibold text-white">${lifiQuote.gasEstimateUsd}</span></p> : null}
                </div>

                <button onClick={handleBridgeQuote} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mint to-cyan px-5 py-3 font-bold text-[#031018] shadow-neon">
                  <Repeat2 className="h-4 w-4" /> Get Bridge Quote
                </button>
                {bridgeQuoteReady ? (
                  <button onClick={handleReviewBridge} disabled={transactions.isPending} className="flex w-full items-center justify-center gap-2 rounded-lg border border-mint/30 bg-mint/10 px-5 py-3 font-semibold text-mint disabled:opacity-60">
                    {transactions.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {lifiQuote?.transactionRequest ? "Execute Bridge" : "Review Bridge"}
                  </button>
                ) : null}
                {bridgeMessage ? <p className="text-sm text-cyan">{bridgeMessage}</p> : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
