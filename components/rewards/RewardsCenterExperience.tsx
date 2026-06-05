"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
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
import { DAILY_REWARDS, progressPercent, type EarlyVeloraPioneerProgress, type RewardTask } from "@/lib/rewards/system";

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

function XPRewardBadge({ amount, suffix = "XP", className }: { amount: number; suffix?: string; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 px-3.5 py-1.5 text-xs font-black text-white shadow-[0_12px_32px_rgba(249,115,22,0.34)] ring-1 ring-white/20 light:shadow-[0_12px_28px_rgba(249,115,22,0.26)]",
        className
      )}
    >
      <Star className="h-3.5 w-3.5 fill-white/35 text-white" />
      +{amount.toLocaleString()} {suffix}
    </span>
  );
}

function RewardButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 px-4 py-2.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(249,115,22,0.28)] transition hover:scale-[1.01] hover:shadow-[0_18px_44px_rgba(239,68,68,0.3)] disabled:cursor-not-allowed disabled:bg-none disabled:bg-white/[0.06] disabled:text-slate-500 disabled:shadow-none light:disabled:bg-slate-200 light:disabled:text-slate-500"
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: "completed" | "pending" | "ready" | "progress" | "claimed" }) {
  if (status === "completed" || status === "claimed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1 text-xs font-black text-emerald-300 light:text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> {status === "claimed" ? "Claimed" : "Completed"}
      </span>
    );
  }

  if (status === "pending" || status === "ready") {
    return (
      <span className="rounded-full border border-amber-500/40 bg-amber-500/14 px-2.5 py-1 text-xs font-black text-amber-200 light:text-amber-700">
        {status === "ready" ? "Ready" : "Pending Verification"}
      </span>
    );
  }

  return (
    <span className="rounded-full border border-slate-500/25 bg-white/[0.06] px-2.5 py-1 text-xs font-black text-slate-300 light:border-black light:bg-slate-100 light:text-slate-800">
      In Progress
    </span>
  );
}

function TaskCard({ task }: { task: RewardTask }) {
  const percent = progressPercent(task.progress, task.requirement);
  return (
    <motion.div whileHover={{ y: -3 }} className="relative overflow-hidden rounded-xl border border-orange-400/15 bg-gradient-to-br from-white/[0.06] via-white/[0.035] to-orange-400/[0.035] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] light:border-black light:bg-white light:from-white light:via-orange-50/45 light:to-amber-50/60 light:shadow-[0_18px_42px_rgba(15,23,42,0.09)]">
      <div className="pointer-events-none absolute -right-14 -top-14 h-28 w-28 rounded-full bg-orange-400/10 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="relative font-bold text-white light:text-slate-950">{task.title}</h3>
          <div className="mt-2"><XPRewardBadge amount={task.reward} /></div>
        </div>
        {task.claimed ? <StatusBadge status="claimed" /> : task.completed ? <StatusBadge status="ready" /> : <StatusBadge status="progress" />}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-400 light:text-slate-600">
        <span>{Math.min(task.progress, task.requirement).toLocaleString()} / {task.requirement.toLocaleString()} {task.unit}</span>
        <span>{percent}%</span>
      </div>
      <ProgressBar value={percent} className="mt-2 h-2" />
    </motion.div>
  );
}

function VeloraPioneerBadgeVisual({ claimed, ready }: { claimed?: boolean; ready?: boolean }) {
  return (
    <div
      className={cx(
        "relative mx-auto grid h-32 w-32 place-items-center overflow-hidden rounded-full border bg-gradient-to-br from-emerald-500/20 via-yellow-300/15 to-amber-500/20 shadow-[0_0_50px_rgba(234,179,8,0.18)]",
        ready || claimed ? "border-yellow-300/70" : "border-white/15 opacity-70 blur-[0.5px]"
      )}
    >
      <div className="absolute inset-2 rounded-full border border-emerald-300/35" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_24%),radial-gradient(circle_at_70%_85%,rgba(16,185,129,0.24),transparent_34%)]" />
      {(ready || claimed) ? (
        <motion.div
          className="absolute inset-y-0 -left-16 w-12 rotate-12 bg-white/35 blur-md"
          animate={{ x: [0, 210] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
        />
      ) : null}
      <div className="relative grid h-20 w-20 place-items-center rounded-full border border-yellow-300/40 bg-slate-950/80">
        <Image src="/brand/velora-mark-dark.png" alt="Velora AI" width={56} height={56} className="drop-shadow-[0_0_18px_rgba(16,185,129,0.4)]" />
      </div>
    </div>
  );
}

function EarlyPioneerAchievementCard({
  badge,
  onClaim
}: {
  badge: EarlyVeloraPioneerProgress;
  onClaim: () => void;
}) {
  const state = badge.claimed ? "Claimed" : badge.readyToClaim ? "Ready To Claim" : badge.progress > 0 ? "In Progress" : "Locked";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cx(
        "relative overflow-hidden rounded-xl border p-5 transition light:border-black light:bg-white light:shadow-[0_16px_42px_rgba(15,23,42,0.1)]",
        badge.claimed
          ? "border-emerald-400/40 bg-emerald-400/10"
          : badge.readyToClaim
            ? "border-yellow-300/60 bg-gradient-to-br from-yellow-400/16 via-emerald-400/10 to-white/[0.04] shadow-[0_0_55px_rgba(234,179,8,0.14)]"
            : "border-white/10 bg-white/[0.04]"
      )}
    >
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-yellow-400/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300 light:text-amber-700">Early Supporter Badge</p>
            <h3 className="mt-2 text-xl font-black text-white light:text-slate-950">Early Velora Pioneer</h3>
          </div>
          <span
            className={cx(
              "rounded-full border px-3 py-1 text-xs font-black",
              badge.claimed
                ? "border-emerald-400/35 bg-emerald-400/12 text-emerald-300 light:text-emerald-700"
                : badge.readyToClaim
                  ? "border-yellow-300/45 bg-yellow-300/12 text-yellow-200 light:text-amber-700"
                  : "border-white/10 bg-white/[0.05] text-slate-400 light:border-black light:bg-slate-100 light:text-slate-700"
            )}
          >
            {state}
          </span>
        </div>
        <div className="mt-5">
          <VeloraPioneerBadgeVisual claimed={badge.claimed} ready={badge.readyToClaim} />
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-400 light:text-slate-600">{badge.description}</p>
        <div className="mt-5 flex justify-between text-xs font-bold text-slate-400 light:text-slate-600">
          <span>Progress</span>
          <span>{badge.progress}%</span>
        </div>
        <ProgressBar value={badge.progress} className="mt-2 h-2" />
        <div className="mt-5 space-y-2">
          {badge.requirements.map((requirement) => (
            <div key={requirement.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm light:border-black light:bg-slate-50">
              <span className="flex items-center gap-2 text-slate-300 light:text-slate-700">
                {requirement.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-300 light:text-emerald-700" /> : <Lock className="h-4 w-4 text-slate-500" />}
                {requirement.label}
              </span>
              {requirement.detail ? <span className="text-xs font-bold text-slate-500">{requirement.detail}</span> : null}
            </div>
          ))}
        </div>
        <div className="mt-5">
          {badge.claimed ? (
            <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/35 bg-emerald-500/12 px-4 py-2.5 text-sm font-black text-emerald-300 light:text-emerald-700">
              Claimed <BadgeCheck className="h-4 w-4" />
            </span>
          ) : badge.readyToClaim ? (
            <RewardButton onClick={onClaim}>Claim Badge</RewardButton>
          ) : (
            <RewardButton disabled>Complete Requirements</RewardButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}

type SocialVisual = {
  description: string;
  accent: string;
  icon: React.ReactNode;
};

function XLogoImage() {
  return (
    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_16px_34px_rgba(15,23,42,0.16)] ring-1 ring-black/5 dark:border-white/15 dark:bg-white dark:shadow-[0_16px_38px_rgba(0,0,0,0.36)]">
      <Image src="/brand/x-logo.png" alt="X" width={40} height={40} className="h-10 w-10 object-contain" />
    </div>
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

function TelegramBrandIcon() {
  return (
    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#229ED9] text-white shadow-[0_16px_38px_rgba(34,158,217,0.34)] ring-1 ring-white/20">
      <TelegramLogo className="h-7 w-7" />
    </div>
  );
}

function socialVisual(taskId: string): SocialVisual {
  switch (taskId) {
    case "follow-x":
      return {
        description: "Follow the official Velora AI account for public updates and ecosystem announcements.",
        accent: "",
        icon: <XLogoImage />
      };
    case "join-telegram":
      return {
        description: "Join the Velora Telegram community for product updates and builder conversations.",
        accent: "",
        icon: <TelegramBrandIcon />
      };
    case "like-content":
      return {
        description: "Open the Velora post on X, like the content, then verify the task manually.",
        accent: "",
        icon: <XLogoImage />
      };
    case "share-content":
      return {
        description: "Share or repost the Velora content on X, then return here to verify completion.",
        accent: "",
        icon: <XLogoImage />
      };
    default:
      return {
        description: "Complete this community task and verify it to claim XP.",
        accent: "from-emerald-500 to-yellow-400 text-slate-950",
        icon: <XLogoImage />
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
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);

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

  function claimEarlyPioneerBadge() {
    const result = rewards.claimEarlyPioneerBadge();
    if ("error" in result) {
      showError(result.error ?? "Badge claim failed.");
      return;
    }
    setToast("Early Velora Pioneer Badge Unlocked - You are among the first generation of Velora AI users.");
    setBadgeUnlocked(true);
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
        <AnimatePresence>
          {badgeUnlocked ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-xl"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-yellow-300/50 bg-slate-950 p-7 text-center shadow-[0_0_90px_rgba(234,179,8,0.22)] light:bg-white"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-300 to-transparent" />
                <VeloraPioneerBadgeVisual claimed ready />
                <h2 className="mt-6 text-2xl font-black text-white light:text-slate-950">Early Velora Pioneer Badge Unlocked</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400 light:text-slate-600">You are among the first generation of Velora AI users.</p>
                <button
                  type="button"
                  onClick={() => setBadgeUnlocked(false)}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 px-5 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(249,115,22,0.28)]"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <section className="relative overflow-hidden rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/14 via-white/[0.04] to-amber-400/12 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.26)] light:border-black light:bg-white light:from-orange-50 light:via-white light:to-amber-50 light:shadow-[0_24px_70px_rgba(15,23,42,0.1)]">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-orange-500/16 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-10 h-72 w-72 rounded-full bg-amber-300/14 blur-3xl" />
          <div className="relative grid gap-6 xl:grid-cols-[1fr_0.75fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/35 bg-orange-400/12 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-orange-200 light:text-orange-700">
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
              className="rounded-2xl border border-orange-400/25 bg-black/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] light:border-black light:bg-white/85 light:shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
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

        <div className="rounded-2xl bg-gradient-to-br from-orange-500/8 via-transparent to-amber-400/8 p-[1px] light:from-orange-100 light:via-white light:to-amber-100">
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
                  <div className="mt-2 flex justify-center"><XPRewardBadge amount={xp} /></div>
                    <p
                      className={cx(
                        "mt-3 text-xs font-black",
                        completed
                          ? "text-emerald-300 light:text-emerald-700"
                          : active
                            ? "text-amber-200 light:text-amber-700"
                            : "text-slate-400 light:text-slate-700"
                      )}
                    >
                      {completed ? "Completed" : active ? "Claim Available" : "Locked"}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-5 light:border-black light:bg-emerald-50">
              <Flame className="h-7 w-7 text-emerald-300 light:text-emerald-700" />
              <h3 className="mt-4 text-xl font-black text-white light:text-slate-950">Claim Daily Reward</h3>
              <div className="mt-3"><XPRewardBadge amount={rewards.dailyReward} /></div>
              <div className="mt-5">
                <RewardButton disabled={!rewards.canClaimDaily} onClick={() => notify(rewards.claimDaily())}>
                  {rewards.canClaimDaily ? "Claim Reward" : "Claimed Today"}
                </RewardButton>
              </div>
            </div>
          </div>
        </Panel>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-400/5 to-transparent p-[1px] shadow-[0_24px_70px_rgba(0,0,0,0.1)] light:from-orange-100 light:via-white light:to-amber-100">
        <Panel title="Social Tasks" eyebrow="Community actions">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {rewards.socialTasks.map((task) => {
              const visual = socialVisual(task.id);
              const status = task.completed ? "Completed" : task.opened ? "Pending Verification" : "Not Started";
              return (
                <motion.div
                  key={task.id}
                  whileHover={{ y: -5, scale: 1.01 }}
                  className="group relative overflow-hidden rounded-2xl border border-orange-400/18 bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-orange-400/[0.045] p-5 shadow-[0_22px_64px_rgba(0,0,0,0.24)] transition light:border-black light:bg-white light:from-white light:via-orange-50/45 light:to-amber-50/60 light:shadow-[0_22px_52px_rgba(15,23,42,0.12)]"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-300/80 to-transparent opacity-80" />
                  <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-orange-400/12 blur-2xl transition group-hover:bg-amber-400/18" />
                  <div className="absolute -bottom-20 left-6 h-28 w-28 rounded-full bg-amber-300/8 blur-2xl" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3">
                      <div className={cx("grid place-items-center rounded-xl", visual.accent)}>
                        {visual.icon}
                      </div>
                      <XPRewardBadge amount={task.reward} />
                    </div>
                    <h3 className="mt-6 text-base font-black text-white light:text-slate-950">{task.title}</h3>
                    <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-300 light:text-slate-700">{visual.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 light:border-black light:bg-slate-50">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 light:text-slate-600">Status</span>
                      <span
                        className={cx(
                          "rounded-full px-2.5 py-1 text-xs font-black",
                          task.completed
                            ? "border border-emerald-500/35 bg-emerald-500/12 text-emerald-300 light:text-emerald-700"
                            : task.opened
                              ? "border border-amber-500/40 bg-amber-500/14 text-amber-200 light:text-amber-700"
                              : "border border-slate-500/25 bg-white/[0.06] text-slate-300 light:bg-slate-100 light:text-slate-800"
                        )}
                      >
                        {task.completed ? (
                          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {status}</span>
                        ) : status}
                      </span>
                    </div>
                  </div>
                  {!task.completed ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {!task.opened ? (
                        <RewardButton
                          onClick={() => {
                            const result = rewards.openSocialTask(task.id);
                            if (result?.error) showError(result.error);
                          }}
                        >
                          Open Task
                        </RewardButton>
                      ) : (
                        <RewardButton
                          onClick={() => {
                            const result = rewards.verifySocialTask(task.id);
                            if ("error" in result) showError(result.error);
                            else notify(result);
                          }}
                        >
                          Verify Task
                        </RewardButton>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl bg-gradient-to-br from-orange-500/8 via-transparent to-amber-400/8 p-[1px] light:from-orange-100 light:via-white light:to-amber-100">
          <Panel title="Bridge Tasks" eyebrow="Milestones update from real bridge history">
            <div className="grid gap-4">
              {rewards.bridgeTasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
          </Panel>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-orange-500/8 via-transparent to-amber-400/8 p-[1px] light:from-orange-100 light:via-white light:to-amber-100">
          <Panel title="Swap Tasks" eyebrow="Milestones update from real swap history">
            <div className="grid gap-4">
              {rewards.swapTasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
          </Panel>
          </div>
        </div>

        <Panel title="Achievement Rewards" eyebrow="XP milestones and claimable ecosystem badges">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2 xl:col-span-2">
              <EarlyPioneerAchievementCard badge={rewards.earlyPioneerBadge} onClaim={claimEarlyPioneerBadge} />
            </div>
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
                  <div className="mt-3"><XPRewardBadge amount={achievement.reward} suffix="XP Bonus" /></div>
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
