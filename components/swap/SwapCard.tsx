"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowDownUp, Check, ExternalLink, Loader2, Repeat2, Settings2 } from "lucide-react";
import { TokenSelector } from "./TokenSelector";
import { SWAP_TOKENS, estimateDemoSwap, formatTokenAmount, getSwapToken } from "@/lib/swap/tokens";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useArcAppKitSwap } from "@/hooks/useArcAppKitSwap";
import { useSwapTokenBalance } from "@/hooks/useSwapTokenBalance";

export function SwapCard() {
  const [fromToken, setFromToken] = useState(getSwapToken("USDC"));
  const [toToken, setToToken] = useState(getSwapToken("EURC"));
  const [amount, setAmount] = useState("250");
  const [slippage, setSlippage] = useState("0.50");
  const [state, setState] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const { recordActivity } = useActivityRecorder();
  const appKitSwap = useArcAppKitSwap();
  const fromTokenBalance = useSwapTokenBalance(fromToken);
  const toTokenBalance = useSwapTokenBalance(toToken);

  const quote = useMemo(() => estimateDemoSwap(fromToken.symbol, toToken.symbol, amount), [amount, fromToken.symbol, toToken.symbol]);
  const slippageBps = Math.round(Number(slippage) * 100);
  const realSwapAvailable = appKitSwap.canUseRealSwap(fromToken.symbol, toToken.symbol);
  const unsupportedReason = appKitSwap.getUnsupportedReason(fromToken.symbol, toToken.symbol);
  const appKitEstimateOutput = appKitSwap.estimate?.estimatedOutput?.amount ? Number(appKitSwap.estimate.estimatedOutput.amount) : null;
  const displayedOutput = appKitEstimateOutput ?? quote.output;
  const stablecoins = SWAP_TOKENS.filter((token) => token.category === "stablecoin");
  const popular = SWAP_TOKENS.filter((token) => token.category !== "stablecoin");

  function flipTokens() {
    setFromToken(toToken);
    setToToken(fromToken);
    setState("idle");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    recordActivity({
      actionType: "swap_started",
      title: realSwapAvailable ? "App Kit swap estimate started" : "Swap preview started",
      description: `Previewing ${amount} ${fromToken.symbol} to ${toToken.symbol}.`,
      feature: "swap",
      token: `${fromToken.symbol}/${toToken.symbol}`,
      amount,
      network: "Arc Testnet",
      status: "pending"
    });

    const valid = Number(amount) > 0 && fromToken.symbol !== toToken.symbol;
    if (!valid) {
      setState("error");
      setMessage("Enter a positive amount and choose different tokens.");
      recordActivity({
        actionType: "swap_failed",
        title: "Swap preview failed",
        description: "Swap preview requires a positive amount and different tokens.",
        feature: "swap",
        token: `${fromToken.symbol}/${toToken.symbol}`,
        amount,
        network: "Arc Testnet",
        status: "failed"
      });
      return;
    }

    if (realSwapAvailable) {
      try {
        recordActivity({
          actionType: "swap_started",
          title: "Circle App Kit quote requested",
          description: `Requesting real quote for ${amount} ${fromToken.symbol} to ${toToken.symbol}.`,
          feature: "swap",
          token: `${fromToken.symbol}/${toToken.symbol}`,
          amount,
          network: "Arc Testnet",
          status: "pending",
          metadata: { stage: "quote_requested" }
        });
        const estimate = await appKitSwap.estimateSwap(fromToken.symbol, toToken.symbol, amount, slippageBps);
        setState("success");
        setMessage(`Real App Kit quote ready: ${amount} ${fromToken.symbol} to ${estimate.estimatedOutput?.amount ?? "estimated"} ${toToken.symbol}.`);
        recordActivity({
          actionType: "swap_completed",
          title: "App Kit swap estimate ready",
          description: `Circle App Kit quote prepared for ${fromToken.symbol} to ${toToken.symbol}.`,
          feature: "swap",
          token: `${fromToken.symbol}/${toToken.symbol}`,
          amount,
          network: "Arc Testnet",
          status: "success",
          metadata: { stage: "quote_ready", requestId: estimate.diagnostics?.requestId ?? null }
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "App Kit quote failed.";
        setState("error");
        setMessage(reason);
        recordActivity({
          actionType: "swap_failed",
          title: "App Kit swap estimate failed",
          description: reason,
          feature: "swap",
          token: `${fromToken.symbol}/${toToken.symbol}`,
          amount,
          network: "Arc Testnet",
          status: "failed",
          metadata: { stage: "quote_failed" }
        });
      }
      return;
    }

    setState("success");
    setMessage(`Demo preview ready: ${amount} ${fromToken.symbol} to ${formatTokenAmount(quote.output, toToken.symbol)}.`);
    recordActivity({
      actionType: "swap_completed",
      title: "Swap preview completed",
      description: `Demo quote prepared for ${fromToken.symbol} to ${toToken.symbol}.`,
      feature: "swap",
      token: `${fromToken.symbol}/${toToken.symbol}`,
      amount,
      network: "Arc Testnet",
      status: "success"
    });
  }

  async function executeRealSwap() {
    try {
      recordActivity({
        actionType: "swap_started",
        title: "App Kit swap execution started",
        description: `Executing ${amount} ${fromToken.symbol} to ${toToken.symbol} on Arc Testnet.`,
        feature: "swap",
        token: `${fromToken.symbol}/${toToken.symbol}`,
        amount,
        network: "Arc Testnet",
        status: "pending"
      });
      const result = await appKitSwap.executeSwap(fromToken.symbol, toToken.symbol, amount, slippageBps);
      setState("success");
      setMessage(`Real App Kit swap submitted: ${result.txHash}`);
      recordActivity({
        actionType: "swap_completed",
        title: "App Kit swap completed",
        description: `Real Arc Testnet swap submitted through Circle App Kit.`,
        feature: "swap",
        token: `${fromToken.symbol}/${toToken.symbol}`,
        amount,
        network: "Arc Testnet",
        status: "success",
        txHash: result.txHash,
        metadata: { stage: "swap_confirmed" }
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "App Kit swap failed.";
      setState("error");
      setMessage(reason);
      recordActivity({
        actionType: "swap_failed",
        title: "App Kit swap failed",
        description: reason,
        feature: "swap",
        token: `${fromToken.symbol}/${toToken.symbol}`,
        amount,
        network: "Arc Testnet",
        status: "failed",
        metadata: { stage: "swap_failed" }
      });
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="glass rounded-lg p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">Multi-token stablecoin swap</p>
            <h2 className="text-xl font-bold text-white">{realSwapAvailable ? "Stablecoin Swap" : "Swap Preview"}</h2>
          </div>
          <span className={realSwapAvailable ? "rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint" : "rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan"}>
            {realSwapAvailable ? "Circle App Kit" : "Demo Mode"}
          </span>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-black/30 p-4">
            <label className="text-sm text-slate-300">
              From
              <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_220px]">
                <input value={amount} onChange={(event) => setAmount(event.target.value)} className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-mint/60" inputMode="decimal" />
                <TokenSelector label="From token" token={fromToken} onSelect={setFromToken} />
              </div>
            </label>
            <p className={fromTokenBalance.isReal ? "mt-3 text-xs text-mint" : "mt-3 text-xs text-slate-500"}>{fromTokenBalance.label}</p>
          </div>

          <div className="flex justify-center">
            <motion.button whileTap={{ scale: 0.92 }} type="button" onClick={flipTokens} className="grid h-12 w-12 place-items-center rounded-full border border-mint/30 bg-mint/10 text-mint shadow-neon" aria-label="Flip swap direction">
              <ArrowDownUp className="h-5 w-5" />
            </motion.button>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-4">
            <label className="text-sm text-slate-300">
              To
              <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_220px]">
                <input value={displayedOutput ? displayedOutput.toLocaleString(undefined, { maximumFractionDigits: 6 }) : "0"} readOnly className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none" />
                <TokenSelector label="To token" token={toToken} onSelect={setToToken} />
              </div>
            </label>
            <p className={toTokenBalance.isReal ? "mt-3 text-xs text-mint" : "mt-3 text-xs text-slate-500"}>{toTokenBalance.label}</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Settings2 className="h-4 w-4 text-cyan" /> Slippage settings
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["0.10", "0.50", "1.00"].map((value) => (
                <button key={value} type="button" onClick={() => setSlippage(value)} className={slippage === value ? "rounded-full bg-mint px-3 py-2 text-xs font-bold text-[#031018]" : "rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300"}>
                  {value}%
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-cyan/20 bg-cyan/10 p-4 text-sm leading-6 text-cyan">
            {realSwapAvailable
              ? "Real Arc Testnet quote/execution is enabled through Circle App Kit for supported tokens. Confirm carefully in your wallet."
              : unsupportedReason
                ? unsupportedReason
              : appKitSwap.hasKitKey
                ? "Preview pricing only for unsupported tokens. Real Arc Testnet swaps are available for configured USDC, EURC, and USDT routes."
                : "Preview pricing only. Add a Circle App Kit key to enable supported Arc Testnet swaps."}
          </div>

          <button disabled={appKitSwap.state === "estimating" || appKitSwap.state === "swapping"} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mint to-cyan px-5 py-3 font-bold text-[#031018] shadow-neon transition hover:scale-[1.01] disabled:opacity-60">
            {appKitSwap.state === "estimating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat2 className="h-4 w-4" />}
            {realSwapAvailable ? "Get Real Quote" : "Preview Demo Swap"}
          </button>
          {realSwapAvailable && appKitSwap.estimate ? (
            <button type="button" onClick={executeRealSwap} disabled={appKitSwap.state === "swapping"} className="flex w-full items-center justify-center gap-2 rounded-lg border border-mint/30 bg-mint/10 px-5 py-3 font-bold text-mint transition hover:bg-mint hover:text-[#031018] disabled:opacity-60">
              {appKitSwap.state === "swapping" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Execute Swap
            </button>
          ) : null}
        </form>

        {state === "success" ? (
          <div className="mt-5 rounded-lg border border-mint/30 bg-mint/10 p-4 text-sm text-mint">
            <Check className="mb-2 h-5 w-5" />
            {message}
            {appKitSwap.result?.explorerUrl ? (
              <a className="mt-3 inline-flex items-center gap-2 text-cyan hover:text-white" href={appKitSwap.result.explorerUrl} target="_blank" rel="noreferrer">
                View swap <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        ) : null}
        {state === "error" ? (
          <div className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertTriangle className="mb-2 h-5 w-5" />
            {message || appKitSwap.error || "Enter a positive amount and choose different tokens."}
          </div>
        ) : null}
      </section>

      <div className="space-y-6">
        <section className="glass rounded-lg p-5">
          <h2 className="text-xl font-bold text-white">Quote details</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Estimated receive", appKitSwap.estimate?.estimatedOutput ? `${appKitSwap.estimate.estimatedOutput.amount} ${appKitSwap.estimate.estimatedOutput.token}` : formatTokenAmount(quote.output, toToken.symbol)],
              ["USD value", `$${quote.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`],
              ["FX rate", `1 ${fromToken.symbol} ≈ ${quote.rate.toFixed(6)} ${toToken.symbol}`],
              ["Price impact", `${quote.priceImpact.toFixed(3)}%`],
              ["Minimum received", appKitSwap.estimate?.stopLimit ? `${appKitSwap.estimate.stopLimit.amount} ${appKitSwap.estimate.stopLimit.token}` : formatTokenAmount(quote.minimumReceived, toToken.symbol)],
              ["Network fee", `$${quote.networkFee.toFixed(4)}`]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass rounded-lg p-5">
          <h2 className="text-xl font-bold text-white">Stablecoin section</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {stablecoins.map((token) => (
              <div key={token.symbol} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="font-bold text-white">{token.symbol}</p>
                <p className="text-sm text-slate-400">{token.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass rounded-lg p-5">
          <h2 className="text-xl font-bold text-white">Popular tokens</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {popular.map((token) => (
              <div key={token.symbol} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="font-bold text-white">{token.symbol}</p>
                <p className="text-xs text-slate-400">{token.category}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
