"use client";

import { KeyRound, LockKeyhole, ShieldCheck, Wallet } from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";

export default function SettingsPage() {
  const { recordActivity } = useActivityRecorder();

  function saveSettings() {
    recordActivity({
      actionType: "settings_updated",
      title: "Settings updated",
      description: "Demo workspace settings were saved locally.",
      feature: "settings",
      network: "Arc",
      status: "success"
    });
  }

  return (
    <AppShell title="Settings">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel title="Workspace profile" eyebrow="Velora AI public testnet dApp">
          <div className="space-y-4">
            {[
              ["Organization", "Velora AI Labs"],
              ["Positioning", "AI-native stablecoin operating system on Arc"],
              ["Default network", "Arc Network"],
              ["Settlement asset", "USDC"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
          <button onClick={saveSettings} className="mt-5 rounded-lg bg-gradient-to-r from-mint to-cyan px-4 py-3 text-sm font-bold text-[#031018] shadow-neon transition hover:scale-[1.01]">
            Save demo settings
          </button>
        </Panel>
        <Panel title="Integration readiness" eyebrow="Wallet and Arc hooks later">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "WalletConnect", text: "Placeholder for wagmi connector setup.", icon: Wallet },
              { title: "Agent API keys", text: "Scoped payment credentials and webhook access.", icon: KeyRound },
              { title: "Transaction approvals", text: "Confirmation modal and policy queue ready.", icon: ShieldCheck },
              { title: "Security policies", text: "Limits, network checks, and activity logs.", icon: LockKeyhole }
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <item.icon className="h-5 w-5 text-mint" />
                <p className="mt-4 font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
