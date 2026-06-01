import type { ActivityRecord } from "@/lib/activity/types";

export type PioneerLevel = {
  level: number;
  name: string;
  minPoints: number;
  color: "bronze" | "silver" | "gold" | "platinum" | "diamond";
};

export type PioneerBadgeTier = "Pioneer" | "Operator" | "Builder" | "Architect" | "Network Elite" | "Genesis";

export type PioneerBadgeIcon = "compass" | "rocket" | "swap" | "bridge" | "agent" | "automation" | "whale" | "shield" | "builder" | "architect" | "strategist" | "diamond" | "genesis";

export type PioneerBadge = {
  id: string;
  name: string;
  tier: PioneerBadgeTier;
  icon: PioneerBadgeIcon;
  detail: string;
  earned: boolean;
  status: "Unlocked" | "In Progress" | "Locked";
  currentProgress: string;
  nextRequirement: string;
  completionPercentage: number;
};

export type AchievementProgress = {
  id: string;
  title: string;
  currentBadge: string;
  currentProgress: string;
  nextBadge: string;
  requirement: string;
  remaining: string;
  progress: number;
};

export const CHECKIN_REWARDS = [10, 15, 20, 25, 30, 40, 50];

export const POINT_RULES = [
  { label: "Connect Wallet", points: 10 },
  { label: "Swap", points: 25 },
  { label: "Bridge", points: 40 },
  { label: "AI Agent Action", points: 30 },
  { label: "AI Automation", points: 50 },
  { label: "Agent Payment", points: 60 },
  { label: "Feedback Submission", points: 25 },
  { label: "Bug Report", points: 50 }
];

export const PIONEER_LEVELS: PioneerLevel[] = [
  { level: 1, name: "Explorer", minPoints: 0, color: "bronze" },
  { level: 2, name: "Pioneer", minPoints: 100, color: "silver" },
  { level: 3, name: "Operator", minPoints: 300, color: "gold" },
  { level: 4, name: "Builder", minPoints: 700, color: "platinum" },
  { level: 5, name: "Architect", minPoints: 1200, color: "diamond" },
  { level: 6, name: "Strategist", minPoints: 2000, color: "diamond" },
  { level: 7, name: "Network Elite", minPoints: 3500, color: "diamond" }
];

export const STREAK_BADGES = [
  { id: "flame-starter", name: "Flame Starter", days: 3 },
  { id: "consistent-user", name: "Consistent User", days: 7 },
  { id: "dedicated-pioneer", name: "Dedicated Pioneer", days: 30 },
  { id: "velora-loyalist", name: "Velora Loyalist", days: 90 },
  { id: "genesis-veteran", name: "Genesis Veteran", days: 180 }
];

const BASE_BADGES = [
  ["explorer", "Explorer", "Pioneer", "compass", "Started using Velora Network."],
  ["pioneer", "Pioneer", "Pioneer", "rocket", "Joined Velora Pioneers."],
  ["trader", "Trader", "Operator", "swap", "Completed swap activity."],
  ["bridge-master", "Bridge Master", "Operator", "bridge", "Completed bridge activity."],
  ["agent-operator", "Agent Operator", "Builder", "agent", "Used AI agent workflows."],
  ["automation-pioneer", "Automation Pioneer", "Builder", "automation", "Used AI automation workflows."],
  ["stablecoin-whale", "Stablecoin Whale", "Builder", "whale", "Built strong stablecoin activity."],
  ["guardian", "Guardian", "Operator", "shield", "Maintained approval-first security activity."],
  ["builder", "Builder", "Builder", "builder", "Reached Builder level."],
  ["architect", "Architect", "Architect", "architect", "Reached Architect level."],
  ["strategist", "Strategist", "Architect", "strategist", "Reached Strategist level."],
  ["network-elite", "Network Elite", "Network Elite", "diamond", "Reached Network Elite level."],
  ["genesis-pioneer", "Genesis Pioneer", "Genesis", "genesis", "Earned early adopter recognition."]
] as const;

const ACHIEVEMENT_TRACKS = [
  {
    id: "community",
    title: "Community Progress",
    unit: "Points",
    currentValue: (counts: ReturnType<typeof buildCounts>, totalPoints: number) => totalPoints,
    milestones: [
      { badge: "Explorer", requirement: 100 },
      { badge: "Pioneer", requirement: 300 },
      { badge: "Operator", requirement: 700 },
      { badge: "Builder", requirement: 1200 },
      { badge: "Architect", requirement: 2000 },
      { badge: "Network Elite", requirement: 3500 }
    ]
  },
  {
    id: "swap",
    title: "Swap Progress",
    unit: "Swaps",
    currentValue: (counts: ReturnType<typeof buildCounts>) => counts.swaps,
    milestones: [
      { badge: "Swap Explorer", requirement: 10 },
      { badge: "Swap Expert", requirement: 50 },
      { badge: "Swap Strategist", requirement: 100 }
    ]
  },
  {
    id: "bridge",
    title: "Bridge Progress",
    unit: "Bridges",
    currentValue: (counts: ReturnType<typeof buildCounts>) => counts.bridges,
    milestones: [
      { badge: "Bridge Explorer", requirement: 10 },
      { badge: "Bridge Expert", requirement: 50 },
      { badge: "Bridge Strategist", requirement: 100 }
    ]
  },
  {
    id: "agent",
    title: "AI Agent Progress",
    unit: "Agent Actions",
    currentValue: (counts: ReturnType<typeof buildCounts>) => counts.agentUsage,
    milestones: [
      { badge: "Agent Starter", requirement: 5 },
      { badge: "Agent Operator", requirement: 10 },
      { badge: "Agent Strategist", requirement: 50 }
    ]
  },
  {
    id: "automation",
    title: "Automation Progress",
    unit: "Automations",
    currentValue: (counts: ReturnType<typeof buildCounts>) => counts.automation,
    milestones: [
      { badge: "Automation Starter", requirement: 2 },
      { badge: "Automation Pioneer", requirement: 5 },
      { badge: "Automation Architect", requirement: 25 }
    ]
  },
  {
    id: "payment",
    title: "Payment Progress",
    unit: "Payments",
    currentValue: (counts: ReturnType<typeof buildCounts>) => counts.payments,
    milestones: [
      { badge: "Payment Starter", requirement: 3 },
      { badge: "Payment Operator", requirement: 10 },
      { badge: "Payment Commander", requirement: 50 }
    ]
  },
  {
    id: "early-adopter",
    title: "Early Adopter Progress",
    unit: "Check-Ins",
    currentValue: (counts: ReturnType<typeof buildCounts>) => counts.checkins,
    milestones: [
      { badge: "Genesis Watchlist", requirement: 1 },
      { badge: "Genesis Pioneer", requirement: 7 },
      { badge: "Genesis Veteran", requirement: 30 }
    ]
  }
];

function completed(records: ActivityRecord[]) {
  return records.filter((record) => record.status === "success");
}

function countBy(records: ActivityRecord[], predicate: (record: ActivityRecord) => boolean) {
  return records.filter(predicate).length;
}

function buildCounts(done: ActivityRecord[]) {
  const swaps = countBy(done, (record) => record.feature === "swap" || record.actionType.includes("swap"));
  const bridges = countBy(done, (record) => record.feature === "bridge" || record.actionType.includes("bridge"));
  const payments = countBy(done, (record) => record.feature === "send" || record.actionType.includes("payment"));
  const automation = countBy(done, (record) => record.feature === "automation" || record.actionType.includes("automation") || record.actionType.includes("approval"));
  const agentUsage = countBy(done, (record) => record.feature === "agent_payments" || record.actionType.includes("agent"));
  const feedback = countBy(done, (record) => record.actionType.includes("feedback"));
  const bugs = countBy(done, (record) => record.actionType.includes("bug"));
  const checkins = countBy(done, (record) => record.actionType === "pioneer_checkin_claimed");
  return { swaps, bridges, payments, automation, agentUsage, feedback, bugs, checkins, total: done.length };
}

function buildProgress(title: string, unit: string, value: number, milestones: Array<{ badge: string; requirement: number }>): AchievementProgress {
  const currentMilestone = [...milestones].reverse().find((milestone) => value >= milestone.requirement);
  const nextMilestone = milestones.find((milestone) => value < milestone.requirement);
  const firstMilestone = milestones[0];
  const currentBadge = currentMilestone?.badge ?? firstMilestone.badge.replace(/ Expert| Strategist| Operator| Pioneer| Architect| Commander| Veteran| Watchlist/, " Starter");
  const nextBadge = nextMilestone?.badge ?? "Completed";
  const requirement = nextMilestone?.requirement ?? milestones.at(-1)?.requirement ?? 0;
  const previousRequirement = currentMilestone?.requirement ?? 0;
  const denominator = Math.max(requirement - previousRequirement, requirement, 1);
  const progressBase = nextMilestone ? Math.max(0, value - previousRequirement) : denominator;
  const progress = nextMilestone ? Math.min(100, Math.round((progressBase / denominator) * 100)) : 100;
  const remaining = Math.max(0, requirement - value);

  return {
    id: title.toLowerCase().replaceAll(" ", "-"),
    title,
    currentBadge,
    currentProgress: `${value.toLocaleString()} ${unit}`,
    nextBadge,
    requirement: nextMilestone ? `${requirement.toLocaleString()} ${unit}` : "Complete",
    remaining: nextMilestone ? `${remaining.toLocaleString()} ${unit} Needed` : "Complete",
    progress
  };
}

export function calculatePioneerSummary(records: ActivityRecord[], streak: { currentStreak: number; bestStreak: number }) {
  const done = completed(records);
  const counts = buildCounts(done);
  const connected = records.some((record) => record.actionType === "wallet_connect" || record.walletAddress !== "guest") ? 1 : 0;

  const totalPoints =
    connected * 10 +
    counts.swaps * 25 +
    counts.bridges * 40 +
    counts.payments * 60 +
    counts.automation * 50 +
    counts.agentUsage * 30 +
    counts.feedback * 25 +
    counts.bugs * 50 +
    done.filter((record) => record.actionType === "pioneer_checkin_claimed").reduce((sum, record) => sum + Number(record.metadata?.points ?? 0), 0);

  const level = [...PIONEER_LEVELS].reverse().find((item) => totalPoints >= item.minPoints) ?? PIONEER_LEVELS[0];
  const nextLevel = PIONEER_LEVELS.find((item) => item.minPoints > totalPoints) ?? null;
  const progress = nextLevel ? Math.min(100, Math.round(((totalPoints - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100)) : 100;
  const reputation = totalPoints * 4 + streak.bestStreak * 25 + streak.currentStreak * 15 + done.length * 20;
  const achievementProgress = ACHIEVEMENT_TRACKS.map((track) => buildProgress(track.title, track.unit, track.currentValue(counts, totalPoints), track.milestones));
  const nextAchievement = achievementProgress.find((item) => item.progress < 100) ?? achievementProgress[0];
  const nextReputationMilestone = reputation < 10000 ? 10000 : reputation < 25000 ? 25000 : reputation < 50000 ? 50000 : 100000;
  const reputationProgress = Math.min(100, Math.round((reputation / nextReputationMilestone) * 100));

  const earned = new Set<string>(["pioneer"]);
  if (done.length > 0) earned.add("explorer");
  if (counts.swaps > 0) earned.add("trader");
  if (counts.bridges > 0) earned.add("bridge-master");
  if (counts.agentUsage > 0) earned.add("agent-operator");
  if (counts.automation > 0) earned.add("automation-pioneer");
  if (counts.swaps + counts.payments >= 10) earned.add("stablecoin-whale");
  if (counts.automation + counts.agentUsage + counts.payments > 0) earned.add("guardian");
  if (level.level >= 4) earned.add("builder");
  if (level.level >= 5) earned.add("architect");
  if (level.level >= 6) earned.add("strategist");
  if (level.level >= 7) earned.add("network-elite");
  if (counts.checkins > 0 || done.length > 0) earned.add("genesis-pioneer");

  const badges = BASE_BADGES.map(([id, name, tier, icon, detail]) => ({
    id,
    name,
    tier,
    icon,
    detail,
    earned: earned.has(id),
    status: earned.has(id) ? "Unlocked" : done.length > 0 ? "In Progress" : "Locked",
    currentProgress: `${done.length.toLocaleString()} Activities`,
    nextRequirement: detail,
    completionPercentage: earned.has(id) ? 100 : Math.min(95, done.length * 10)
  })) as PioneerBadge[];

  return {
    totalPoints,
    level,
    nextLevel,
    progress,
    reputation,
    nextReputationMilestone,
    reputationRemaining: Math.max(0, nextReputationMilestone - reputation),
    reputationProgress,
    percentile: reputation >= 8500 ? "Top 5%" : reputation >= 4000 ? "Top 15%" : reputation > 0 ? "Rising" : "--",
    earlyAdopterStatus: done.length || counts.checkins ? "Active Pioneer" : "Not started",
    counts,
    achievementProgress,
    nextAchievement,
    badges,
    badgeCompletion: Math.round((badges.filter((badge) => badge.earned).length / badges.length) * 100),
    streakBadges: STREAK_BADGES.map((badge) => ({ ...badge, earned: streak.bestStreak >= badge.days }))
  };
}

export function nextCheckinPoints(currentStreak: number) {
  return CHECKIN_REWARDS[currentStreak % CHECKIN_REWARDS.length];
}

export function buildPioneerLeaderboards(records: ActivityRecord[]) {
  const wallets = new Map<string, ActivityRecord[]>();
  records.forEach((record) => {
    if (!record.walletAddress || record.walletAddress === "guest") return;
    const key = record.walletAddress.toLowerCase();
    wallets.set(key, [...(wallets.get(key) ?? []), record]);
  });

  const rows = Array.from(wallets.entries()).map(([wallet, walletRecords]) => {
    const summary = calculatePioneerSummary(walletRecords, { currentStreak: 0, bestStreak: 0 });
    return { wallet, summary };
  });

  const top = (selector: (row: (typeof rows)[number]) => number) =>
    [...rows].sort((a, b) => selector(b) - selector(a)).slice(0, 5);

  return {
    pioneers: top((row) => row.summary.totalPoints),
    traders: top((row) => row.summary.counts.swaps),
    bridges: top((row) => row.summary.counts.bridges),
    automation: top((row) => row.summary.counts.automation),
    agents: top((row) => row.summary.counts.agentUsage),
    reputation: top((row) => row.summary.reputation)
  };
}
