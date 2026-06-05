"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle2,
  Flame,
  Gift,
  Lock,
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

type SocialVisual = {
  description: string;
  accent: string;
  icon: React.ReactNode;
};

function XLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1200 1227" aria-hidden="true" fill="currentColor">
      <path d="M714.2 519.3 1160.9 0h-105.8L667.2 450.9 357.5 0H0l468.5 681.8L0 1226.4h105.8l415.6-483.2 331.6 483.2h357.5L714.2 519.3Zm-147.1 171-47.2-67.4L142.2 79.7h166.6l304.7 436 47.2 67.4 396.6 568.2H890.7L567.1 690.3Z" />
    </svg>
  );
}

function TelegramLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 240 240" aria-hidden="true">
      <circle cx="120" cy="120" r="120" fill="currentColor" opacity="0.16" />
      <path
        d="M181.7 70.6 158.8 178c-1.7 7.6-6.2 9.5-12.6 5.9l-35-25.8-16.9 16.3c-1.9 1.9-3.4 3.4-7 3.4l2.5-35.6 64.8-58.6c2.8-2.5-.6-3.9-4.4-1.4l-80.1 50.5-34.5-10.8c-7.5-2.3-7.6-7.5 1.6-11.1L172 58.8c6.3-2.3 11.8 1.5 9.7 11.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function XLikeIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" fill="none">
      <path d="M18 10h28a8 8 0 0 1 8 8v28a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8V18a8 8 0 0 1 8-8Z" stroke="currentColor" strokeWidth="3" />
      <path d="M39.5 19h5.1L34.9 30.1 46 45h-8.7l-6.8-8.9L22.7 45h-5.1l10.4-11.9L17.4 19h8.9l6.1 8.1L39.5 19Zm-1.8 22.4h2.8L24.8 22.4h-3l15.9 19Z" fill="currentColor" />
      <path d="M32 51s-9-5.3-9-12.2c0-3.6 2.4-6.1 5.6-6.1 1.8 0 3.5.9 4.4 2.3.9-1.4 2.6-2.3 4.4-2.3 3.2 0 5.6 2.5 5.6 6.1C43 45.7 32 51 32 51Z" fill="currentColor" opacity="0.28" />
    </svg>
  );
}

function XRepostIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" fill="none">
      <path d="M18 10h28a8 8 0 0 1 8 8v28a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8V18a8 8 0 0 1 8-8Z" stroke="currentColor" strokeWidth="3" />
      <path d="M39.5 19h5.1L34.9 30.1 46 45h-8.7l-6.8-8.9L22.7 45h-5.1l10.4-11.9L17.4 19h8.9l6.1 8.1L39.5 19Zm-1.8 22.4h2.8L24.8 22.4h-3l15.9 19Z" fill="currentColor" />
      <path d="M21 49h21.5a5.5 5.5 0 0 0 5.5-5.5V40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="m42 34 6 6-6 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M43 15H21.5a5.5 5.5 0 0 0-5.5 5.5V24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="m22 30-6-6 6-6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function socialVisual(taskId: string): SocialVisual {
  switch (taskId) {
    case "follow-x":
      return {
        description: "Follow the official Velora AI account for public updates and ecosystem announcements.",
        accent: "from-slate-900 via-slate-800 to-emerald-950 text-white light:from-slate-950 light:via-slate-800 light:to-emerald-900",
        icon: <XLogo />
      };
    case "join-telegram":
      return {
        description: "Join the Velora Telegram community for product updates and builder conversations.",
        accent: "from-sky-500 via-cyan-500 to-emerald-500 text-white",
        icon: <TelegramLogo />
      };
    case "like-content":
      return {
        description: "Open the Velora post on X, like the content, then verify the task manually.",
        accent: "from-zinc-950 via-slate-900 to-yellow-900 text-white light:from-slate-950 light:via-slate-800 light:to-amber-700",
        icon: <XLikeIcon />
      };
    case "share-content":
      return {
        description: "Share or repost the Velora content on X, then return here to verify completion.",
        accent: "from-emerald-600 via-teal-600 to-slate-950 text-white",
        icon: <XRepostIcon />
      };
    default:
      return {
        description: "Complete this community task and verify it to claim XP.",
        accent: "from-emerald-500 to-yellow-400 text-slate-950",
        icon: <XLogo />
      };
  }
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
            {rewards.socialTasks.map((task) => {
              const visual = socialVisual(task.id);
              const status = task.completed ? "Completed" : task.opened ? "Pending Verification" : "Not Started";
              return (
                <motion.div
                  key={task.id}
                  whileHover={{ y: -5, scale: 1.01 }}
                  className="group relative overflow-hidden rounded-xl border border-emerald-400/20 bg-white/[0.045] p-4 shadow-[0_18px_54px_rgba(0,0,0,0.22)] transition light:border-black light:bg-white light:shadow-[0_18px_44px_rgba(15,23,42,0.1)]"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent opacity-70" />
                  <div className="absolute -right-14 -top-14 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl transition group-hover:bg-yellow-400/15" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <div className={cx("grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br shadow-[0_14px_34px_rgba(16,185,129,0.16)]", visual.accent)}>
                        {visual.icon}
                      </div>
                      <span className="rounded-full border border-yellow-400/35 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-300 shadow-[0_8px_26px_rgba(234,179,8,0.12)] light:text-amber-700">
                        +{task.reward.toLocaleString()} XP
                      </span>
                    </div>
                    <h3 className="mt-5 text-base font-black text-white light:text-slate-950">{task.title}</h3>
                    <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-400 light:text-slate-600">{visual.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 light:border-black light:bg-slate-50">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 light:text-slate-600">Status</span>
                      <span
                        className={cx(
                          "rounded-full px-2.5 py-1 text-xs font-black",
                          task.completed
                            ? "bg-emerald-400/12 text-emerald-300 light:text-emerald-700"
                            : task.opened
                              ? "bg-yellow-400/12 text-yellow-300 light:text-amber-700"
                              : "bg-white/[0.06] text-slate-300 light:bg-slate-100 light:text-slate-700"
                        )}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
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
      </div>
    </AppShell>
  );
}
