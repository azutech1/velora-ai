"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import type { ActivityRecord } from "@/lib/activity/types";
import {
  ACHIEVEMENT_REWARDS,
  DAILY_REWARDS,
  SOCIAL_TASKS,
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
    return { ...defaultRewardsStore, ...(JSON.parse(raw) as Partial<RewardsStore>) };
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

  const completeSocialTask = useCallback(
    (taskId: string) => {
      if (!address || store.completedSocialTasks[taskId]) return null;
      const task = SOCIAL_TASKS.find((item) => item.id === taskId);
      if (!task) return null;
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
    [address, store]
  );

  const bridgeTasks = taskProgress.bridgeTasks.map((task) => ({ ...task, claimed: Boolean(store.claimedMilestones[task.id]) }));
  const swapTasks = taskProgress.swapTasks.map((task) => ({ ...task, claimed: Boolean(store.claimedMilestones[task.id]) }));
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
    achievements,
    socialTasks: SOCIAL_TASKS.map((task) => ({ ...task, completed: Boolean(store.completedSocialTasks[task.id]) })),
    lastReward,
    clearLastReward: () => setLastReward(null),
    claimDaily,
    completeSocialTask
  };
}
