"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  Check,
  Clock,
  Eye,
  LockKeyhole,
  Loader2,
  PauseCircle,
  PlayCircle,
  Plus,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Trophy,
  Wallet,
  Workflow,
  X,
  Zap
} from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { AssistantLogo } from "@/components/assistant/AssistantLogo";
import { MetricCard, Panel } from "@/components/azu/ui";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useAutomationRules } from "@/hooks/useAutomationRules";
import { automationSafetyDefaults, ruleBuilderActions, ruleBuilderConditions } from "@/lib/ai/automationRules";

const publicFeatureCards = [
  {
    title: "Wallet Alerts",
    detail: "Monitor connected wallet activity, balances, and account-level changes.",
    icon: Wallet
  },
  {
    title: "Price Alerts",
    detail: "Track stablecoin movement and receive alerts when pricing conditions matter.",
    icon: TrendingUp
  },
  {
    title: "Bridge Route Alerts",
    detail: "Know when preferred bridge routes become available or unavailable.",
    icon: Route
  },
  {
    title: "Swap Alerts",
    detail: "Prepare notifications for swap routes, quotes, and execution readiness.",
    icon: Zap
  },
  {
    title: "XP & Rewards Alerts",
    detail: "Stay aware of reward progress, streaks, and future progression milestones.",
    icon: Trophy
  }
];

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

function ComingSoonBadge() {
  return (
    <span className="inline-flex rounded-full border border-orange-400/35 bg-orange-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-orange-300 light:border-orange-500/35 light:bg-orange-50 light:text-orange-700">
      Coming Soon
    </span>
  );
}

function AutomationComingSoon() {
  return (
    <AppShell title="AI Automation" eyebrow="Public beta preparation">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.26)] light:border-black light:bg-white light:shadow-[0_24px_70px_rgba(15,23,42,0.12)] md:p-8">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl light:bg-orange-200/80" />
          <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl light:bg-emerald-100" />

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <ComingSoonBadge />
              <h2 className="mt-5 text-3xl font-black text-white light:text-slate-950 md:text-4xl">AI Automation Coming Soon</h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 light:text-slate-700 md:text-base">
                Velora AI Automation is currently under development. Soon, users will be able to create smart alerts and automated workflows for wallets, swaps, bridges, rewards, and Arc activity.
              </p>
              <div className="mt-6 rounded-xl border border-orange-400/25 bg-orange-500/10 p-4 text-sm font-semibold leading-6 text-orange-100 light:border-orange-500/40 light:bg-orange-50 light:text-orange-800">
                This feature is being tested internally and will be available publicly soon.
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 light:border-emerald-600/25 light:bg-emerald-50">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-[0_14px_35px_rgba(249,115,22,0.28)]">
                <AssistantLogo size={48} />
              </div>
              <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-emerald-300 light:text-emerald-700">Internal testing</p>
              <p className="mt-3 text-2xl font-black text-white light:text-slate-950">Approval-first workflows</p>
              <p className="mt-3 text-sm leading-6 text-slate-300 light:text-slate-700">
                Automation will prepare insights and alerts first. Any future transaction flow will still require explicit wallet approval.
              </p>
            </div>
          </div>
        </section>

        <Panel title="Planned automation alerts" eyebrow="What public users will see next">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {publicFeatureCards.map((feature) => (
              <motion.div
                key={feature.title}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 light:border-black light:bg-white light:shadow-[0_14px_35px_rgba(15,23,42,0.08)]"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-orange-400/25 bg-orange-500/15 light:border-orange-500/35 light:bg-orange-50">
                  <feature.icon className="h-5 w-5 text-orange-300 light:text-orange-700" />
                </div>
                <h3 className="mt-4 text-base font-black text-white light:text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400 light:text-slate-700">{feature.detail}</p>
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function AdminAutomationDashboard() {
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
  const [simulatingRuleId, setSimulatingRuleId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const conditionLabel = useMemo(() => ruleBuilderConditions.find((condition) => condition.id === conditionId)?.label ?? ruleBuilderConditions[0].label, [conditionId]);
  const actionLabel = useMemo(() => ruleBuilderActions.find((action) => action.id === actionId)?.label ?? ruleBuilderActions[0].label, [actionId]);

  function handleCreateRule() {
    createRule(conditionLabel, actionLabel);
    setBuilderOpen(false);
  }

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleSimulateRule(ruleId: string) {
    setSimulatingRuleId(ruleId);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      triggerRule(ruleId);
      setToast({ type: "success", text: "Simulation completed." });
    } catch {
      setToast({ type: "error", text: "Simulation failed. Please try again." });
    } finally {
      setSimulatingRuleId(null);
    }
  }

  return (
    <AppShell title="AI Automation" eyebrow="Admin testing">
      <div className="relative space-y-6">
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed right-6 top-6 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-white/10 bg-[#101827] px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] light:border-black light:bg-white"
          >
            {toast.type === "success" ? <Check className="h-5 w-5 text-mint" /> : <AlertTriangle className="h-5 w-5 text-red-300" />}
            <p className="text-sm font-semibold text-white light:text-slate-950">{toast.text}</p>
          </motion.div>
        ) : null}
        <Panel
          title="Automation control center"
          eyebrow="Approval-first financial rules"
          action={
            <button onClick={() => setBuilderOpen((value) => !value)} className="flex items-center gap-2 rounded-lg bg-cyan px-4 py-2 text-sm font-bold text-white shadow-neon">
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
                  <select value={conditionId} onChange={(event) => setConditionId(event.target.value as typeof conditionId)} className="w-full rounded-lg border border-white/10 bg-[#080d18] px-4 py-3 text-sm text-white outline-none focus:border-cyan/60">
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
                <button onClick={handleCreateRule} className="rounded-lg bg-cyan px-5 py-3 text-sm font-bold text-white shadow-neon">Create approval-first rule</button>
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
                    <button
                      onClick={() => handleSimulateRule(rule.id)}
                      disabled={simulatingRuleId === rule.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-mint/20 px-3 py-2 text-xs font-semibold text-mint hover:bg-mint/10 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {simulatingRuleId === rule.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Workflow className="h-4 w-4" />}
                      {simulatingRuleId === rule.id ? "Simulating..." : "Simulate trigger"}
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
                {log.resultStatus ? (
                  <span className="mt-3 inline-flex rounded-full border border-orange-400/25 bg-orange-500/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-orange-200">
                    {log.resultStatus}
                  </span>
                ) : null}
                <p className="mt-3 text-xs text-slate-500">{log.timestamp}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

export default function AutomationPage() {
  const { isAdmin } = useAdminMode();

  if (!isAdmin) {
    return <AutomationComingSoon />;
  }

  return <AdminAutomationDashboard />;
}
