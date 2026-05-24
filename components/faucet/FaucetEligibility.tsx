"use client";

import { ExternalLink, Loader2, RadioTower, ShieldCheck, Wallet } from "lucide-react";
import { useArcNetwork } from "@/hooks/useArcNetwork";
import { CIRCLE_FAUCET_URL, FAUCET_SAFETY_TEXT } from "@/lib/faucet/tokens";

export function FaucetEligibility({ isConnected, isArc }: { isConnected: boolean; isArc: boolean }) {
  const { isSwitching, switchToArc, expectedChain } = useArcNetwork();

  return (
    <section className="glass rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Faucet eligibility</p>
          <h2 className="text-xl font-bold text-white">Arc testnet access</h2>
        </div>
        <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">Demo Mode</span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <Wallet className="h-5 w-5 text-mint" />
          <p className="mt-3 font-semibold text-white">Wallet</p>
          <p className={isConnected ? "mt-1 text-sm text-mint" : "mt-1 text-sm text-red-300"}>{isConnected ? "Connected" : "Disconnected"}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <RadioTower className="h-5 w-5 text-cyan" />
          <p className="mt-3 font-semibold text-white">Network</p>
          <p className={isArc ? "mt-1 text-sm text-mint" : "mt-1 text-sm text-cyan"}>{isArc ? expectedChain.name : "Switch to Arc testnet"}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <ShieldCheck className="h-5 w-5 text-mint" />
          <p className="mt-3 font-semibold text-white">Safety</p>
          <p className="mt-1 text-sm text-slate-400">Testnet only</p>
        </div>
      </div>
      {!isArc && isConnected ? (
        <button onClick={() => switchToArc()} disabled={isSwitching} className="mt-5 flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm font-semibold text-cyan transition hover:border-mint/40 hover:text-mint disabled:opacity-60">
          {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Switch to Arc
        </button>
      ) : null}
      <a
        href={CIRCLE_FAUCET_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-mint to-cyan px-4 py-3 text-sm font-bold text-[#031018] shadow-neon transition hover:scale-[1.02]"
      >
        Open Circle Faucet <ExternalLink className="h-4 w-4" />
      </a>
      <p className="mt-5 rounded-lg border border-cyan/20 bg-cyan/10 p-4 text-sm leading-6 text-cyan">{FAUCET_SAFETY_TEXT}</p>
    </section>
  );
}
