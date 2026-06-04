import type { ActivityRecord } from "@/lib/activity/types";

export type RewardActivity = {
  id: string;
  title: string;
  amount: number;
  type: "daily" | "social" | "swap" | "bridge" | "achievement";
  timestamp: string;
};

export type RewardsStore = {
  xp: number;
  currentStreak: number;
  bestStreak: number;
  cycleDay: number;
  lastCheckinDate: string | null;
  openedSocialTasks: Record<string, boolean>;
  completedSocialTasks: Record<string, boolean>;
  claimedMilestones: Record<string, boolean>;
  claimedAchievements: Record<string, boolean>;
  recentActivity: RewardActivity[];
};

export type RewardTask = {
  id: string;
  title: string;
  reward: number;
  requirement: number;
  progress: number;
  unit: string;
  completed: boolean;
  claimed: boolean;
};

export const DAILY_REWARDS = [500, 1000, 1500, 2000, 2500, 3000, 5000];

export const SOCIAL_TASKS = [
  { id: "follow-x", title: "Follow Velora AI on X", reward: 1000, url: "https://x.com/UseVeloraAI" },
  { id: "join-telegram", title: "Join Velora Telegram", reward: 1000, url: "https://t.me/Useveloraai" },
  { id: "like-content", title: "Like Velora Content", reward: 500, url: "https://x.com/i/status/2059173987738145103" },
  { id: "share-content", title: "Share Velora Content", reward: 1000, url: "https://x.com/i/status/2059173987738145103" }
];

export const ACHIEVEMENT_REWARDS = [
  { id: "xp-10000", title: "Reach 10,000 XP", requirement: 10000, reward: 2000 },
  { id: "xp-50000", title: "Reach 50,000 XP", requirement: 50000, reward: 5000 },
  { id: "xp-100000", title: "Reach 100,000 XP", requirement: 100000, reward: 10000 },
  { id: "xp-500000", title: "Reach 500,000 XP", requirement: 500000, reward: 50000 }
];

export const defaultRewardsStore: RewardsStore = {
  xp: 0,
  currentStreak: 0,
  bestStreak: 0,
  cycleDay: 1,
  lastCheckinDate: null,
  openedSocialTasks: {},
  completedSocialTasks: {},
  claimedMilestones: {},
  claimedAchievements: {},
  recentActivity: []
};

export function rewardsStorageKey(address?: string) {
  return `velora:rewards:${address?.toLowerCase() ?? "guest"}`;
}

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function previousDateKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
}

export function levelFromXp(xp: number) {
  const levelSize = 10000;
  const level = Math.max(1, Math.floor(xp / levelSize) + 1);
  const currentLevelXp = (level - 1) * levelSize;
  const nextLevelXp = level * levelSize;
  const progress = Math.min(100, Math.round(((xp - currentLevelXp) / levelSize) * 100));
  return {
    level,
    nextLevel: level + 1,
    progress,
    remaining: Math.max(0, nextLevelXp - xp),
    currentLevelXp,
    nextLevelXp
  };
}

function numericAmount(record: ActivityRecord) {
  const raw =
    record.metadata?.fromAmount ??
    record.metadata?.amount ??
    record.metadata?.sellAmount ??
    record.metadata?.bridgeAmount ??
    record.amount ??
    "0";
  const normalized = String(raw).replace(/,/g, "").match(/[\d.]+/)?.[0] ?? "0";
  return Number(normalized) || 0;
}

function recordToken(record: ActivityRecord) {
  const token = record.metadata?.fromToken ?? record.metadata?.token ?? record.token ?? "";
  return String(token).toUpperCase();
}

function completed(records: ActivityRecord[]) {
  return records.filter((record) => record.status === "success");
}

export function buildRewardTaskProgress(records: ActivityRecord[]) {
  const done = completed(records);
  const swaps = done.filter((record) => record.feature === "swap" || record.actionType.includes("swap"));
  const bridges = done.filter((record) => record.feature === "bridge" || record.actionType.includes("bridge"));
  const usdcSwaps = swaps.filter((record) => recordToken(record).includes("USDC"));
  const usdcBridges = bridges.filter((record) => recordToken(record).includes("USDC"));
  const maxSwapUsdc = Math.max(0, ...usdcSwaps.map(numericAmount));
  const maxBridgeUsdc = Math.max(0, ...usdcBridges.map(numericAmount));

  const bridgeTasks: RewardTask[] = [
    { id: "bridge-first", title: "First Bridge", reward: 2000, requirement: 1, progress: bridges.length, unit: "Bridge", completed: bridges.length >= 1, claimed: false },
    { id: "bridge-10-usdc", title: "Bridge 10 USDC", reward: 500, requirement: 10, progress: maxBridgeUsdc, unit: "USDC", completed: maxBridgeUsdc >= 10, claimed: false },
    { id: "bridge-50-usdc", title: "Bridge 50 USDC", reward: 1500, requirement: 50, progress: maxBridgeUsdc, unit: "USDC", completed: maxBridgeUsdc >= 50, claimed: false },
    { id: "bridge-100-usdc", title: "Bridge 100 USDC", reward: 3000, requirement: 100, progress: maxBridgeUsdc, unit: "USDC", completed: maxBridgeUsdc >= 100, claimed: false },
    { id: "bridge-5", title: "Complete 5 Bridges", reward: 5000, requirement: 5, progress: bridges.length, unit: "Bridges", completed: bridges.length >= 5, claimed: false },
    { id: "bridge-10", title: "Complete 10 Bridges", reward: 10000, requirement: 10, progress: bridges.length, unit: "Bridges", completed: bridges.length >= 10, claimed: false }
  ];

  const swapTasks: RewardTask[] = [
    { id: "swap-first", title: "First Swap", reward: 2000, requirement: 1, progress: swaps.length, unit: "Swap", completed: swaps.length >= 1, claimed: false },
    { id: "swap-10-usdc", title: "Swap 10 USDC", reward: 500, requirement: 10, progress: maxSwapUsdc, unit: "USDC", completed: maxSwapUsdc >= 10, claimed: false },
    { id: "swap-50-usdc", title: "Swap 50 USDC", reward: 1500, requirement: 50, progress: maxSwapUsdc, unit: "USDC", completed: maxSwapUsdc >= 50, claimed: false },
    { id: "swap-100-usdc", title: "Swap 100 USDC", reward: 3000, requirement: 100, progress: maxSwapUsdc, unit: "USDC", completed: maxSwapUsdc >= 100, claimed: false },
    { id: "swap-5", title: "Complete 5 Swaps", reward: 5000, requirement: 5, progress: swaps.length, unit: "Swaps", completed: swaps.length >= 5, claimed: false },
    { id: "swap-10", title: "Complete 10 Swaps", reward: 10000, requirement: 10, progress: swaps.length, unit: "Swaps", completed: swaps.length >= 10, claimed: false }
  ];

  return { bridgeTasks, swapTasks };
}

export function progressPercent(progress: number, requirement: number) {
  return Math.min(100, Math.round((Math.min(progress, requirement) / Math.max(requirement, 1)) * 100));
}
