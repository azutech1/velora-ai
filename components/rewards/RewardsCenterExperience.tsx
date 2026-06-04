"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle2,
  Flame,
  Gift,
  Heart,
  Lock,
  MessageCircle,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Wallet
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";
import { cx } from "@/components/azu/utils";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useRewardsCenter } from "@/hooks/useRewardsCenter";
import { DAILY_REWARDS, progressPercent, type RewardTask } from "@/lib/rewards/system";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const change = value - start;
    if (!change) return;
    const started = performance.now();
    const duration = 650;
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + change * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [display, value]);

  return <>{display.toLocaleString()}</>;
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx("h-3 overflow-hidden rounded-full bg-black/30 light:bg-slate-200", className)}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-amber-500"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
    </div>
  );
}

function RewardButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-gradient-to-r from-emerald-400 to-yellow-400 px-4 py-2.5 text-sm font-black text-slate-950 shadow-[0_12px_30px_rgba(16,185,129,0.22)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-none disabled:bg-white/[0.06] disabled:text-slate-500 disabled:shadow-none"
    >
      {children}
    </button>
  );
}

function TaskCard({ task }: { task: RewardTask }) {
  const percent = progressPercent(task.progress, task.requirement);
  return (
    <motion.div whileHover={{ y: -3 }} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 light:border-black light:bg-white light:shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-white light:text-slate-950">{task.title}</h3>
          <p className="mt-1 text-sm text-slate-400 light:text-slate-600">+{task.reward.toLocaleString()} XP</p>
        </div>
        {task.claimed ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300 light:text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Claimed
          </span>
        ) : task.completed ? (
          <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 text-xs font-bold text-yellow-300 light:text-amber-700">Ready</span>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-slate-400 light:border-black light:text-slate-700">In Progress</span>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-400 light:text-slate-600">
        <span>{Math.min(task.progress, task.requirement).toLocaleString()} / {task.requirement.toLocaleString()} {task.unit}</span>
        <span>{percent}%</span>
      </div>
      <ProgressBar value={percent} className="mt-2 h-2" />
    </motion.div>
  );
}

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

export function RewardsCenterExperience() {
  const { address } = useAccount();
  const { activities } = useActivityRecorder();
  const walletActivities = useMemo(() => {
    if (!address) return [];
    return activities.filter((record) => record.walletAddress.toLowerCase() === address.toLowerCase());
  }, [activities, address]);
  const rewards = useRewardsCenter(walletActivities);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!rewards.lastReward) return;
    setToast(`+${rewards.lastReward.amount.toLocaleString()} XP - ${rewards.lastReward.title}`);
    const timeout = window.setTimeout(() => {
      setToast(null);
      rewards.clearLastReward();
    }, 2400);
    return () => window.clearTimeout(timeout);
  }, [rewards]);

  function notify(result: { amount: number; title: string } | null) {
    if (!result) return;
    setToast(`+${result.amount.toLocaleString()} XP - ${result.title}`);
  }

  function showError(message: string) {
    setToast(message);
  }

  return (
    <AppShell title="Rewards Center" eyebrow="XP, streaks, achievements, and future progression">
      <div className="space-y-6">
        <AnimatePresence>
          {toast ? (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="fixed right-4 top-4 z-[60] rounded-xl border border-emerald-400/30 bg-slate-950/95 px-5 py-4 text-sm font-black text-white shadow-[0_20px_70px_rgba(16,185,129,0.28)] backdrop-blur-xl light:bg-white light:text-slate-950"
            >
              {toast}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <section className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-emerald-400/12 via-white/[0.04] to-yellow-400/10 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] light:border-black light:bg-white light:from-emerald-50 light:via-white light:to-yellow-50">
          <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-300 light:text-emerald-700">
                <Gift className="h-3.5 w-3.5" /> Rewards Center
              </div>
              <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white light:text-slate-950 sm:text-5xl">One rewards hub for every Velora milestone.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 light:text-slate-600">Earn wallet-scoped XP from daily check-ins, community tasks, swaps, bridges, and achievement milestones. Rewards Center is the single home for current progression and future referrals, leaderboards, campaigns, and ecosystem rewards.</p>
              {!rewards.isConnected ? (
                <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-200 light:text-amber-700">
                  <Wallet className="h-4 w-4" /> Connect wallet to start earning XP.
                </div>
              ) : null}
            </div>

            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-xl border border-yellow-400/25 bg-black/30 p-5 light:border-black light:bg-white light:shadow-[0_16px_46px_rgba(15,23,42,0.1)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-400 light:text-slate-600">Current XP Balance</p>
                  <p className="mt-2 text-5xl font-black text-white light:text-slate-950">
                    <AnimatedNumber value={rewards.isConnected ? rewards.xp : 0} /> XP
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -8, 0], scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1.2 }}
                  className="grid h-14 w-14 place-items-center rounded-full border border-yellow-400/40 bg-yellow-400/15 text-yellow-300"
                >
                  <Star className="h-7 w-7 fill-yellow-300/40" />
                </motion.div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 light:border-black light:bg-white">
                  <p className="text-xs text-slate-400 light:text-slate-600">Current Streak</p>
                  <p className="mt-1 text-xl font-black text-white light:text-slate-950">{rewards.isConnected ? rewards.currentStreak : 0} Days</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 light:border-black light:bg-white">
                  <p className="text-xs text-slate-400 light:text-slate-600">Level</p>
                  <p className="mt-1 text-xl font-black text-white light:text-slate-950">{rewards.isConnected ? rewards.level.level : 1}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs font-bold text-slate-300 light:text-slate-700">
                <span>{rewards.level.progress}% Progress to Level {rewards.level.nextLevel}</span>
                <span>{rewards.level.remaining.toLocaleString()} XP needed</span>
              </div>
              <ProgressBar value={rewards.isConnected ? rewards.level.progress : 0} className="mt-2" />
            </motion.div>
          </div>
        </section>

        <Panel title="Daily Check-in" eyebrow="7-day XP reward cycle">
          <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
              {DAILY_REWARDS.map((xp, index) => {
                const day = index + 1;
                const completed = rewards.lastCheckinDate ? day < rewards.cycleDay || (rewards.cycleDay === 1 && rewards.lastCheckinDate) : false;
                const active = day === rewards.cycleDay && rewards.canClaimDaily;
                return (
                  <div
                    key={day}
                    className={cx(
                      "rounded-lg border p-4 text-center transition",
                      active
                        ? "border-yellow-400/45 bg-yellow-400/10 shadow-[0_0_30px_rgba(234,179,8,0.18)]"
                        : completed
                          ? "border-emerald-400/35 bg-emerald-400/10"
                          : "border-white/10 bg-white/[0.04] light:border-black light:bg-white"
                    )}
                  >
                    <p className="text-sm font-bold text-white light:text-slate-950">Day {day}</p>
                    <p className="mt-2 text-2xl font-black text-yellow-300 light:text-amber-600">+{xp.toLocaleString()}</p>
                    <p className="mt-3 text-xs font-bold text-slate-400 light:text-slate-600">
                      {completed ? "Completed" : active ? "Claim Available" : "Locked"}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-5 light:border-black light:bg-emerald-50">
              <Flame className="h-7 w-7 text-emerald-300 light:text-emerald-700" />
              <h3 className="mt-4 text-xl font-black text-white light:text-slate-950">Claim Daily Reward</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-600">Today&apos;s reward: +{rewards.dailyReward.toLocaleString()} XP</p>
              <div className="mt-5">
                <RewardButton disabled={!rewards.canClaimDaily} onClick={() => notify(rewards.claimDaily())}>
                  {rewards.canClaimDaily ? "Claim Reward" : "Claimed Today"}
                </RewardButton>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Social Tasks" eyebrow="Community actions">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {rewards.socialTasks.map((task, index) => {
              const icons = [Sparkles, MessageCircle, Send, Heart, Share2];
              const Icon = icons[index] ?? Sparkles;
              const status = task.completed ? "Completed" : task.opened ? "Pending Verification" : "Not Started";
              return (
                <motion.div key={task.id} whileHover={{ y: -3 }} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 light:border-black light:bg-white light:shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
                  <Icon className={cx("h-5 w-5", task.completed ? "text-emerald-300 light:text-emerald-700" : "text-yellow-300 light:text-amber-600")} />
                  <h3 className="mt-4 font-bold text-white light:text-slate-950">{task.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 light:text-slate-600">+{task.reward.toLocaleString()} XP</p>
                  <p className="mt-3 text-xs font-bold text-slate-500 light:text-slate-600">{status}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!task.opened && !task.completed ? (
                      <RewardButton
                        disabled={task.completed}
                        onClick={() => {
                          const result = rewards.openSocialTask(task.id);
                          if (result?.error) showError(result.error);
                        }}
                      >
                        Open Task
                      </RewardButton>
                    ) : null}
                    {task.opened && !task.completed ? (
                      <RewardButton
                        onClick={() => {
                          const result = rewards.verifySocialTask(task.id);
                          if ("error" in result) showError(result.error);
                          else notify(result);
                        }}
                      >
                        Verify Task
                      </RewardButton>
                    ) : null}
                    {task.completed ? (
                      <RewardButton disabled>
                        Completed <CheckCircle2 className="ml-1 inline h-4 w-4" />
                      </RewardButton>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Bridge Tasks" eyebrow="Milestones update from real bridge history">
            <div className="grid gap-4">
              {rewards.bridgeTasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
          </Panel>
          <Panel title="Swap Tasks" eyebrow="Milestones update from real swap history">
            <div className="grid gap-4">
              {rewards.swapTasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
          </Panel>
        </div>

        <Panel title="Achievement Rewards" eyebrow="Unlocked automatically from XP progress">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {rewards.achievements.map((achievement) => {
              const percent = progressPercent(achievement.progress, achievement.requirement);
              return (
                <motion.div
                  key={achievement.id}
                  whileHover={{ y: -3 }}
                  className={cx(
                    "rounded-lg border p-5 transition light:border-black light:bg-white light:shadow-[0_14px_34px_rgba(15,23,42,0.08)]",
                    achievement.claimed ? "border-emerald-400/35 bg-emerald-400/10" : "border-white/10 bg-white/[0.04]",
                    !achievement.unlocked && "opacity-75"
                  )}
                >
                  <div className="flex items-center justify-between">
                    {achievement.unlocked ? <Trophy className="h-6 w-6 text-yellow-300 light:text-amber-600" /> : <Lock className="h-6 w-6 text-slate-500" />}
                    {achievement.claimed ? <BadgeCheck className="h-5 w-5 text-emerald-300 light:text-emerald-700" /> : null}
                  </div>
                  <h3 className="mt-5 font-black text-white light:text-slate-950">{achievement.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 light:text-slate-600">+{achievement.reward.toLocaleString()} XP Bonus</p>
                  <div className="mt-4 flex justify-between text-xs font-bold text-slate-400 light:text-slate-600">
                    <span>{Math.min(achievement.progress, achievement.requirement).toLocaleString()} XP</span>
                    <span>{percent}%</span>
                  </div>
                  <ProgressBar value={percent} className="mt-2 h-2" />
                </motion.div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Recent Rewards" eyebrow="Newest XP activity first">
          {rewards.recentActivity.length ? (
            <div className="space-y-3">
              {rewards.recentActivity.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 light:border-black light:bg-white">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full border border-yellow-400/35 bg-yellow-400/10 text-yellow-300 light:text-amber-600">
                      <Star className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-white light:text-slate-950">+{item.amount.toLocaleString()} XP - {item.title}</p>
                      <p className="mt-1 text-xs text-slate-500 light:text-slate-600">{formatTime(item.timestamp)}</p>
                    </div>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-300 light:text-emerald-700" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-slate-400 light:border-black light:bg-white light:text-slate-600">No rewards activity yet.</div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
