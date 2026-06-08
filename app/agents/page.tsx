"use client";

import { BarChart3, Bot, CircleDollarSign, LockKeyhole, Route, ShieldAlert, Sparkles, WalletCards } from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";

const agents = [
  {
    name: "Treasury Agent",
    purpose: "Helps users understand stablecoin allocation.",
    helps: "Analyze USDC, EURC, and USDT balances, show allocation percentages, and recommend safer balance distribution.",
    icon: WalletCards
  },
  {
    name: "Routing Agent",
    purpose: "Finds best swap and bridge route.",
    helps: "Compare available routes, check fees, review estimated receive amounts, and warn if a route is unavailable.",
    icon: Route
  },
  {
    name: "Payment Agent",
    purpose: "Helps users prepare stablecoin payments.",
    helps: "Create payment request drafts, check recipient wallets, check amounts, and require user approval before transactions.",
    icon: CircleDollarSign
  },
  {
    name: "Risk Agent",
    purpose: "Protects users from bad routes and risky actions.",
    helps: "Warn about high fees, unsupported routes, wrong networks, failed quotes, and suspicious recipients.",
    icon: ShieldAlert
  },
  {
    name: "Analytics Agent",
    purpose: "Summarizes user activity.",
    helps: "Show total swaps, bridges, activity trends, most used token, and Velora Pioneers progress.",
    icon: BarChart3
  }
];

function ComingSoonBadge() {
  return (
    <span className="inline-flex rounded-full border border-orange-400/35 bg-orange-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-orange-300">
      Coming Soon
    </span>
  );
}

export default function AgentsPage() {
  return (
    <AppShell title="AI Agents" eyebrow="Public beta preparation">
      <div className="space-y-6">
        <Panel title="AI Agents" eyebrow="AI-powered assistants for stablecoin finance.">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <ComingSoonBadge />
              <h2 className="mt-5 text-3xl font-black text-white">AI Agents</h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
                AI Agents will help users analyze balances, compare routes, detect risks, review activity, and prepare recommendations.
              </p>
              <div className="mt-6 rounded-lg border border-orange-400/25 bg-orange-500/10 p-4 text-sm leading-6 text-orange-200">
                This feature is currently in preparation for public release. Velora is launching core wallet, swap, bridge, activity, and Pioneer features first. AI-powered automation and agent workflows will be rolled out after additional testing.
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <Sparkles className="h-6 w-6 text-orange-300" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Target rollout</p>
              <p className="mt-3 text-2xl font-black text-white">Within 1 month</p>
              <p className="mt-4 text-sm leading-6 text-slate-400">AI Agents will provide recommendations only. They will not move funds automatically.</p>
              <button disabled className="mt-6 w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-slate-400">
                Coming Soon
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Planned agent lineup" eyebrow="Recommendation-only intelligence">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
              <section key={agent.name} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-orange-400/25 bg-orange-500/10">
                    <agent.icon className="h-5 w-5 text-orange-300" />
                  </div>
                  <div>
                    <h3 className="font-black text-white">{agent.name}</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-300">{agent.purpose}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-400">{agent.helps}</p>
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-slate-300">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                  <span>Approval-first: recommendations only, no automatic fund movement.</span>
                </div>
                <button disabled className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-slate-400">
                  <Bot className="h-4 w-4" /> Open Agent
                </button>
              </section>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
