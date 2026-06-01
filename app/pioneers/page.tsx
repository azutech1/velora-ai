"use client";

import { motion } from "framer-motion";
import { Award, BadgeCheck, CalendarCheck, Flame, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { useMemo } from "react";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";
import { cx } from "@/components/azu/utils";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { usePioneerProfile } from "@/hooks/usePioneerProfile";
import { buildPioneerLeaderboards, CHECKIN_REWARDS, POINT_RULES, PIONEER_LEVELS } from "@/lib/pioneers/system";
import { shortAddress } from "@/lib/utils/format";

const benefits = [
  "Earn Points",
  "Unlock Exclusive Badges",
  "Build Reputation",
  "Climb Community Levels",
  "Gain Early Adopter Recognition",
  "Participate In Future Ecosystem Initiatives"
];

const levelStyles = {
  bronze: "from-amber-900/30 to-amber-500/10 border-amber-500/25",
  silver: "from-slate-400/20 to-slate-200/10 border-slate-300/25",
  gold: "from-yellow-500/25 to-amber-300/10 border-yellow-400/30",
  platinum: "from-cyan/25 to-blue-300/10 border-cyan/30",
  diamond: "from-blue-500/25 to-cyan/10 border-cyan/40"
};

function BadgeSvg({ rarity, earned }: { rarity: string; earned: boolean }) {
  const accent = rarity === "Legendary" ? "#F59E0B" : rarity === "Epic" ? "#06B6D4" : rarity === "Rare" ? "#3B82F6" : "#94A3B8";
  return (
    <svg viewBox="0 0 80 80" className={cx("h-14 w-14 shrink-0 transition group-hover:scale-105", !earned && "opacity-45")} role="img" aria-label={`${rarity} badge`}>
      <defs>
        <linearGradient id={`badge-${rarity}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0B1220" />
          <stop offset="55%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>
      <path d="M40 5 69 21v38L40 75 11 59V21z" fill={`url(#badge-${rarity})`} stroke={accent} strokeWidth="2.5" />
      <circle cx="40" cy="40" r="20" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.45)" />
      <path d="M40 24 45 35l12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill={earned ? accent : "#64748B"} />
    </svg>
  );
}

function Leaderboard({ title, rows, selector }: { title: string; rows: ReturnType<typeof buildPioneerLeaderboards>["pioneers"]; selector: (row: (typeof rows)[number]) => number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <h3 className="font-bold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.length ? (
          rows.map((row, index) => (
            <div key={row.wallet} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm">
              <span className="text-slate-300">{index + 1}. {shortAddress(row.wallet)}</span>
              <span className="font-semibold text-white">{selector(row).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">No community data yet.</div>
        )}
      </div>
    </div>
  );
}

export default function PioneersPage() {
  const { address, isConnected } = useAccount();
  const { activities, recordActivity } = useActivityRecorder();
  const walletActivities = useMemo(() => {
    if (!address) return [];
    return activities.filter((record) => record.walletAddress.toLowerCase() === address.toLowerCase());
  }, [activities, address]);
  const pioneers = usePioneerProfile(walletActivities);
  const summary = pioneers.summary;
  const earnedBadges = summary.badges.filter((badge) => badge.earned);
  const latestBadge = earnedBadges.at(-1)?.name ?? "--";
  const leaderboards = useMemo(() => buildPioneerLeaderboards(activities), [activities]);

  function claimDailyCheckin() {
    const result = pioneers.claimCheckin();
    if (!result) return;
    recordActivity({
      actionType: "pioneer_checkin_claimed",
      title: "Daily check-in claimed",
      description: `Claimed ${result.points} Velora Pioneer points.`,
      feature: "pioneers",
      status: "success",
      metadata: {
        points: result.points,
        currentStreak: result.currentStreak
      }
    });
  }

  return (
    <AppShell title="Velora Pioneers" eyebrow="Community reputation and participation">
      <div className="space-y-6">
        <Panel title="Become a Velora Pioneer" eyebrow="The earliest users help shape the future of Velora Network.">
          <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
            <div>
              <p className="max-w-3xl text-3xl font-black leading-tight text-white">Build your reputation. Unlock badges. Earn points. Climb community levels. Become recognized within the Velora ecosystem.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold text-slate-300">
                    <BadgeCheck className="h-4 w-4 text-cyan" />
                    {benefit}
                  </div>
                ))}
              </div>
              <p className="mt-5 rounded-lg border border-cyan/20 bg-cyan/10 p-4 text-sm leading-6 text-slate-300">Early participation, activity, and contributions may be considered in future Velora ecosystem programs.</p>
            </div>
            <div className={cx("rounded-lg border bg-gradient-to-br p-5", levelStyles[summary.level.color])}>
              <Sparkles className="h-7 w-7 text-cyan" />
              <p className="mt-4 text-sm text-slate-400">Total Points</p>
              <p className="mt-2 text-5xl font-black text-white">{isConnected ? summary.totalPoints.toLocaleString() : "--"}</p>
              <p className="mt-4 text-sm font-semibold text-white">Level {summary.level.level}: {summary.level.name}</p>
              <div className="mt-4 h-3 rounded-full bg-black/30">
                <div className="h-full rounded-full bg-cyan" style={{ width: `${isConnected ? summary.progress : 0}%` }} />
              </div>
              <p className="mt-3 text-sm text-slate-400">{summary.nextLevel ? `${summary.nextLevel.minPoints - summary.totalPoints} points to ${summary.nextLevel.name}` : "Highest community level reached"}</p>
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="glass rounded-lg p-5">
            <CalendarCheck className="h-5 w-5 text-cyan" />
            <p className="mt-4 text-sm text-slate-400">Daily Check-In</p>
            <button onClick={claimDailyCheckin} disabled={!pioneers.canCheckIn} className="mt-3 w-full rounded-lg bg-cyan px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-slate-500">
              Claim Daily Check-In
            </button>
            <p className="mt-3 text-xs text-slate-400">{pioneers.canCheckIn ? `${pioneers.nextPoints} Points` : "Claimed today"}</p>
          </div>
          <div className="glass rounded-lg p-5">
            <Flame className="h-5 w-5 text-warning" />
            <p className="mt-4 text-sm text-slate-400">🔥 Current Streak</p>
            <p className="mt-2 text-3xl font-black text-white">{isConnected ? `${pioneers.currentStreak} Days` : "--"}</p>
          </div>
          <div className="glass rounded-lg p-5">
            <Trophy className="h-5 w-5 text-warning" />
            <p className="mt-4 text-sm text-slate-400">🏆 Best Streak</p>
            <p className="mt-2 text-3xl font-black text-white">{isConnected ? `${pioneers.bestStreak} Days` : "--"}</p>
          </div>
          <div className="glass rounded-lg p-5">
            <ShieldCheck className="h-5 w-5 text-mint" />
            <p className="mt-4 text-sm text-slate-400">Velora Reputation</p>
            <p className="mt-2 text-3xl font-black text-white">{isConnected ? summary.reputation.toLocaleString() : "--"}</p>
            <p className="mt-2 text-xs text-cyan">{isConnected ? summary.percentile : "--"}</p>
          </div>
          <div className="glass rounded-lg p-5">
            <Award className="h-5 w-5 text-cyan" />
            <p className="mt-4 text-sm text-slate-400">Latest Badge Earned</p>
            <p className="mt-2 text-xl font-black text-white">{isConnected ? latestBadge : "--"}</p>
          </div>
        </div>

        <Panel title="Check-In Rewards" eyebrow="Seven-day cycle">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            {CHECKIN_REWARDS.map((points, index) => (
              <div key={points} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-center">
                <p className="text-sm text-slate-400">Day {index + 1}</p>
                <p className="mt-2 text-2xl font-black text-white">{points}</p>
                <p className="text-xs text-slate-500">Points</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Panel title="Points System">
            <div className="grid gap-3 sm:grid-cols-2">
              {POINT_RULES.map((rule) => (
                <div key={rule.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <span className="text-sm text-slate-300">{rule.label}</span>
                  <span className="font-bold text-white">{rule.points} Points</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Community Levels">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {PIONEER_LEVELS.map((level) => (
                <div key={level.level} className={cx("rounded-lg border bg-gradient-to-br p-4", levelStyles[level.color])}>
                  <p className="text-sm text-slate-400">Level {level.level}</p>
                  <p className="mt-2 text-xl font-black text-white">{level.name}</p>
                  <p className="mt-2 text-xs text-slate-400">{level.minPoints.toLocaleString()} Points</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Badges" eyebrow="Premium community achievements">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.badges.map((badge) => (
              <motion.div key={badge.id} whileHover={{ y: -4 }} className={cx("group rounded-lg border p-4", badge.earned ? "border-cyan/25 bg-cyan/10" : "border-white/10 bg-white/[0.04]")}>
                <div className="flex items-center gap-3">
                  <BadgeSvg rarity={badge.rarity} earned={badge.earned} />
                  <div>
                    <p className="font-black text-white">{badge.name}</p>
                    <p className="mt-1 text-xs font-semibold text-cyan">{badge.rarity}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{badge.detail}</p>
              </motion.div>
            ))}
          </div>
        </Panel>

        <Panel title="Streak Badges">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {summary.streakBadges.map((badge) => (
              <div key={badge.id} className={cx("rounded-lg border p-4", badge.earned ? "border-warning/30 bg-warning/10" : "border-white/10 bg-white/[0.04]")}>
                <p className="font-bold text-white">{badge.name}</p>
                <p className="mt-2 text-sm text-slate-400">{badge.days}-Day Streak</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Leaderboards" eyebrow="Known Velora activity records">
          <div className="grid gap-4 xl:grid-cols-2">
            <Leaderboard title="🏆 Top Pioneers" rows={leaderboards.pioneers} selector={(row) => row.summary.totalPoints} />
            <Leaderboard title="🏆 Top Traders" rows={leaderboards.traders} selector={(row) => row.summary.counts.swaps} />
            <Leaderboard title="🏆 Top Bridge Users" rows={leaderboards.bridges} selector={(row) => row.summary.counts.bridges} />
            <Leaderboard title="🏆 Top Automation Users" rows={leaderboards.automation} selector={(row) => row.summary.counts.automation} />
            <Leaderboard title="🏆 Top Agent Users" rows={leaderboards.agents} selector={(row) => row.summary.counts.agentUsage} />
            <Leaderboard title="🏆 Top Reputation Scores" rows={leaderboards.reputation} selector={(row) => row.summary.reputation} />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
