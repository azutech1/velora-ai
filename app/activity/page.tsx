"use client";

import { useMemo, useState } from "react";
import { Download, ShieldCheck, Trash2 } from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { MetricCard, Panel } from "@/components/azu/ui";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { ActivityFeature, ActivityStatus } from "@/lib/activity/types";

const featureOptions: Array<"all" | ActivityFeature> = ["all", "wallet", "network", "faucet", "social", "swap", "bridge", "send", "automation", "settings", "token", "dashboard"];
const statusOptions: Array<"all" | ActivityStatus> = ["all", "pending", "success", "failed", "info"];

export default function ActivityPage() {
  const { activities, clearDemoActivity, exportCsv } = useActivityRecorder();
  const [feature, setFeature] = useState<(typeof featureOptions)[number]>("all");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("all");
  const [token, setToken] = useState("all");
  const [query, setQuery] = useState("");

  const tokens = useMemo(() => ["all", ...Array.from(new Set(activities.map((activity) => activity.token).filter(Boolean)))], [activities]);
  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) => {
        const haystack = `${activity.walletAddress} ${activity.txHash ?? ""} ${activity.actionType} ${activity.title} ${activity.description}`.toLowerCase();
        return (
          (feature === "all" || activity.feature === feature) &&
          (status === "all" || activity.status === status) &&
          (token === "all" || activity.token === token) &&
          haystack.includes(query.toLowerCase())
        );
      }),
    [activities, feature, query, status, token]
  );

  function downloadCsv() {
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
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Total records" value={String(activities.length)} detail="Stored locally" icon={ShieldCheck} />
          <MetricCard title="Successful actions" value={String(activities.filter((activity) => activity.status === "success").length)} detail="Across wallets" icon={ShieldCheck} />
          <MetricCard title="Failed actions" value={String(activities.filter((activity) => activity.status === "failed").length)} detail="Review required" icon={ShieldCheck} />
        </div>

        <Panel
          title="Activity controls"
          eyebrow="Demo mode local recorder"
          action={
            <div className="flex flex-wrap gap-2">
              <button onClick={downloadCsv} className="inline-flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-bold text-cyan transition hover:border-mint/40 hover:text-mint">
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <button onClick={() => clearDemoActivity()} className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/20">
                <Trash2 className="h-4 w-4" /> Clear demo activity
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
          <p className="mt-4 rounded-lg border border-cyan/20 bg-cyan/10 p-4 text-sm leading-6 text-cyan">
            Activity records are stored locally in demo mode. Production will require backend indexing and user consent.
          </p>
        </Panel>

        <Panel title="Activity timeline" eyebrow={`${filteredActivities.length} matching records`}>
          <ActivityTimeline records={filteredActivities} />
        </Panel>
      </div>
    </AppShell>
  );
}
