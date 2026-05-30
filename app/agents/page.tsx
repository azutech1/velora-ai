"use client";

import { motion } from "framer-motion";
import {
  Bot,
  BrainCircuit,
  Check,
  Database,
  Eye,
  Gauge,
  LockKeyhole,
  PauseCircle,
  ShieldCheck,
  Sparkles,
  Workflow,
  X
} from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { MetricCard, Panel } from "@/components/azu/ui";
import { PaymentAgentWorkspace } from "@/components/agents/PaymentAgentWorkspace";
import { useAIAgents } from "@/hooks/useAIAgents";

const statusStyles = {
  online: "border-mint/20 bg-mint/10 text-mint",
  paused: "border-slate-500/20 bg-slate-500/10 text-slate-300",
  "needs approval": "border-cyan/20 bg-cyan/10 text-cyan"
};

const riskStyles = {
  low: "border-mint/20 bg-mint/10 text-mint",
  medium: "border-yellow-400/20 bg-yellow-400/10 text-yellow-200",
  high: "border-red-400/20 bg-red-400/10 text-red-200"
};

export default function AgentsPage() {
  const { agents, selectedAgent, recommendations, openAgent, createRecommendation, updateRecommendation } = useAIAgents();
  const onlineAgents = agents.filter((agent) => agent.status === "online").length;
  const pendingAgentApprovals = agents.flatMap((agent) => agent.approvalQueue).filter((approval) => approval.status === "pending").length;
  const pendingRecommendations = recommendations.filter((recommendation) => recommendation.status === "approval requested").length;

  return (
    <AppShell title="AI Agents">
      <div className="space-y-6">
        <Panel title="Agent command center" eyebrow="AI-native stablecoin workers">
          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Velora AI agents analyze balances, routes, payments, risks, and activity. They can recommend and prepare actions, but every transaction still requires user review and wallet approval.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Online agents" value={String(onlineAgents)} detail="Monitoring Arc workflows" icon={Bot} />
            <MetricCard title="Pending approvals" value={String(pendingAgentApprovals)} detail="User review required" icon={LockKeyhole} />
            <MetricCard title="Recommendations" value={String(pendingRecommendations)} detail="Approval-first queue" icon={Sparkles} />
            <MetricCard title="Execution mode" value="Safe" detail="No automatic fund movement" icon={ShieldCheck} />
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Finance agents" eyebrow="Specialized stablecoin intelligence">
            <div className="grid gap-4 md:grid-cols-2">
              {agents.map((agent) => (
                <motion.section key={agent.id} whileHover={{ y: -3 }} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-cyan/20 bg-cyan/10">
                        <BrainCircuit className="h-6 w-6 text-cyan" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold text-white">{agent.name}</h2>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${statusStyles[agent.status]}`}>
                            {agent.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-5 text-slate-400">{agent.purpose}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Permissions</p>
                      <p className="mt-1 text-slate-300">{agent.permissions.join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Connected tools</p>
                      <p className="mt-1 text-slate-300">{agent.connectedTools.join(", ")}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-[#080d18]/70 p-3">
                      <p className="text-xs text-slate-500">Last insight</p>
                      <p className="mt-1 text-sm leading-5 text-slate-300">{agent.lastInsight}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Confidence score</span>
                      <span className="text-mint">{agent.confidenceScore}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-gradient-to-r from-mint to-cyan" style={{ width: `${agent.confidenceScore}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {agent.recentActions.map((action) => (
                      <span key={action} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">{action}</span>
                    ))}
                  </div>
                  <button onClick={() => openAgent(agent.id)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-mint/30 bg-mint/10 px-4 py-3 text-sm font-semibold text-mint transition hover:bg-mint hover:text-[#031018]">
                    <Eye className="h-4 w-4" /> Open agent
                  </button>
                </motion.section>
              ))}
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel
              title={selectedAgent.name}
              eyebrow="Agent detail panel"
              action={
                <button onClick={() => createRecommendation(selectedAgent.id)} className="inline-flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs font-semibold text-cyan hover:bg-cyan hover:text-[#031018]">
                  <Sparkles className="h-4 w-4" /> New recommendation
                </button>
              }
            >
              {selectedAgent.id === "payment-agent" ? (
                <PaymentAgentWorkspace />
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Instructions</p>
                    <p className="mt-2 leading-6 text-slate-300">{selectedAgent.instructions}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <p className="flex items-center gap-2 font-semibold text-white"><Workflow className="h-4 w-4 text-cyan" /> Allowed actions</p>
                      <ul className="mt-3 space-y-2 text-slate-300">
                        {selectedAgent.allowedActions.map((action) => <li key={action}>{action}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <p className="flex items-center gap-2 font-semibold text-white"><LockKeyhole className="h-4 w-4 text-mint" /> Spending limits</p>
                      <p className="mt-3 leading-6 text-slate-300">{selectedAgent.spendingLimits}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <p className="flex items-center gap-2 font-semibold text-white"><Database className="h-4 w-4 text-cyan" /> Data sources</p>
                    <p className="mt-2 text-slate-300">{selectedAgent.dataSources.join(", ")}</p>
                  </div>
                </div>
              )}
            </Panel>

            <Panel title="Agent approval queue" eyebrow="Review before preparation">
              <div className="space-y-3">
                {selectedAgent.approvalQueue.length ? (
                  selectedAgent.approvalQueue.map((approval) => (
                    <div key={approval.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{approval.title}</p>
                          <p className="mt-2 text-sm leading-5 text-slate-400">{approval.description}</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${riskStyles[approval.riskLevel]}`}>{approval.riskLevel}</span>
                      </div>
                      <p className="mt-3 text-xs text-cyan">Status: {approval.status}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400">
                    No agent approval requests are pending for this worker.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel title="AI recommendations" eyebrow="Rule-based MVP engine">
            <div className="grid gap-4">
              {recommendations.map((recommendation) => (
                <div key={recommendation.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{recommendation.title}</p>
                      <p className="mt-2 text-sm leading-5 text-slate-400">{recommendation.description}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${riskStyles[recommendation.riskLevel]}`}>{recommendation.riskLevel}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => updateRecommendation(recommendation.id, "approved")} className="inline-flex items-center gap-2 rounded-lg border border-mint/30 px-3 py-2 text-xs font-semibold text-mint hover:bg-mint/10">
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button onClick={() => updateRecommendation(recommendation.id, "rejected")} className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-400/10">
                      <X className="h-4 w-4" /> Reject
                    </button>
                    <button onClick={() => createRecommendation(recommendation.agentId)} className="inline-flex items-center gap-2 rounded-lg border border-cyan/30 px-3 py-2 text-xs font-semibold text-cyan hover:bg-cyan/10">
                      <Gauge className="h-4 w-4" /> Edit
                    </button>
                    <button
                      onClick={() => updateRecommendation(recommendation.id, "prepared")}
                      disabled={recommendation.status !== "approved"}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:border-mint/30 enabled:hover:text-mint"
                    >
                      <Workflow className="h-4 w-4" /> Prepare action
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Status: {recommendation.status}. Token: {recommendation.token ?? "N/A"}. Network: {recommendation.network ?? "Arc Testnet"}.</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Agent activity history" eyebrow="Safe local intelligence layer">
            <div className="grid gap-4 md:grid-cols-2">
              {agents.map((agent) => (
                <div key={agent.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-2">
                    {agent.status === "paused" ? <PauseCircle className="h-4 w-4 text-slate-400" /> : <Bot className="h-4 w-4 text-mint" />}
                    <p className="font-semibold text-white">{agent.name}</p>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-400">
                    {agent.activityHistory.map((item) => <p key={item}>{item}</p>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-lg border border-cyan/20 bg-cyan/10 p-4 text-sm leading-6 text-cyan">
              Future integrations: OpenAI/Claude reasoning APIs, Arc MCP tools, Supabase persistence, scheduled workers, smart contract permissions, and agent wallets.
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
