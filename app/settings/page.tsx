"use client";

import { Copy, Link2, LogOut, ShieldCheck, Wallet } from "lucide-react";
import { useAccount, useChainId, useDisconnect } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";
import { cx } from "@/components/azu/utils";
import { useAdminMode } from "@/hooks/useAdminMode";
import { getChainById } from "@/lib/config/chains";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { shortAddress } from "@/lib/utils/format";

type StatusTone = "ready" | "enabled" | "disabled" | "soon" | "neutral" | "warning";

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  const styles = {
    ready: "border-mint/30 bg-mint/10 text-mint",
    enabled: "border-cyan/30 bg-cyan/10 text-cyan",
    disabled: "border-red-400/30 bg-red-500/10 text-red-200",
    soon: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    neutral: "border-white/10 bg-white/[0.06] text-slate-300",
    warning: "border-cyan/30 bg-cyan/10 text-cyan"
  } satisfies Record<StatusTone, string>;

  return <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold", styles[tone])}>{label}</span>;
}

function SettingRow({ label, value, status, tone = "neutral" }: { label: string; value: string; status?: string; tone?: StatusTone }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-2 font-semibold text-white">{value}</p>
      </div>
      {status ? <StatusPill label={status} tone={tone} /> : null}
    </div>
  );
}

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const { isAdmin } = useAdminMode();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const chain = getChainById(chainId);
  const walletNetwork = chain?.name ?? (chainId ? `Chain ${chainId}` : "Not connected");
  const lifiEnabled = process.env.NEXT_PUBLIC_LIFI_ENABLED !== "false";
  const supabaseStatus = hasSupabaseConfig() ? "Optional" : "Not configured";

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
  }

  return (
    <AppShell title="Settings" eyebrow="Workspace, wallet, security, and integrations">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {!isConnected ? (
          <Panel title="Settings" eyebrow="Wallet access required">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
              <Wallet className="mx-auto h-8 w-8 text-cyan" />
              <p className="mt-4 text-sm font-semibold text-white">Connect wallet to access this section.</p>
            </div>
          </Panel>
        ) : null}

        {isConnected ? (
          <>
        <div className="space-y-6">
          <Panel title="Workspace Profile" eyebrow="Arc Testnet dApp configuration">
            <div className="space-y-4">
              <SettingRow label="Project" value="Velora AI" />
              <SettingRow label="Network" value="Arc Testnet" status="Ready" tone="ready" />
              <SettingRow label="Settlement asset" value="USDC" status="Ready" tone="ready" />
              <SettingRow label="Status" value="Public Beta" status="Active" tone="enabled" />
            </div>
          </Panel>

          <Panel title="Wallet Settings" eyebrow="Connected wallet controls">
              <div className="space-y-4">
                <SettingRow label="Connected wallet" value={shortAddress(address)} status="Connected" tone="ready" />
                <SettingRow label="Network" value={walletNetwork} status={chain ? "Ready" : "Requires setup"} tone={chain ? "ready" : "warning"} />
                <div className="flex flex-wrap gap-3">
                  <button onClick={copyAddress} disabled={!address} className="inline-flex items-center gap-2 rounded-lg border border-cyan/30 px-4 py-3 text-sm font-bold text-cyan hover:bg-cyan/10 disabled:cursor-not-allowed disabled:opacity-50">
                    <Copy className="h-4 w-4" /> Copy wallet address
                  </button>
                  <button onClick={() => disconnect()} disabled={!isConnected} className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-4 py-3 text-sm font-bold text-red-200 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50">
                    <LogOut className="h-4 w-4" /> Disconnect wallet
                  </button>
                </div>
              </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={isAdmin ? "Security & Approval Settings" : "Approval Preferences"} eyebrow="User-controlled execution policy">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Manual approval required", value: "Enabled", tone: "ready" as StatusTone, icon: ShieldCheck },
                { label: "AI automatic spending", value: "Disabled", tone: "disabled" as StatusTone, icon: ShieldCheck },
                { label: "Transaction limits", value: "Not configured", tone: "neutral" as StatusTone, icon: ShieldCheck },
                { label: "Agent payments", value: "Prepare-only mode", tone: "warning" as StatusTone, icon: ShieldCheck }
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <item.icon className="h-5 w-5 text-mint" />
                  <p className="mt-4 text-sm text-slate-400">{item.label}</p>
                  <div className="mt-3">
                    <StatusPill label={item.value} tone={item.tone} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {isAdmin ? (
            <Panel title="Integration Status" eyebrow="Production readiness signals">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { name: "WalletConnect", status: "Ready", tone: "ready" as StatusTone, detail: "Wallet connection is available." },
                { name: "LI.FI Quotes", status: lifiEnabled ? "Enabled" : "Not configured", tone: (lifiEnabled ? "enabled" : "neutral") as StatusTone, detail: "Quote routing for Bridge & Swap." },
                { name: "Circle Nanopayments", status: "Coming Soon", tone: "soon" as StatusTone, detail: "Reserved for Circle Arc payment rails." },
                { name: "x402 Payments", status: "Coming Soon", tone: "soon" as StatusTone, detail: "Reserved for future agent payment settlement." },
                { name: "Supabase Sync", status: supabaseStatus, tone: (hasSupabaseConfig() ? "enabled" : "neutral") as StatusTone, detail: hasSupabaseConfig() ? "Persistence is configured." : "Local mode remains available." }
              ].map((item) => (
                <div key={item.name} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link2 className="mt-0.5 h-5 w-5 text-cyan" />
                    <StatusPill label={item.status} tone={item.tone} />
                  </div>
                  <p className="mt-4 font-semibold text-white">{item.name}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
                </div>
              ))}
            </div>
            </Panel>
          ) : (
            <Panel title="Notification Settings" eyebrow="User preferences">
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingRow label="Payment approvals" value="Requires setup" status="Requires setup" tone="warning" />
                <SettingRow label="Activity notifications" value="Not configured" status="Not configured" tone="neutral" />
                <SettingRow label="Agent payment alerts" value="Not configured" status="Not configured" tone="neutral" />
                <SettingRow label="Security notices" value="Ready" status="Ready" tone="ready" />
              </div>
            </Panel>
          )}
        </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
