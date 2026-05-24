"use client";

import { useState } from "react";
import { Bot, CheckCircle2, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { activityLogs, rules } from "@/components/azu/data";
import { MetricCard, Panel } from "@/components/azu/ui";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";

export default function AutomationPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(Object.fromEntries(rules.map((rule) => [rule.name, rule.enabled])));
  const { recordActivity } = useActivityRecorder();

  function createRule() {
    recordActivity({
      actionType: "ai_automation_created",
      title: "AI automation created",
      description: "A demo AI payment automation rule was created.",
      feature: "automation",
      network: "Arc",
      status: "success"
    });
  }

  function toggleRule(ruleName: string) {
    setEnabled((value) => {
      const nextEnabled = !value[ruleName];
      recordActivity({
        actionType: "ai_automation_toggled",
        title: nextEnabled ? "AI automation enabled" : "AI automation disabled",
        description: `${ruleName} was ${nextEnabled ? "enabled" : "disabled"}.`,
        feature: "automation",
        network: "Arc",
        status: "success"
      });
      return { ...value, [ruleName]: nextEnabled };
    });
  }

  return (
    <AppShell title="AI Automation">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Saved fees" value="$6,800" detail="From policy routing" icon={CheckCircle2} />
          <MetricCard title="Completed tasks" value="184" detail="This week" icon={Bot} />
          <MetricCard title="Spend limit" value="$118k" detail="Across active rules" icon={ToggleRight} />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <Panel title="Payment rules" eyebrow="Automation controls" action={<button onClick={createRule} className="flex items-center gap-2 rounded-lg bg-mint px-4 py-2 text-sm font-bold text-[#031018] shadow-neon"><Plus className="h-4 w-4" /> Create rule</button>}>
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.name} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div>
                    <p className="font-semibold text-white">{rule.name}</p>
                    <p className="mt-1 text-xs text-slate-400">Limit: {rule.limit} | Saved fees: {rule.saved}</p>
                  </div>
                  <button onClick={() => toggleRule(rule.name)} className="rounded-full border border-mint/30 bg-mint/10 p-2 text-mint" aria-label={`Toggle ${rule.name}`}>
                    {enabled[rule.name] ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Activity logs" eyebrow="Automation history">
            <div className="space-y-4">
              {activityLogs.map((log, index) => (
                <div key={log} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-semibold text-white">#{index + 1} {log}</p>
                  <p className="mt-2 text-xs text-slate-400">Recorded by Velora AI policy engine</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
