"use client";

import { motion } from "framer-motion";
import { Award, BadgeCheck, CalendarCheck, Flame, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { useMemo } from "react";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";
import { cx } from "@/components/azu/utils";
import { AchievementProgressCard } from "@/components/pioneers/AchievementProgressCard";
import { PioneerBadgeCard } from "@/components/pioneers/PioneerBadgeCard";
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
  platinum: "from-orange-300/20 to-amber-100/10 border-orange-300/30",
  diamond: "from-orange-500/25 to-red-500/10 border-orange-400/40"
};

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
            <p className="mt-3 text-xs text-slate-400">{pioneers.canCheckIn ? `+${pioneers.nextPoints} Points` : "Day Completed"}</p>
          </div>
          <div className="glass rounded-lg p-5">
            <Flame className="h-5 w-5 text-warning" />
            <p className="mt-4 text-sm text-slate-400">Current Streak</p>
            <p className="mt-2 text-3xl font-black text-white">{isConnected ? `${pioneers.currentStreak} Days` : "--"}</p>
          </div>
          <div className="glass rounded-lg p-5">
            <Trophy className="h-5 w-5 text-warning" />
            <p className="mt-4 text-sm text-slate-400">Best Streak</p>
            <p className="mt-2 text-3xl font-black text-white">{isConnected ? `${pioneers.bestStreak} Days` : "--"}</p>
          </div>
          <div className="glass rounded-lg p-5">
            <ShieldCheck className="h-5 w-5 text-mint" />
            <p className="mt-4 text-sm text-slate-400">Velora Reputation</p>
            <p className="mt-2 text-3xl font-black text-white">{isConnected ? summary.reputation.toLocaleString() : "--"}</p>
            <p className="mt-2 text-xs text-cyan">{isConnected ? summary.percentile : "--"}</p>
            <p className="mt-2 text-xs text-slate-400">{isConnected ? `${summary.reputationRemaining.toLocaleString()} Reputation Needed` : "--"}</p>
          </div>
          <div className="glass rounded-lg p-5">
            <Award className="h-5 w-5 text-cyan" />
            <p className="mt-4 text-sm text-slate-400">Latest Badge Earned</p>
            <p className="mt-2 text-xl font-black text-white">{isConnected ? latestBadge : "--"}</p>
          </div>
        </div>

        <Panel title="Check-In Calendar" eyebrow="Seven-day cycle">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            {CHECKIN_REWARDS.map((points, index) => {
              const day = index + 1;
              const completed = day <= pioneers.completedDaysInCycle;
              const current = day === pioneers.currentDayInCycle && pioneers.canCheckIn;
              return (
                <motion.div
                  key={points}
                  initial={false}
                  animate={completed ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                  className={cx(
                    "rounded-lg border p-4 text-center transition",
                    completed
                      ? "pioneer-check-complete border-cyan/40 bg-cyan/10 shadow-[0_0_28px_rgba(249,115,22,0.2)]"
                      : current
                        ? "border-cyan/30 bg-white/[0.04]"
                        : "border-white/10 bg-white/[0.03]"
                  )}
                >
                  <p className="text-sm text-slate-400">Day {day}</p>
                  <p className="mt-2 text-2xl font-black text-white">+{points}</p>
                  <div className="mt-3 min-h-6">
                    {completed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan/35 bg-cyan/10 px-2.5 py-1 text-xs font-bold text-cyan">
                        <BadgeCheck className="h-3.5 w-3.5" /> Completed
                      </span>
                    ) : current ? (
                      <span className="text-xs font-semibold text-cyan">Claim Available</span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500">Locked</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
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
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-slate-500">Current Level</p>
                  <p className="font-bold text-white">{summary.level.name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Current Points</p>
                  <p className="font-bold text-white">{summary.totalPoints.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Next Level</p>
                  <p className="font-bold text-white">{summary.nextLevel?.name ?? "Complete"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Points Needed</p>
                  <p className="font-bold text-white">{summary.nextLevel ? `${(summary.nextLevel.minPoints - summary.totalPoints).toLocaleString()} Points Needed` : "Complete"}</p>
                </div>
              </div>
              <div className="mt-4 h-2.5 rounded-full bg-black/30">
                <div className="h-full rounded-full bg-cyan" style={{ width: `${summary.progress}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-cyan">{summary.progress}%</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

        <Panel title="Achievement Progress" eyebrow="Current position, next goal, and remaining requirement">
          <div className="grid gap-4 xl:grid-cols-2">
            {summary.achievementProgress.map((item) => (
              <AchievementProgressCard key={item.id} item={item} />
            ))}
          </div>
        </Panel>

        <Panel title="Network Elite Tracker" eyebrow="Reputation milestone">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Current Rank</p>
              <p className="mt-2 text-2xl font-black text-white">{summary.percentile}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Current Reputation Score</p>
              <p className="mt-2 text-2xl font-black text-white">{summary.reputation.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Next Milestone</p>
              <p className="mt-2 text-2xl font-black text-white">{summary.nextReputationMilestone.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Remaining</p>
              <p className="mt-2 text-2xl font-black text-white">{summary.reputationRemaining.toLocaleString()} Needed</p>
            </div>
          </div>
          <div className="mt-5 h-2.5 rounded-full bg-black/30">
            <div className="h-full rounded-full bg-cyan" style={{ width: `${summary.reputationProgress}%` }} />
          </div>
        </Panel>

        <Panel title="Badges" eyebrow="Premium community achievements">
          <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-white">Completion</p>
              <p className="text-sm font-bold text-cyan">{summary.badgeCompletion}%</p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-black/30">
              <div className="h-full rounded-full bg-cyan" style={{ width: `${summary.badgeCompletion}%` }} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.badges.map((badge) => (
              <PioneerBadgeCard key={badge.id} badge={badge} />
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
            <Leaderboard title="Top Pioneers" rows={leaderboards.pioneers} selector={(row) => row.summary.totalPoints} />
            <Leaderboard title="Top Traders" rows={leaderboards.traders} selector={(row) => row.summary.counts.swaps} />
            <Leaderboard title="Top Bridge Users" rows={leaderboards.bridges} selector={(row) => row.summary.counts.bridges} />
            <Leaderboard title="Top Automation Users" rows={leaderboards.automation} selector={(row) => row.summary.counts.automation} />
            <Leaderboard title="Top Agent Users" rows={leaderboards.agents} selector={(row) => row.summary.counts.agentUsage} />
            <Leaderboard title="Top Reputation Scores" rows={leaderboards.reputation} selector={(row) => row.summary.reputation} />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
