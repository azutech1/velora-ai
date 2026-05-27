"use client";

import { useState } from "react";
import { AppShell } from "@/components/azu/app-shell";
import { cx } from "@/components/azu/utils";
import { Panel } from "@/components/azu/ui";
import { CrossChainSwap } from "@/components/swap/CrossChainSwap";
import { PopularPairs } from "@/components/swap/PopularPairs";
import { StablecoinRates } from "@/components/swap/StablecoinRates";
import { SwapCard } from "@/components/swap/SwapCard";
import { RECENT_SWAP_TOKENS, SWAP_TOKENS, getSwapToken } from "@/lib/swap/tokens";

export default function SwapPage() {
  const [selectedPair, setSelectedPair] = useState("USDC -> EURC");
  const [mode, setMode] = useState<"same-chain" | "cross-chain">("same-chain");

  return (
    <AppShell title="Swap" eyebrow="Multi-token Stablecoin Swap">
      <div className="space-y-6">
        <div className="glass rounded-lg p-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["same-chain", "Same-Chain Swap"],
              ["cross-chain", "Cross-Chain Swap"]
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMode(value as typeof mode)}
                className={cx(
                  "rounded-lg px-4 py-3 text-sm font-bold transition",
                  mode === value ? "bg-gradient-to-r from-mint to-cyan text-[#031018] shadow-neon" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {mode === "same-chain" ? (
          <>
            <SwapCard />

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel title="Quick swap pairs" eyebrow="Demo-mode popular routes">
                <PopularPairs onPairSelect={(from, to) => setSelectedPair(`${from} -> ${to}`)} />
                <p className="mt-4 text-sm text-cyan">Selected pair: {selectedPair}</p>
              </Panel>
              <Panel title="Stablecoin rates" eyebrow="USDC, EURC, USDT">
                <StablecoinRates />
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Recent tokens" eyebrow="Recently used in Velora AI">
                <div className="grid gap-3 sm:grid-cols-3">
                  {RECENT_SWAP_TOKENS.map((symbol) => {
                    const token = getSwapToken(symbol);
                    return (
                      <div key={token.symbol} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-lg font-bold text-white">{token.symbol}</p>
                        <p className="mt-1 text-sm text-slate-400">{token.name}</p>
                        <p className="mt-3 text-xs capitalize text-mint">{token.category}</p>
                      </div>
                    );
                  })}
                </div>
              </Panel>
              <Panel title="Token contract placeholders" eyebrow="Ready for Arc router configuration">
                <div className="scrollbar-soft max-h-72 space-y-3 overflow-y-auto pr-1">
                  {SWAP_TOKENS.map((token) => (
                    <div key={token.symbol} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold text-white">{token.symbol}</p>
                        <p className="text-xs capitalize text-slate-400">{token.category}</p>
                      </div>
                      <p className="mt-2 break-all text-xs text-slate-500">{token.contractAddress}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </>
        ) : (
          <CrossChainSwap />
        )}
      </div>
    </AppShell>
  );
}
