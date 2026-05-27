"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownUp, Check, ChevronDown, Loader2, RefreshCw, Repeat2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { cx } from "@/components/azu/utils";
import { NetworkLogo } from "@/components/token/NetworkLogo";
import { TokenLogo } from "@/components/token/TokenLogo";
import { WalletConnectButton } from "@/components/web3/WalletConnectButton";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useArcAppKitSwap } from "@/hooks/useArcAppKitSwap";
import { useCrossChainSwap } from "@/hooks/useCrossChainSwap";
import { useStablecoinPrices } from "@/hooks/useStablecoinPrices";
import { CROSS_CHAIN_NETWORKS, type BridgeNetwork } from "@/lib/swap/networks";
import { SWAP_TOKENS, estimateDemoSwap, getSwapToken, type SwapToken } from "@/lib/swap/tokens";

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

function formatPrice(value: number) {
  return `$${value.toFixed(4)}`;
}

function formatChange(change: number) {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

function parseMockBalance(token: SwapToken) {
  return Number(token.mockBalance.replaceAll(",", "")) || 0;
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
  const { isConnected } = useAccount();
  const { recordActivity } = useActivityRecorder();
  const appKitSwap = useArcAppKitSwap();
  const bridge = useCrossChainSwap();
  const prices = useStablecoinPrices();
  const [tab, setTab] = useState<TradeTab>("swap");
  const [sellToken, setSellToken] = useState(getSwapToken("USDC"));
  const [buyToken, setBuyToken] = useState(getSwapToken("EURC"));
  const [swapAmount, setSwapAmount] = useState("250");
  const [swapQuoteReady, setSwapQuoteReady] = useState(false);
  const [swapMessage, setSwapMessage] = useState("");
  const [bridgeQuoteReady, setBridgeQuoteReady] = useState(false);
  const [bridgeMessage, setBridgeMessage] = useState("");

  const activeTokens = useMemo(() => ACTIVE_STABLECOINS.map((symbol) => getSwapToken(symbol)).filter(Boolean), []);
  const comingSoonTokens = useMemo<ComingSoonToken[]>(() => {
    const fromExisting = SWAP_TOKENS.filter((token) => !ACTIVE_STABLECOINS.includes(token.symbol as (typeof ACTIVE_STABLECOINS)[number])).map((token) => ({ symbol: token.symbol, name: token.name }));
    const merged = [...fromExisting, ...EXTRA_COMING_SOON_TOKENS];
    return merged.filter((item, index) => merged.findIndex((candidate) => candidate.symbol.toLowerCase() === item.symbol.toLowerCase()) === index);
  }, []);

  const swapQuote = useMemo(() => estimateDemoSwap(sellToken.symbol, buyToken.symbol, swapAmount), [buyToken.symbol, sellToken.symbol, swapAmount]);
  const liveSellPrice = prices.prices[sellToken.symbol as "USDC" | "EURC" | "USDT"]?.price ?? sellToken.mockPrice;
  const liveBuyPrice = prices.prices[buyToken.symbol as "USDC" | "EURC" | "USDT"]?.price ?? buyToken.mockPrice;
  const estimatedReceive = appKitSwap.estimate?.estimatedOutput?.amount ? Number(appKitSwap.estimate.estimatedOutput.amount) : swapQuote.output;
  const rate = liveSellPrice / Math.max(liveBuyPrice, 0.0001);
  const realSwapEnabled = appKitSwap.canUseRealSwap(sellToken.symbol, buyToken.symbol);

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
    const value = parseMockBalance(sellToken) * percent;
    setSwapAmount(value.toFixed(2));
  }

  async function handleSwapQuote() {
    setSwapQuoteReady(false);
    setSwapMessage("");
    recordActivity({
      actionType: "quote_requested",
      title: "Swap quote requested",
      description: `Requested quote for ${swapAmount} ${sellToken.symbol} to ${buyToken.symbol}.`,
      feature: "swap",
      token: `${sellToken.symbol}/${buyToken.symbol}`,
      amount: swapAmount,
      status: "pending"
    });

    if (!swapAmount || Number(swapAmount) <= 0 || sellToken.symbol === buyToken.symbol) {
      recordActivity({
        actionType: "quote_failed",
        title: "Swap quote failed",
        description: "Invalid swap amount or token pair.",
        feature: "swap",
        token: `${sellToken.symbol}/${buyToken.symbol}`,
        amount: swapAmount,
        status: "failed"
      });
      setSwapMessage("Enter a valid amount and choose different tokens.");
      return;
    }

    if (realSwapEnabled) {
      try {
        await appKitSwap.estimateSwap(sellToken.symbol, buyToken.symbol, swapAmount, 50);
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Quote could not be fetched.";
        recordActivity({
          actionType: "quote_failed",
          title: "Swap quote failed",
          description: reason,
          feature: "swap",
          token: `${sellToken.symbol}/${buyToken.symbol}`,
          amount: swapAmount,
          status: "failed"
        });
        setSwapMessage(reason);
        return;
      }
    }

    setSwapQuoteReady(true);
    setSwapMessage("Quote ready. Review swap before execution.");
  }

  async function handleReviewSwap() {
    recordActivity({
      actionType: "swap_reviewed",
      title: "Swap reviewed",
      description: `Reviewed quote for ${swapAmount} ${sellToken.symbol} to ${buyToken.symbol}.`,
      feature: "swap",
      token: `${sellToken.symbol}/${buyToken.symbol}`,
      amount: swapAmount,
      status: "info"
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
          txHash: result.txHash
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
          status: "failed"
        });
        setSwapMessage(reason);
        return;
      }
    }

    recordActivity({
      actionType: "swap_completed",
      title: "Swap completed",
      description: "Demo quote review completed in quote mode.",
      feature: "swap",
      token: `${sellToken.symbol}/${buyToken.symbol}`,
      amount: swapAmount,
      status: "success"
    });
    setSwapMessage("Swap reviewed in quote mode. Real router not connected yet.");
  }

  function handleBridgeQuote() {
    setBridgeQuoteReady(false);
    setBridgeMessage("");
    recordActivity({
      actionType: "quote_requested",
      title: "Bridge quote requested",
      description: `Requested bridge quote for ${bridge.amount} ${bridge.tokenSymbol}.`,
      feature: "bridge",
      token: bridge.tokenSymbol,
      amount: bridge.amount,
      network: `${bridge.fromNetwork.name} -> ${bridge.toNetwork.name}`,
      status: "pending"
    });
    if (!bridge.quote.valid) {
      recordActivity({
        actionType: "quote_failed",
        title: "Bridge quote failed",
        description: bridge.quote.reason ?? "Bridge quote was invalid.",
        feature: "bridge",
        token: bridge.tokenSymbol,
        amount: bridge.amount,
        status: "failed"
      });
      setBridgeMessage(bridge.quote.reason ?? "Bridge quote invalid.");
      return;
    }

    setBridgeQuoteReady(true);
    setBridgeMessage("Bridge quote ready. Review bridge before execution.");
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
      status: "info"
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
        status: "failed"
      });
      setBridgeMessage(bridge.error ?? "Bridge review failed.");
      return;
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
      txHash: bridge.quote.hashPlaceholder
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

            <p className="mb-4 rounded-lg border border-cyan/20 bg-cyan/10 p-3 text-sm text-cyan">Quote mode only - real router/bridge not connected yet.</p>

            {tab === "swap" ? (
              <div className="space-y-4">
                <label className="block text-sm text-slate-300">
                  Sell
                  <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_220px]">
                    <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                      <input value={swapAmount} onChange={(event) => setSwapAmount(event.target.value)} className="w-full bg-transparent px-2 py-2 text-lg text-white outline-none" inputMode="decimal" />
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => setPercent(0.5)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:text-white">50%</button>
                        <button type="button" onClick={() => setPercent(1)} className="rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint">Max</button>
                      </div>
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
                    <input value={estimatedReceive ? estimatedReceive.toFixed(4) : "0"} readOnly className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" />
                    <TokenPicker label="Receive token" selected={buyToken} activeTokens={activeTokens} comingSoon={comingSoonTokens} onSelect={setBuyToken} />
                  </div>
                </label>

                <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm sm:grid-cols-2">
                  <p className="text-slate-300">Live token price: <span className="font-semibold text-white">{formatPrice(liveSellPrice)}</span></p>
                  <p className="text-slate-300">Estimated receive: <span className="font-semibold text-white">{estimatedReceive.toFixed(4)} {buyToken.symbol}</span></p>
                  <p className="text-slate-300">Rate: <span className="font-semibold text-white">1 {sellToken.symbol} ≈ {rate.toFixed(6)} {buyToken.symbol}</span></p>
                  <p className="text-slate-300">Price impact: <span className="font-semibold text-white">{swapQuote.priceImpact.toFixed(3)}%</span></p>
                  <p className="text-slate-300">Network fee: <span className="font-semibold text-white">${swapQuote.networkFee.toFixed(4)}</span></p>
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
                      <button onClick={handleReviewSwap} disabled={appKitSwap.state === "swapping"} className="flex w-full items-center justify-center gap-2 rounded-lg border border-mint/30 bg-mint/10 px-5 py-3 font-semibold text-mint disabled:opacity-60">
                        {appKitSwap.state === "swapping" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Review Swap
                      </button>
                    ) : null}
                  </>
                )}
                {swapMessage ? <p className="text-sm text-cyan">{swapMessage}</p> : null}
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
                  <p className="text-slate-300">Estimated receive: <span className="font-semibold text-white">{bridge.quote.estimatedReceive.toFixed(4)} {bridge.tokenSymbol}</span></p>
                  <p className="text-slate-300">Bridge fee: <span className="font-semibold text-white">{bridge.quote.bridgeFee.toFixed(4)} {bridge.tokenSymbol}</span></p>
                  <p className="text-slate-300">ETA: <span className="font-semibold text-white">{bridge.quote.estimatedTime}</span></p>
                  <p className="text-slate-300">Route preview: <span className="font-semibold text-white">{bridge.quote.route}</span></p>
                </div>

                <button onClick={handleBridgeQuote} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mint to-cyan px-5 py-3 font-bold text-[#031018] shadow-neon">
                  <Repeat2 className="h-4 w-4" /> Get Bridge Quote
                </button>
                {bridgeQuoteReady ? (
                  <button onClick={handleReviewBridge} className="flex w-full items-center justify-center gap-2 rounded-lg border border-mint/30 bg-mint/10 px-5 py-3 font-semibold text-mint">
                    <Check className="h-4 w-4" /> Review Bridge
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
