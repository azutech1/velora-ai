"use client";

import { Award, BadgeCheck, Coins, Crown, Medal, ShieldCheck, Sparkles, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { MetricCard, Panel } from "@/components/azu/ui";
import { cx } from "@/components/azu/utils";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { calculateVeloraPoints, VELORA_BADGES, VELORA_TOKEN, VELORA_TOKENOMICS } from "@/lib/tokens/velora";

const pointCategories = [
  { label: "Swaps", key: "swaps", detail: "Live swap activity" },
  { label: "Bridges", key: "bridges", detail: "Bridge workflow activity" },
  { label: "Payments", key: "payments", detail: "Stablecoin payment activity" },
  { label: "Automation", key: "automation", detail: "Automation and approval activity" },
  { label: "Agent Usage", key: "agentUsage", detail: "AI agent and agent payment activity" },
  { label: "Referrals", key: "referrals", detail: "Referral activity when available" }
] as const;

const leaderboardSections = [
  "Top Users",
  "Top Contributors",
  "Top Automation Users",
  "Top Bridge Users"
];

export default function TokenPage() {
  const { activities } = useActivityRecorder();
  const summary = calculateVeloraPoints(activities);
  const earnedBadges = summary.badges.filter((badge) => badge.earned).length;

  return (
    <AppShell title="Velora Token" eyebrow="Coming soon ecosystem participation">
      <div className="space-y-6">
        <Panel
          title="Velora Token"
          eyebrow="Coming Soon"
          action={<span className="rounded-full border border-mint/30 bg-mint/10 px-3 py-2 text-xs font-bold text-mint">{VELORA_TOKEN.status}</span>}
        >
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full border border-mint/30 bg-mint/10 shadow-neon">
                  <Coins className="h-8 w-8 text-mint" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Ticker</p>
                  <h2 className="text-3xl font-black text-white">{VELORA_TOKEN.symbol}</h2>
                </div>
              </div>
              <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-300">{VELORA_TOKEN.purpose}</p>
              <div className="mt-5 rounded-lg border border-cyan/20 bg-cyan/10 p-4 text-sm leading-6 text-cyan">
                <ShieldCheck className="mb-2 h-5 w-5" />
                {VELORA_TOKEN.communityMessage}
              </div>
            </div>
            <div className="grid gap-3">
              {[
                ["Status", VELORA_TOKEN.status],
                ["Ticker", VELORA_TOKEN.symbol],
                ["Purpose", "Ecosystem utility planning"],
                ["Program", "Early adopter recognition"]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-right text-sm font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Points" value={String(summary.totalPoints)} detail="Calculated from Velora activity" icon={Sparkles} />
          <MetricCard title="Badges" value={`${earnedBadges}/${VELORA_BADGES.length}`} detail="Earned through real usage" icon={Award} />
          <MetricCard title="Rank" value={summary.rank} detail="No token entitlement implied" icon={Crown} />
        </div>

        <Panel title="Tokenomics" eyebrow="Planning framework">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {VELORA_TOKENOMICS.map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-3 text-2xl font-black text-white">{item.value}</p>
                {item.value.endsWith("%") ? (
                  <div className="mt-4 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-cyan" style={{ width: item.value }} />
                  </div>
                ) : null}
                <p className="mt-4 text-sm leading-6 text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Early Adopter Program" eyebrow="Community-first participation">
          <div className="rounded-lg border border-mint/20 bg-mint/10 p-5">
            <p className="text-lg font-bold text-white">Participation may be considered for future ecosystem rewards.</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              This is not a promise of token distribution, profit, eligibility, or allocation. Velora AI uses points and badges to recognize product participation while the ecosystem is in testnet alpha.
            </p>
          </div>
        </Panel>

        <Panel title="Badge System" eyebrow="Recognition levels">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summary.badges.map((badge) => (
              <div key={badge.id} className={cx("rounded-lg border p-5", badge.earned ? "border-mint/30 bg-mint/10" : "border-white/10 bg-white/[0.04]")}>
                <div className="flex items-center justify-between gap-3">
                  <BadgeCheck className={cx("h-6 w-6", badge.earned ? "text-mint" : "text-slate-500")} />
                  <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", badge.earned ? "bg-mint/15 text-mint" : "bg-white/[0.06] text-slate-400")}>
                    {badge.earned ? "Earned" : "Locked"}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{badge.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{badge.detail}</p>
                <p className="mt-4 text-xs text-cyan">{badge.threshold}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Points System" eyebrow="Tracked categories">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pointCategories.map((category) => (
              <div key={category.key} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">{category.label}</p>
                <p className="mt-3 text-3xl font-black text-white">{summary.counts[category.key]}</p>
                <p className="mt-2 text-sm text-slate-500">{category.detail}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Leaderboard" eyebrow="Community rankings">
          <div className="grid gap-4 md:grid-cols-2">
            {leaderboardSections.map((section) => (
              <div key={section} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-3">
                  {section.includes("Bridge") ? <Trophy className="h-5 w-5 text-cyan" /> : section.includes("Automation") ? <Medal className="h-5 w-5 text-cyan" /> : <Users className="h-5 w-5 text-cyan" />}
                  <h3 className="font-bold text-white">{section}</h3>
                </div>
                <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-6 text-center text-sm text-slate-400">
                  No public leaderboard data yet.
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
