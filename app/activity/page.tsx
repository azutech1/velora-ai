"use client";

import { useMemo, useState } from "react";
import { Download, ShieldCheck } from "lucide-react";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { MetricCard, Panel } from "@/components/azu/ui";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { ActivityFeature, ActivityStatus } from "@/lib/activity/types";

const featureOptions: Array<"all" | ActivityFeature> = ["all", "wallet", "network", "faucet", "social", "swap", "bridge", "send", "automation", "agent_payments", "settings", "token", "dashboard"];
const statusOptions: Array<"all" | ActivityStatus> = ["all", "pending", "success", "failed", "info"];

export default function ActivityPage() {
  const { address, isConnected } = useAccount();
  const { isAdmin } = useAdminMode();
  const { activities, exportCsv } = useActivityRecorder();
  const [feature, setFeature] = useState<(typeof featureOptions)[number]>("all");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("all");
  const [token, setToken] = useState("all");
  const [query, setQuery] = useState("");

  const visibleActivities = useMemo(() => {
    if (!isConnected || !address) return [];
    if (isAdmin) return activities;
    const connectedWallet = address.toLowerCase();
    return activities.filter((activity) => activity.walletAddress.toLowerCase() === connectedWallet);
  }, [activities, address, isAdmin, isConnected]);
  const tokens = useMemo(() => ["all", ...Array.from(new Set(visibleActivities.map((activity) => activity.token).filter(Boolean)))], [visibleActivities]);
  const filteredActivities = useMemo(
    () =>
      visibleActivities.filter((activity) => {
        const haystack = `${activity.walletAddress} ${activity.txHash ?? ""} ${activity.actionType} ${activity.title} ${activity.description}`.toLowerCase();
        return (
          (feature === "all" || activity.feature === feature) &&
          (status === "all" || activity.status === status) &&
          (token === "all" || activity.token === token) &&
          haystack.includes(query.toLowerCase())
        );
      }),
    [feature, query, status, token, visibleActivities]
  );

  function downloadCsv() {
    if (!isConnected || !filteredActivities.length) return;
    const blob = new Blob([exportCsv(filteredActivities)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "velora-ai-activity.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell title="Activity" eyebrow="Unified Velora AI action recorder">
      <div className="space-y-6">
        {!isConnected ? (
          <Panel title="Activity" eyebrow="Wallet access required">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-slate-400">Connect wallet to access this section.</div>
          </Panel>
        ) : null}

        {isConnected ? (
          <>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Total records" value={String(visibleActivities.length)} detail={isAdmin ? "Platform-visible records" : "Your wallet records"} icon={ShieldCheck} />
          <MetricCard title="Successful actions" value={String(visibleActivities.filter((activity) => activity.status === "success").length)} detail={isAdmin ? "Platform-visible actions" : "Your successful actions"} icon={ShieldCheck} />
          <MetricCard title="Failed actions" value={String(visibleActivities.filter((activity) => activity.status === "failed").length)} detail="Review required" icon={ShieldCheck} />
        </div>

        <Panel
          title="Activity controls"
          eyebrow="Wallet transaction recorder"
          action={
            <div className="flex flex-wrap gap-2">
              <button onClick={downloadCsv} disabled={!filteredActivities.length} className="inline-flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-bold text-cyan transition hover:border-mint/40 hover:text-mint disabled:cursor-not-allowed disabled:opacity-50">
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          }
        >
          <div className="grid gap-3 lg:grid-cols-4">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search wallet, tx hash, action..." className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-mint/60 lg:col-span-2" />
            <select value={feature} onChange={(event) => setFeature(event.target.value as typeof feature)} className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan/60">
              {featureOptions.map((option) => (
                <option key={option} value={option}>{option === "all" ? "All features" : option}</option>
              ))}
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan/60">
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option === "all" ? "All statuses" : option}</option>
              ))}
            </select>
            <select value={token} onChange={(event) => setToken(event.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan/60">
              {tokens.map((option) => (
                <option key={option} value={option}>{option === "all" ? "All tokens" : option}</option>
              ))}
            </select>
          </div>
        </Panel>

        <Panel title={isAdmin ? "Platform Activity Timeline" : "My Activity Timeline"} eyebrow={`${filteredActivities.length} matching records`}>
          <ActivityTimeline records={filteredActivities} emptyText="No activity yet." />
        </Panel>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
