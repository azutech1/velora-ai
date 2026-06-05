"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import type { ActivityRecord } from "@/lib/activity/types";
import {
  ACHIEVEMENT_REWARDS,
  DAILY_REWARDS,
  SOCIAL_TASKS,
  buildEarlyVeloraPioneerProgress,
  buildRewardTaskProgress,
  defaultRewardsStore,
  levelFromXp,
  localDateKey,
  previousDateKey,
  rewardsStorageKey,
  type RewardActivity,
  type RewardsStore
} from "@/lib/rewards/system";

function createRewardActivity(title: string, amount: number, type: RewardActivity["type"]): RewardActivity {
  return {
    id: `reward_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    title,
    amount,
    type,
    timestamp: new Date().toISOString()
  };
}

function mergeStore(raw: string | null): RewardsStore {
  if (!raw) return defaultRewardsStore;
  try {
    const parsed = JSON.parse(raw) as Partial<RewardsStore>;
    return {
      ...defaultRewardsStore,
      ...parsed,
      openedSocialTasks: { ...defaultRewardsStore.openedSocialTasks, ...parsed.openedSocialTasks },
      completedSocialTasks: { ...defaultRewardsStore.completedSocialTasks, ...parsed.completedSocialTasks },
      claimedMilestones: { ...defaultRewardsStore.claimedMilestones, ...parsed.claimedMilestones },
      claimedAchievements: { ...defaultRewardsStore.claimedAchievements, ...parsed.claimedAchievements },
      claimedBadges: { ...defaultRewardsStore.claimedBadges, ...parsed.claimedBadges },
      claimedBadgeTimestamps: { ...defaultRewardsStore.claimedBadgeTimestamps, ...parsed.claimedBadgeTimestamps },
      recentActivity: parsed.recentActivity ?? defaultRewardsStore.recentActivity
    };
  } catch {
    return defaultRewardsStore;
  }
}

function persist(address: string, nextStore: RewardsStore) {
  window.localStorage.setItem(rewardsStorageKey(address), JSON.stringify(nextStore));
}

function withReward(store: RewardsStore, title: string, amount: number, type: RewardActivity["type"]): RewardsStore {
  return {
    ...store,
    xp: store.xp + amount,
    recentActivity: [createRewardActivity(title, amount, type), ...store.recentActivity].slice(0, 20)
  };
}

export function useRewardsCenter(records: ActivityRecord[]) {
  const { address, isConnected } = useAccount();
  const [store, setStore] = useState<RewardsStore>(defaultRewardsStore);
  const [lastReward, setLastReward] = useState<RewardActivity | null>(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setStore(defaultRewardsStore);
      return;
    }
    setStore(mergeStore(window.localStorage.getItem(rewardsStorageKey(address))));
  }, [address, isConnected]);

  const taskProgress = useMemo(() => buildRewardTaskProgress(records), [records]);

  useEffect(() => {
    if (!isConnected || !address) return;
    setStore((current) => {
      let next = current;
      const allTasks = [...taskProgress.bridgeTasks, ...taskProgress.swapTasks];
      for (const task of allTasks) {
        if (task.completed && !next.claimedMilestones[task.id]) {
          next = {
            ...withReward(next, task.title, task.reward, task.id.startsWith("bridge") ? "bridge" : "swap"),
            claimedMilestones: { ...next.claimedMilestones, [task.id]: true }
          };
        }
      }

      for (const achievement of ACHIEVEMENT_REWARDS) {
        if (next.xp >= achievement.requirement && !next.claimedAchievements[achievement.id]) {
          next = {
            ...withReward(next, achievement.title, achievement.reward, "achievement"),
            claimedAchievements: { ...next.claimedAchievements, [achievement.id]: true }
          };
        }
      }

      if (next !== current) persist(address, next);
      return next;
    });
  }, [address, isConnected, taskProgress.bridgeTasks, taskProgress.swapTasks]);

  const canClaimDaily = Boolean(isConnected && address && store.lastCheckinDate !== localDateKey());
  const dailyReward = DAILY_REWARDS[store.cycleDay - 1] ?? DAILY_REWARDS[0];

  const claimDaily = useCallback(() => {
    if (!address || !canClaimDaily) return null;
    const continued = store.lastCheckinDate === previousDateKey();
    const currentStreak = continued ? store.currentStreak + 1 : 1;
    const nextCycleDay = store.cycleDay >= 7 ? 1 : store.cycleDay + 1;
    const reward = createRewardActivity("Daily Check-in", dailyReward, "daily");
    const nextStore: RewardsStore = {
      ...store,
      xp: store.xp + dailyReward,
      currentStreak,
      bestStreak: Math.max(store.bestStreak, currentStreak),
      cycleDay: nextCycleDay,
      lastCheckinDate: localDateKey(),
      recentActivity: [reward, ...store.recentActivity].slice(0, 20)
    };
    persist(address, nextStore);
    setStore(nextStore);
    setLastReward(reward);
    return reward;
  }, [address, canClaimDaily, dailyReward, store]);

  const openSocialTask = useCallback(
    (taskId: string) => {
      if (!address || !isConnected) return { error: "Connect wallet to start this task." };
      const task = SOCIAL_TASKS.find((item) => item.id === taskId);
      if (!task) return { error: "Task is not available." };
      if (store.completedSocialTasks[taskId]) return { error: "Task already completed." };
      window.open(task.url, "_blank", "noopener,noreferrer");
      const nextStore: RewardsStore = {
        ...store,
        openedSocialTasks: { ...store.openedSocialTasks, [task.id]: true }
      };
      persist(address, nextStore);
      setStore(nextStore);
      return { opened: true, title: task.title };
    },
    [address, isConnected, store]
  );

  const verifySocialTask = useCallback(
    (taskId: string) => {
      if (!address || !isConnected) return { error: "Connect wallet to verify this task." };
      const task = SOCIAL_TASKS.find((item) => item.id === taskId);
      if (!task) return { error: "Task is not available." };
      if (store.completedSocialTasks[taskId]) return { error: "Task already completed." };
      if (!store.openedSocialTasks[taskId]) return { error: "Open the task before verification." };
      const reward = createRewardActivity(task.title, task.reward, "social");
      const nextStore: RewardsStore = {
        ...store,
        xp: store.xp + task.reward,
        completedSocialTasks: { ...store.completedSocialTasks, [task.id]: true },
        recentActivity: [reward, ...store.recentActivity].slice(0, 20)
      };
      persist(address, nextStore);
      setStore(nextStore);
      setLastReward(reward);
      return reward;
    },
    [address, isConnected, store]
  );

  const bridgeTasks = taskProgress.bridgeTasks.map((task) => ({ ...task, claimed: Boolean(store.claimedMilestones[task.id]) }));
  const swapTasks = taskProgress.swapTasks.map((task) => ({ ...task, claimed: Boolean(store.claimedMilestones[task.id]) }));
  const earlyPioneerBadge = buildEarlyVeloraPioneerProgress({
    connected: Boolean(isConnected && address),
    records,
    bestStreak: store.bestStreak,
    completedSocialTasks: store.completedSocialTasks,
    claimedBadges: store.claimedBadges,
    claimedBadgeTimestamps: store.claimedBadgeTimestamps
  });
  const claimEarlyPioneerBadge = useCallback(() => {
    if (!address || !isConnected) return { error: "Connect wallet to claim this badge." };
    const progress = buildEarlyVeloraPioneerProgress({
      connected: true,
      records,
      bestStreak: store.bestStreak,
      completedSocialTasks: store.completedSocialTasks,
      claimedBadges: store.claimedBadges,
      claimedBadgeTimestamps: store.claimedBadgeTimestamps
    });
    if (progress.claimed) return { error: "Badge already claimed." };
    if (!progress.readyToClaim) return { error: "Complete all badge requirements before claiming." };
    const claimedAt = new Date().toISOString();
    const nextStore: RewardsStore = {
      ...store,
      claimedBadges: { ...store.claimedBadges, [progress.id]: true },
      claimedBadgeTimestamps: { ...store.claimedBadgeTimestamps, [progress.id]: claimedAt }
    };
    persist(address, nextStore);
    setStore(nextStore);
    return {
      title: "Early Velora Pioneer Badge Claimed",
      message: "You are among the first generation of Velora AI users.",
      claimedAt
    };
  }, [address, isConnected, records, store]);
  const level = levelFromXp(store.xp);
  const achievements = ACHIEVEMENT_REWARDS.map((achievement) => ({
    ...achievement,
    unlocked: Boolean(store.claimedAchievements[achievement.id]) || store.xp >= achievement.requirement,
    claimed: Boolean(store.claimedAchievements[achievement.id]),
    progress: Math.min(store.xp, achievement.requirement)
  }));

  return {
    ...store,
    isConnected,
    canClaimDaily,
    dailyReward,
    level,
    bridgeTasks,
    swapTasks,
    earlyPioneerBadge,
    achievements,
    socialTasks: SOCIAL_TASKS.map((task) => ({
      ...task,
      opened: Boolean(store.openedSocialTasks[task.id]),
      completed: Boolean(store.completedSocialTasks[task.id])
    })),
    lastReward,
    clearLastReward: () => setLastReward(null),
    claimDaily,
    openSocialTask,
    verifySocialTask,
    claimEarlyPioneerBadge
  };
}
