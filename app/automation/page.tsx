"use client";

import { Bell, CalendarClock, Eye, LockKeyhole, Route, ShieldCheck, Workflow, Zap } from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";

const plannedFeatures = [
  { title: "Balance alerts", detail: "Monitor stablecoin balances and notify users when important thresholds are reached.", icon: Bell },
  { title: "Route availability alerts", detail: "Track when preferred swap or bridge routes become available.", icon: Route },
  { title: "Fee monitoring", detail: "Watch network costs and surface cleaner timing for user-reviewed actions.", icon: Eye },
  { title: "Stablecoin workflow automation", detail: "Prepare repeatable stablecoin workflows without automatic fund movement.", icon: Workflow },
  { title: "Approval-first scheduled actions", detail: "Schedule prepared actions that still require explicit wallet approval.", icon: CalendarClock },
  { title: "Activity-based triggers", detail: "React to user activity patterns with recommendations and alerts.", icon: Zap }
];

function ComingSoonBadge() {
  return (
    <span className="inline-flex rounded-full border border-orange-400/35 bg-orange-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-orange-300">
      Coming Soon
    </span>
  );
}

export default function AutomationPage() {
  return (
    <AppShell title="AI Automation" eyebrow="Public beta preparation">
      <div className="space-y-6">
        <Panel title="AI Automation" eyebrow="Automate stablecoin workflows with approval-first intelligence.">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <ComingSoonBadge />
              <h2 className="mt-5 text-3xl font-black text-white">AI Automation</h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
                AI Automation will allow users to create smart workflows for stablecoin activity, balance monitoring, route alerts, fee alerts, and scheduled actions.
              </p>
              <div className="mt-6 rounded-lg border border-orange-400/25 bg-orange-500/10 p-4 text-sm leading-6 text-orange-200">
                This feature is currently in preparation for public release. Velora is launching core wallet, swap, bridge, activity, and Pioneer features first. AI-powered automation and agent workflows will be rolled out after additional testing.
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Target rollout</p>
              <p className="mt-3 text-2xl font-black text-white">Within 1 month</p>
              <p className="mt-4 text-sm leading-6 text-slate-400">AI Automation is planned to go live for users soon.</p>
              <button disabled className="mt-6 w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-slate-400">
                Notify Me
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Planned features" eyebrow="Approval-first automation roadmap">
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

        <Panel title="Safety model" eyebrow="No automatic fund movement">
          <div className="grid gap-4 md:grid-cols-3">
            {["Manual review before prepared actions", "Wallet approval required for every transaction", "No live automation execution during public beta"].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
                {item.startsWith("Wallet") ? <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" /> : <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />}
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
