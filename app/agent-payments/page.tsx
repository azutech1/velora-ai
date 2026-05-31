"use client";

import { motion } from "framer-motion";
import { Bot, CheckCircle2, CircleDollarSign, LockKeyhole, Network, PlugZap, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";
import { useAccount } from "wagmi";
import { AgentPaymentApprovals } from "@/components/agent-payments/AgentPaymentApprovals";
import { GatewayFunding } from "@/components/agent-payments/GatewayFunding";
import { AppShell } from "@/components/azu/app-shell";
import { MetricCard, Panel } from "@/components/azu/ui";
import { useAdminMode } from "@/hooks/useAdminMode";
import { agentPaymentPolicy, agentPaymentRails, agentPaymentServices } from "@/lib/agent-payments/config";
import { shortAddress } from "@/lib/utils/format";

const statusStyles = {
  available: "border-mint/20 bg-mint/10 text-mint",
  "needs setup": "border-cyan/20 bg-cyan/10 text-cyan",
  disabled: "border-slate-500/20 bg-slate-500/10 text-slate-300"
};

export default function AgentPaymentsPage() {
  const { address, isConnected } = useAccount();
  const { isAdmin } = useAdminMode();
  const connectedServices = agentPaymentServices.filter((service) => service.status === "available").length;

  return (
    <AppShell title="Agent Payments" eyebrow="Approval-first nanopayment architecture">
      <div className="space-y-6">
        {!isConnected ? (
          <Panel title="Agent Payments" eyebrow="Wallet access required">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-slate-400">Connect wallet to access this section.</div>
          </Panel>
        ) : null}

        {isConnected ? (
          <>
          <Panel title="Agent payment control center" eyebrow="Prepare-only MVP">
            <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Agent Payments lets agents prepare USDC payment requests for your approval. Agents can draft payment requests, but they cannot spend funds automatically.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard title="Agent Wallet Balance" value={agentPaymentPolicy.agentWalletBalance} detail={address ? shortAddress(address) : "Connect wallet"} icon={WalletCards} />
            <MetricCard title="Daily Spend Limit" value={agentPaymentPolicy.dailySpendLimit} detail="User-defined approval policy" icon={ShieldCheck} />
            <MetricCard title="Monthly Spend Limit" value={agentPaymentPolicy.monthlySpendLimit} detail="User-defined approval policy" icon={CircleDollarSign} />
            <MetricCard title="Available Budget" value={agentPaymentPolicy.availableBudget} detail="Calculated after wallet setup" icon={ReceiptText} />
            <MetricCard title="Active Connected Services" value={isAdmin ? String(connectedServices) : "--"} detail={isAdmin ? "Platform service registry" : "User services not configured"} icon={PlugZap} />
          </div>
        </Panel>

        {isAdmin ? (
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel title="Connected services" eyebrow="Payment-capable service registry">
            <div className="grid gap-4 md:grid-cols-2">
              {agentPaymentServices.map((service) => (
                <motion.section key={service.id} whileHover={{ y: -3 }} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{service.name}</p>
                      <p className="mt-2 text-sm leading-5 text-slate-400">{service.description}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${statusStyles[service.status]}`}>
                      {service.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {service.supportedRails.map((rail) => (
                      <span key={rail} className="rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-xs text-cyan">{rail}</span>
                    ))}
                  </div>
                </motion.section>
              ))}
            </div>
          </Panel>

          <Panel title="Approval guardrails" eyebrow="No automatic spending">
            <div className="space-y-3">
              {[
                "Agents cannot spend funds automatically.",
                "Every payment must require user approval.",
                "MVP runs in prepare-only mode.",
                "Payment execution waits for wallet confirmation and policy checks."
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Panel>
          </div>
        ) : (
          <Panel title="User payment workspace" eyebrow="Wallet-specific approvals">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-400">User agent wallet</p>
                <p className="mt-2 break-all font-semibold text-white">{address ? shortAddress(address) : "--"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-400">Gateway setup</p>
                <p className="mt-2 font-semibold text-white">Gateway setup is not available for this wallet yet.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-400">Approval policy</p>
                <p className="mt-2 font-semibold text-white">Manual approval required</p>
              </div>
            </div>
          </Panel>
        )}

        {isAdmin ? (
          <Panel title="Nanopayment integration slots" eyebrow="Future Circle Arc payment rails">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {agentPaymentRails.map((rail) => (
              <div key={rail} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2">
                  {rail === "Circle Gateway" ? <Network className="h-4 w-4 text-cyan" /> : rail === "Agent-to-Agent Payments" ? <Bot className="h-4 w-4 text-mint" /> : <CheckCircle2 className="h-4 w-4 text-cyan" />}
                  <p className="font-semibold text-white">{rail}</p>
                </div>
                <p className="mt-3 text-sm leading-5 text-slate-400">Execution-ready integration slot. Payments only run after user approval, Gateway balance verification, and server-side signing.</p>
              </div>
            ))}
          </div>
          </Panel>
        ) : null}

        {isAdmin ? <GatewayFunding /> : null}
        <AgentPaymentApprovals />
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
