"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  Check,
  Clock,
  Eye,
  LockKeyhole,
  PauseCircle,
  PlayCircle,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  Workflow,
  X
} from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { MetricCard, Panel } from "@/components/azu/ui";
import { useAutomationRules } from "@/hooks/useAutomationRules";
import { automationSafetyDefaults, ruleBuilderActions, ruleBuilderConditions } from "@/lib/ai/automationRules";

const riskStyles = {
  low: "border-mint/20 bg-mint/10 text-mint",
  medium: "border-yellow-400/20 bg-yellow-400/10 text-yellow-200",
  high: "border-red-400/20 bg-red-400/10 text-red-200"
};

const statusStyles = {
  active: "border-mint/20 bg-mint/10 text-mint",
  paused: "border-slate-500/20 bg-slate-500/10 text-slate-300",
  "pending approval": "border-cyan/20 bg-cyan/10 text-cyan"
};

export default function AutomationPage() {
  const {
    rules,
    approvals,
    logs,
    overview,
    selectedRule,
    setSelectedRuleId,
    toggleRule,
    createRule,
    triggerRule,
    resolveApproval
  } = useAutomationRules();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [conditionId, setConditionId] = useState(ruleBuilderConditions[0].id);
  const [actionId, setActionId] = useState(ruleBuilderActions[0].id);

  const conditionLabel = useMemo(() => ruleBuilderConditions.find((condition) => condition.id === conditionId)?.label ?? ruleBuilderConditions[0].label, [conditionId]);
  const actionLabel = useMemo(() => ruleBuilderActions.find((action) => action.id === actionId)?.label ?? ruleBuilderActions[0].label, [actionId]);

  function handleCreateRule() {
    createRule(conditionLabel, actionLabel);
    setBuilderOpen(false);
  }

  return (
    <AppShell title="AI Automation">
      <div className="space-y-6">
        <Panel
          title="Automation control center"
          eyebrow="Approval-first financial rules"
          action={
            <button onClick={() => setBuilderOpen((value) => !value)} className="flex items-center gap-2 rounded-lg bg-mint px-4 py-2 text-sm font-bold text-[#031018] shadow-neon">
              <Plus className="h-4 w-4" /> Create rule
            </button>
          }
        >
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Velora AI automations prepare recommendations, quotes, and approval requests. They do not execute user funds automatically.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard title="Active automations" value={String(overview.active)} detail="Manual approval enforced" icon={PlayCircle} />
            <MetricCard title="Paused automations" value={String(overview.paused)} detail="User-controlled" icon={PauseCircle} />
            <MetricCard title="Pending approvals" value={String(overview.pendingApprovals)} detail="Awaiting review" icon={Clock} />
            <MetricCard title="Estimated savings" value="--" detail={overview.estimatedSavings} icon={ShieldCheck} />
            <MetricCard title="Last automation run" value="Safe mode" detail={overview.lastRun} icon={Bot} />
          </div>
        </Panel>

        {builderOpen ? (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <Panel title="Rule builder" eyebrow="IF / THEN policy draft">
              <div className="grid gap-4 lg:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">IF condition</span>
                  <select value={conditionId} onChange={(event) => setConditionId(event.target.value as typeof conditionId)} className="w-full rounded-lg border border-white/10 bg-[#080d18] px-4 py-3 text-sm text-white outline-none focus:border-mint/60">
                    {ruleBuilderConditions.map((condition) => (
                      <option key={condition.id} value={condition.id}>{condition.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">THEN action</span>
                  <select value={actionId} onChange={(event) => setActionId(event.target.value as typeof actionId)} className="w-full rounded-lg border border-white/10 bg-[#080d18] px-4 py-3 text-sm text-white outline-none focus:border-cyan/60">
                    {ruleBuilderActions.map((action) => (
                      <option key={action.id} value={action.id}>{action.label}</option>
                    ))}
                  </select>
                </label>
                <div className="rounded-lg border border-mint/20 bg-mint/10 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-mint"><LockKeyhole className="h-4 w-4" /> Safety settings</p>
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    Max {automationSafetyDefaults.maxTransactionAmount}, daily limit {automationSafetyDefaults.dailySpendLimit}, approval required.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">Allowed tokens: {automationSafetyDefaults.allowedTokens.join(", ")}</div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">Primary chain: Arc Testnet</div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">Execution: user review only</div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={handleCreateRule} className="rounded-lg bg-mint px-5 py-3 text-sm font-bold text-[#031018] shadow-neon">Create approval-first rule</button>
                <button onClick={() => setBuilderOpen(false)} className="rounded-lg border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 hover:border-cyan/40 hover:text-cyan">Cancel</button>
              </div>
            </Panel>
          </motion.div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Automation rules" eyebrow="AI policy engine">
            <div className="grid gap-4">
              {rules.map((rule) => (
                <motion.div key={rule.id} whileHover={{ y: -3 }} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white">{rule.name}</h3>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${statusStyles[rule.status]}`}>{rule.status}</span>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${riskStyles[rule.riskLevel]}`}>{rule.riskLevel} risk</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">IF {rule.trigger}</p>
                      <p className="mt-1 text-sm text-slate-400">THEN {rule.action}</p>
                    </div>
                    <button onClick={() => toggleRule(rule.id)} className="rounded-full border border-mint/30 bg-mint/10 p-2 text-mint" aria-label={`Toggle ${rule.name}`}>
                      {rule.enabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
                    <span>Last run: <strong className="text-slate-200">{rule.lastRun}</strong></span>
                    <span>Next check: <strong className="text-slate-200">{rule.nextCheck}</strong></span>
                    <span>Approvals: <strong className="text-cyan">{rule.approvalsPending}</strong></span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={() => setSelectedRuleId(rule.id)} className="inline-flex items-center gap-2 rounded-lg border border-cyan/20 px-3 py-2 text-xs font-semibold text-cyan hover:bg-cyan/10">
                      <Eye className="h-4 w-4" /> View details
                    </button>
                    <button onClick={() => triggerRule(rule.id)} className="inline-flex items-center gap-2 rounded-lg border border-mint/20 px-3 py-2 text-xs font-semibold text-mint hover:bg-mint/10">
                      <Workflow className="h-4 w-4" /> Simulate trigger
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel title="Selected rule details" eyebrow="Policy guardrails">
              {selectedRule ? (
                <div className="space-y-4 text-sm">
                  <p className="font-semibold text-white">{selectedRule.name}</p>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-slate-300">
                    Max amount: {selectedRule.maxTransactionAmount}<br />
                    Daily limit: {selectedRule.dailySpendLimit}<br />
                    Allowed tokens: {selectedRule.allowedTokens.join(", ")}<br />
                    Allowed chains: {selectedRule.allowedChains.join(", ")}
                  </div>
                  <p className="flex items-center gap-2 text-mint"><ShieldCheck className="h-4 w-4" /> Manual approval required before any prepared action.</p>
                </div>
              ) : null}
            </Panel>

            <Panel title="Approval queue" eyebrow="User-controlled execution">
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <div key={approval.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{approval.title}</p>
                        <p className="mt-2 text-sm leading-5 text-slate-400">{approval.description}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${riskStyles[approval.riskLevel]}`}>{approval.riskLevel}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => resolveApproval(approval.id, "approved")} className="inline-flex items-center gap-2 rounded-lg border border-mint/30 px-3 py-2 text-xs font-semibold text-mint hover:bg-mint/10"><Check className="h-4 w-4" /> Approve</button>
                      <button onClick={() => resolveApproval(approval.id, "rejected")} className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-400/10"><X className="h-4 w-4" /> Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <Panel title="Automation activity" eyebrow="Timeline">
          <div className="grid gap-4 md:grid-cols-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2">
                  {log.status === "failed" ? <AlertTriangle className="h-4 w-4 text-red-300" /> : <SlidersHorizontal className="h-4 w-4 text-cyan" />}
                  <p className="font-semibold text-white">{log.event}</p>
                </div>
                <p className="mt-2 text-sm leading-5 text-slate-400">{log.detail}</p>
                <p className="mt-3 text-xs text-slate-500">{log.timestamp}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
