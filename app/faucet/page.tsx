"use client";

import { ArrowUpRight, CheckCircle2, Droplets, Info, ShieldCheck, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";
import { AssistantHint } from "@/components/assistant/AssistantHint";
import { FaucetEligibility } from "@/components/faucet/FaucetEligibility";
import { useArcNetwork } from "@/hooks/useArcNetwork";
import { CIRCLE_FAUCET_URL, FAUCET_SAFETY_TEXT } from "@/lib/faucet/tokens";

const faucetUses = ["Swap", "Bridge", "Velora Pioneers", "Future ecosystem features"];

export default function FaucetPage() {
  const { isConnected } = useAccount();
  const { isArc } = useArcNetwork();

  return (
    <AppShell title="Faucet" eyebrow="Official Arc testnet access">
      <div className="space-y-6">
        <FaucetEligibility isConnected={isConnected} isArc={isArc} />
        <AssistantHint tip={'Ask Velora AI: "Claim faucet"'} />

        <Panel title="Get Arc Testnet Assets" eyebrow="Testnet Access">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-orange/30 bg-orange/10">
                <Droplets className="h-6 w-6 text-orange" />
              </div>
              <h2 className="mt-5 text-3xl font-black text-white">Get Arc Testnet Assets</h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
                Velora uses the official Arc/Circle faucet for testnet asset distribution.
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                Use the faucet to obtain supported testnet assets before using:
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {faucetUses.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-orange" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Wallet connection status</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/15 p-4">
                  <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-orange" />
                  <div>
                    <p className="font-bold text-white">{isConnected ? "Wallet connected" : "Wallet not connected"}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-400">{isConnected ? "You can use faucet assets after receiving them in your wallet." : "Connect your wallet before using Velora swap, bridge, and Pioneer features."}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/15 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange" />
                  <div>
                    <p className="font-bold text-white">{isArc ? "Arc Testnet selected" : "Arc Testnet recommended"}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-400">Use Arc Testnet assets only for testing. They have no real monetary value.</p>
                  </div>
                </div>
              </div>
              <a
                href={CIRCLE_FAUCET_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange to-red-500 px-5 py-3 text-sm font-black text-white shadow-[0_18px_42px_rgba(249,115,22,0.22)] transition hover:brightness-110"
              >
                Open Circle Faucet <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </Panel>

        <Panel title="Helpful faucet instructions" eyebrow="Before using Velora">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Open the official Arc/Circle faucet in a new tab.",
              "Request the supported testnet assets for your connected wallet.",
              "Return to Velora after the faucet transfer appears in your wallet."
            ].map((instruction) => (
              <div key={instruction} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
                <Info className="mt-1 h-4 w-4 shrink-0 text-orange" />
                <span>{instruction}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-xl border border-orange/25 bg-orange/10 p-4 text-sm leading-6 text-orange-200">{FAUCET_SAFETY_TEXT}</p>
        </Panel>
      </div>
    </AppShell>
  );
}
