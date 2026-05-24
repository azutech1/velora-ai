"use client";

import { useEffect } from "react";
import { Award, Landmark, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";
import { TokenOverview } from "@/components/token/TokenOverview";
import { TokenomicsCard } from "@/components/token/TokenomicsCard";
import { UtilityGrid } from "@/components/token/UtilityGrid";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { AVL_TOKEN, AVL_TOKENOMICS, AVL_UTILITIES } from "@/lib/tokens/avl";

export default function TokenPage() {
  const { recordActivity } = useActivityRecorder();

  useEffect(() => {
    recordActivity({
      actionType: "token_page_viewed",
      title: "Token page viewed",
      description: "The Velora AI Token page was opened.",
      feature: "token",
      token: "AVL",
      network: "Arc",
      status: "info"
    });
  }, [recordActivity]);

  function recordSocialTask(action: "opened" | "verified" | "claimed") {
    recordActivity({
      actionType: action === "opened" ? "social_task_opened" : action === "verified" ? "social_task_verified" : "social_reward_claimed",
      title: action === "opened" ? "Social task opened" : action === "verified" ? "Social task verified" : "Social reward claimed",
      description: `Demo social reward task ${action}.`,
      feature: "social",
      token: "AVL",
      amount: action === "claimed" ? "25 AVL" : undefined,
      network: "Arc",
      status: "success"
    });
  }

  return (
    <AppShell title="AVL Token" eyebrow="Velora AI ecosystem utility">
      <div className="space-y-6">
        <TokenOverview />

        <Panel title="Token utility" eyebrow="Designed for product access and ecosystem operations">
          <UtilityGrid utilities={AVL_UTILITIES} />
        </Panel>

        <Panel title="Token supply" eyebrow={AVL_TOKEN.totalSupply}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {AVL_TOKENOMICS.map((item) => (
              <TokenomicsCard key={item.label} {...item} />
            ))}
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel title="Rewards system preview">
            <div className="space-y-4">
              {[
                ["Automation rewards", "Earn utility credits for verified AI payment workflows."],
                ["Agent marketplace", "Use AVL for future premium Velora AI agent templates and integrations."],
                ["Fee discounts", "Eligibility layer for discounted automation and API payment features."]
              ].map(([title, text]) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <Award className="h-5 w-5 text-mint" />
                  <p className="mt-3 font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <button onClick={() => recordSocialTask("opened")} className="rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs font-bold text-cyan">Open social task</button>
              <button onClick={() => recordSocialTask("verified")} className="rounded-lg border border-mint/30 bg-mint/10 px-3 py-2 text-xs font-bold text-mint">Verify task</button>
              <button onClick={() => recordSocialTask("claimed")} className="rounded-lg bg-gradient-to-r from-mint to-cyan px-3 py-2 text-xs font-bold text-[#031018]">Claim reward</button>
            </div>
          </Panel>
          <Panel title="Governance coming soon">
            <div className="rounded-lg border border-cyan/20 bg-cyan/10 p-5">
              <Landmark className="h-6 w-6 text-cyan" />
              <p className="mt-4 font-semibold text-white">Future ecosystem signaling</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">AVL may support future governance workflows for product priorities, marketplace curation, and ecosystem programs.</p>
            </div>
          </Panel>
          <Panel title="Arc ecosystem readiness">
            <div className="grid gap-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <Sparkles className="h-5 w-5 text-mint" />
                <p className="mt-3 font-semibold text-white">Premium automation access</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Prepared for future smart contract deployment on Arc.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <Users className="h-5 w-5 text-cyan" />
                <p className="mt-3 font-semibold text-white">Community rewards</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Reward logic is product-demo only until contracts are deployed.</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
