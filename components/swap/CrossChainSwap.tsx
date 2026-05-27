"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Loader2, Repeat2 } from "lucide-react";
import { useCrossChainSwap } from "@/hooks/useCrossChainSwap";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { BridgeRoutePreview } from "./BridgeRoutePreview";
import { CrossChainConfirmModal } from "./CrossChainConfirmModal";
import { NetworkSelector } from "./NetworkSelector";
import { CROSS_CHAIN_USDC } from "@/lib/swap/networks";
import { TokenLogo } from "@/components/token/TokenLogo";

export function CrossChainSwap() {
  const bridge = useCrossChainSwap();
  const { recordActivity } = useActivityRecorder();
  const [modalOpen, setModalOpen] = useState(false);
  const busy = bridge.state === "approving" || bridge.state === "bridging" || bridge.state === "confirming";

  function review() {
    recordActivity({
      actionType: "bridge_started",
      title: "Bridge review started",
      description: `Reviewing ${bridge.amount} USDC from ${bridge.fromNetwork.name} to ${bridge.toNetwork.name}.`,
      feature: "bridge",
      token: "USDC",
      amount: bridge.amount,
      network: `${bridge.fromNetwork.name} -> ${bridge.toNetwork.name}`,
      status: "pending"
    });
    const ok = bridge.reviewBridge();
    if (ok) {
      setModalOpen(true);
    } else {
      recordActivity({
        actionType: "bridge_failed",
        title: "Bridge review failed",
        description: "The demo bridge route could not be reviewed.",
        feature: "bridge",
        token: "USDC",
        amount: bridge.amount,
        network: `${bridge.fromNetwork.name} -> ${bridge.toNetwork.name}`,
        status: "failed"
      });
    }
  }

  async function confirm() {
    await bridge.confirmBridge();
    setModalOpen(false);
    recordActivity({
      actionType: "bridge_completed",
      title: "Bridge completed",
      description: `Demo bridge completed from ${bridge.fromNetwork.name} to ${bridge.toNetwork.name}.`,
      feature: "bridge",
      token: "USDC",
      amount: bridge.amount,
      network: `${bridge.fromNetwork.name} -> ${bridge.toNetwork.name}`,
      status: "success",
      txHash: bridge.quote.hashPlaceholder
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="glass rounded-lg p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">Bridge-style USDC movement</p>
            <h2 className="text-xl font-bold text-white">Cross-Chain Swap</h2>
          </div>
          <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">Demo Mode</span>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-300">
              From network
              <div className="mt-2">
                <NetworkSelector label="Source network" network={bridge.fromNetwork} onSelect={(network) => bridge.setFromNetworkId(network.id)} />
              </div>
            </label>
            <label className="block text-sm text-slate-300">
              To network
              <div className="mt-2">
                <NetworkSelector label="Destination network" network={bridge.toNetwork} onSelect={(network) => bridge.setToNetworkId(network.id)} />
              </div>
            </label>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-4">
            <p className="text-sm text-slate-300">From token</p>
            <div className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="flex items-center gap-3">
                <TokenLogo symbol={CROSS_CHAIN_USDC.symbol} size={40} />
                <div>
                  <p className="font-bold text-white">{CROSS_CHAIN_USDC.symbol}</p>
                  <p className="text-xs text-slate-400">{CROSS_CHAIN_USDC.name}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">Testnet</span>
            </div>
          </div>

          <label className="block text-sm text-slate-300">
            Amount
            <input value={bridge.amount} onChange={(event) => bridge.setAmount(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-mint/60" inputMode="decimal" />
          </label>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">Slippage setting</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["0.10", "0.50", "1.00"].map((value) => (
                <button key={value} type="button" onClick={() => bridge.setSlippage(value)} className={bridge.slippage === value ? "rounded-full bg-mint px-3 py-2 text-xs font-bold text-[#031018]" : "rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300"}>
                  {value}%
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-cyan/20 bg-cyan/10 p-4 text-sm leading-6 text-cyan">
            Demo Mode: real bridge not connected yet. Configure an Arc bridge provider/router before executing real cross-chain swaps.
          </div>

          <button onClick={review} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mint to-cyan px-5 py-3 font-bold text-[#031018] shadow-neon transition hover:scale-[1.01] disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat2 className="h-4 w-4" />}
            Review Bridge
          </button>
        </div>

        {bridge.error ? (
          <div className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertTriangle className="mb-2 h-5 w-5" />
            {bridge.error}
          </div>
        ) : null}
        {bridge.state === "completed" ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-lg border border-mint/30 bg-mint/10 p-4 text-sm text-mint">
            <Check className="mb-2 h-5 w-5" />
            Demo bridge completed. Hash placeholder: {bridge.completedHash}
          </motion.div>
        ) : null}
      </section>

      <div className="space-y-6">
        <section className="glass rounded-lg p-5">
          <h2 className="text-xl font-bold text-white">Bridge quote</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Estimated receive", `${bridge.quote.estimatedReceive.toFixed(4)} USDC`],
              ["Bridge fee", `${bridge.quote.bridgeFee.toFixed(4)} USDC`],
              ["Gas estimate", bridge.quote.gasEstimate],
              ["Arrival time", bridge.quote.estimatedTime],
              ["Source match", bridge.sourceNetworkMatchesWallet ? "Wallet ready" : "Switch source network"],
              ["Destination status", bridge.toNetwork.status]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <BridgeRoutePreview fromNetwork={bridge.fromNetwork} toNetwork={bridge.toNetwork} quote={bridge.quote} />
      </div>

      <CrossChainConfirmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirm}
        state={bridge.state}
        fromNetwork={bridge.fromNetwork}
        toNetwork={bridge.toNetwork}
        amount={bridge.amount}
        quote={bridge.quote}
      />
    </div>
  );
}
