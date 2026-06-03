"use client";

import { Bell, CreditCard, History, LockKeyhole, ReceiptText, ShieldCheck, SlidersHorizontal, WalletCards } from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";

const plannedFeatures = [
  { title: "Payment request drafts", detail: "Prepare stablecoin payment requests for user review.", icon: ReceiptText },
  { title: "Agent-generated payment suggestions", detail: "Surface suggested payments from approved agent workflows.", icon: WalletCards },
  { title: "Manual approval before every payment", detail: "Require explicit user approval before any wallet transaction.", icon: LockKeyhole },
  { title: "Spend limits", detail: "Configure boundaries for payment preparation and review.", icon: SlidersHorizontal },
  { title: "Activity tracking", detail: "Record approved payment actions in the user activity timeline.", icon: History },
  { title: "Transaction history", detail: "Show confirmed payment records with transaction hashes and status.", icon: CreditCard }
];

function ComingSoonBadge() {
  return (
    <span className="inline-flex rounded-full border border-orange-400/35 bg-orange-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-orange-300">
      Coming Soon
    </span>
  );
}

export default function AgentPaymentsPage() {
  return (
    <AppShell title="Agent Payments" eyebrow="Public beta preparation">
      <div className="space-y-6">
        <Panel title="Agent Payments" eyebrow="Review and approve AI-assisted payment requests.">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <ComingSoonBadge />
              <h2 className="mt-5 text-3xl font-black text-white">Agent Payments</h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
                Agent Payments will allow AI-assisted payment flows where users can review, approve, and execute stablecoin payment requests securely.
              </p>
              <div className="mt-6 rounded-lg border border-orange-400/25 bg-orange-500/10 p-4 text-sm leading-6 text-orange-200">
                This feature is currently in preparation for public release. Velora is launching core wallet, swap, bridge, activity, and Pioneer features first. AI-powered automation and agent workflows will be rolled out after additional testing.
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <ShieldCheck className="h-6 w-6 text-orange-300" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Target rollout</p>
              <p className="mt-3 text-2xl font-black text-white">Within 1 month</p>
              <p className="mt-4 text-sm leading-6 text-slate-400">No AI agent will spend user funds without explicit wallet approval.</p>
              <button disabled className="mt-6 w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-slate-400">
                Notify Me
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Planned features" eyebrow="Secure payment preparation">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plannedFeatures.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <feature.icon className="h-5 w-5 text-orange-300" />
                <h3 className="mt-4 font-bold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.detail}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Approval-first policy" eyebrow="Public beta safety">
          <div className="grid gap-4 md:grid-cols-3">
            {["No automatic agent spending", "Manual approval before every payment", "Wallet confirmation required for execution"].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
                {item.startsWith("Wallet") ? <Bell className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" /> : <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />}
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
