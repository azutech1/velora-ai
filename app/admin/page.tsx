"use client";

import { Bot, CircleDollarSign, KeyRound, LockKeyhole, Network, ReceiptText, ShieldCheck, Terminal } from "lucide-react";
import { useAccount } from "wagmi";
import { GatewayFunding } from "@/components/agent-payments/GatewayFunding";
import { AppShell } from "@/components/azu/app-shell";
import { MetricCard, Panel } from "@/components/azu/ui";
import { useAdminMode } from "@/hooks/useAdminMode";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { shortAddress } from "@/lib/utils/format";

const adminStatuses = [
  { label: "Gateway configuration", value: "Requires setup", icon: CircleDollarSign },
  { label: "Circle Gateway setup", value: "Admin managed", icon: Network },
  { label: "x402/nanopayments", value: "Coming soon", icon: ReceiptText },
  { label: "Service registry", value: "Prepare-only", icon: Bot }
];

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { isAdmin } = useAdminMode();

  if (!isConnected) {
    return (
      <AppShell title="Admin" eyebrow="Creator controls">
        <Panel title="Admin access" eyebrow="Wallet access required">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-slate-400">Connect wallet to access this section.</div>
        </Panel>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Admin" eyebrow="Creator controls">
        <Panel title="Admin access required" eyebrow="Restricted route">
          <div className="rounded-lg border border-red-400/20 bg-red-500/[0.06] p-8 text-center">
            <LockKeyhole className="mx-auto h-8 w-8 text-red-200" />
            <p className="mt-4 text-sm font-semibold text-white">Admin access required.</p>
          </div>
        </Panel>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin" eyebrow="Creator platform controls">
      <div className="space-y-6">
        <Panel title="Platform Admin" eyebrow="Creator wallet detected">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-mint/20 bg-mint/10 p-4">
              <p className="text-sm text-slate-300">Connected admin wallet</p>
              <p className="mt-2 break-all font-semibold text-white">{shortAddress(address)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Supabase Sync</p>
              <p className="mt-2 font-semibold text-white">{hasSupabaseConfig() ? "Optional" : "Not configured"}</p>
            </div>
            <div className="rounded-lg border border-cyan/20 bg-cyan/10 p-4">
              <p className="text-sm text-slate-300">Deployment status</p>
              <p className="mt-2 font-semibold text-white">Managed by Vercel Git integration</p>
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {adminStatuses.map((item) => (
            <MetricCard key={item.label} title={item.label} value={item.value} detail="Admin-only visibility" icon={item.icon} />
          ))}
        </div>

        <GatewayFunding />

        <Panel title="System Logs" eyebrow="Admin-only operational signals">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Execution logs", "Available in Agent Payments"],
              ["Pending platform approvals", "Review user-approved payment requests"],
              ["Integration readiness", "WalletConnect ready, Circle/x402 coming soon"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <Terminal className="h-5 w-5 text-cyan" />
                <p className="mt-3 text-sm text-slate-400">{label}</p>
                <p className="mt-1 font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Admin Controls" eyebrow="Approval-first safeguards">
          <div className="grid gap-3 md:grid-cols-3">
            {["Manual approval required", "AI automatic spending disabled", "Prepare-only agent payments"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <ShieldCheck className="h-5 w-5 text-mint" />
                <p className="text-sm font-semibold text-white">{item}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Credentials" eyebrow="Security boundary">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <KeyRound className="h-5 w-5 text-cyan" />
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Private keys, API keys, and service credentials are never displayed in the client. Configure secrets in Vercel environment variables only.
            </p>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
