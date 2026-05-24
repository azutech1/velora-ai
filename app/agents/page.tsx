"use client";

import { Bot, Gauge, Settings } from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { agents } from "@/components/azu/data";
import { Panel, StatusBadge } from "@/components/azu/ui";

export default function AgentsPage() {
  return (
    <AppShell title="AI Agents">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {agents.map((agent) => (
          <section key={agent.name} className="glass rounded-lg p-5 transition hover:-translate-y-1 hover:shadow-neon">
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-lg border border-cyan/20 bg-cyan/10">
                <Bot className="h-6 w-6 text-cyan" />
              </div>
              <StatusBadge status={agent.status} />
            </div>
            <h2 className="mt-5 text-xl font-bold text-white">{agent.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{agent.role}</p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-slate-300"><span>Spending</span><span className="text-white">{agent.spend}</span></div>
              <div className="flex justify-between text-slate-300"><span>Limit</span><span className="text-cyan">{agent.limit}</span></div>
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-gradient-to-r from-mint to-cyan" style={{ width: `${agent.health}%` }} />
              </div>
              <p className="leading-6 text-slate-400">{agent.activity}</p>
            </div>
            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-mint/30 bg-mint/10 px-4 py-3 text-sm font-semibold text-mint transition hover:bg-mint hover:text-[#031018]">
              <Settings className="h-4 w-4" /> Manage agent
            </button>
          </section>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Agent activity">
          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div>
                  <p className="font-semibold text-white">{agent.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{agent.activity}</p>
                </div>
                <Gauge className="h-5 w-5 text-mint" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Permission readiness">
          <div className="grid gap-4 sm:grid-cols-2">
            {["Wallet signing", "Policy limits", "Webhook scopes", "API key vault"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="font-semibold text-white">{item}</p>
                <p className="mt-2 text-sm text-slate-400">Ready for Arc and wallet integration.</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
