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

function completed(records: ActivityRecord[]) {
  return records.filter((record) => record.status === "success");
}

function countBy(records: ActivityRecord[], predicate: (record: ActivityRecord) => boolean) {
  return records.filter(predicate).length;
}

export function calculatePioneerSummary(records: ActivityRecord[], streak: { currentStreak: number; bestStreak: number }) {
  const done = completed(records);
  const swaps = countBy(done, (record) => record.feature === "swap" || record.actionType.includes("swap"));
  const bridges = countBy(done, (record) => record.feature === "bridge" || record.actionType.includes("bridge"));
  const payments = countBy(done, (record) => record.feature === "send" || record.actionType.includes("payment"));
  const automation = countBy(done, (record) => record.feature === "automation" || record.actionType.includes("automation") || record.actionType.includes("approval"));
  const agentUsage = countBy(done, (record) => record.feature === "agent_payments" || record.actionType.includes("agent"));
  const feedback = countBy(done, (record) => record.actionType.includes("feedback"));
  const bugs = countBy(done, (record) => record.actionType.includes("bug"));
  const checkins = countBy(done, (record) => record.actionType === "pioneer_checkin_claimed");
  const connected = records.some((record) => record.actionType === "wallet_connect" || record.walletAddress !== "guest") ? 1 : 0;

  const totalPoints =
    connected * 10 +
    swaps * 25 +
    bridges * 40 +
    payments * 60 +
    automation * 50 +
    agentUsage * 30 +
    feedback * 25 +
    bugs * 50 +
    done.filter((record) => record.actionType === "pioneer_checkin_claimed").reduce((sum, record) => sum + Number(record.metadata?.points ?? 0), 0);

  const level = [...PIONEER_LEVELS].reverse().find((item) => totalPoints >= item.minPoints) ?? PIONEER_LEVELS[0];
  const nextLevel = PIONEER_LEVELS.find((item) => item.minPoints > totalPoints) ?? null;
  const progress = nextLevel ? Math.min(100, Math.round(((totalPoints - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100)) : 100;
  const reputation = totalPoints * 4 + streak.bestStreak * 25 + streak.currentStreak * 15 + done.length * 20;

  const earned = new Set<string>(["pioneer"]);
  if (done.length > 0) earned.add("explorer");
  if (swaps > 0) earned.add("trader");
  if (bridges > 0) earned.add("bridge-master");
  if (agentUsage > 0) earned.add("agent-operator");
  if (automation > 0) earned.add("automation-pioneer");
  if (swaps + payments >= 10) earned.add("stablecoin-whale");
  if (automation + agentUsage + payments > 0) earned.add("guardian");
  if (level.level >= 4) earned.add("builder");
  if (level.level >= 5) earned.add("architect");
  if (level.level >= 6) earned.add("strategist");
  if (level.level >= 7) earned.add("network-elite");
  if (checkins > 0 || done.length > 0) earned.add("genesis-pioneer");

  const badges = BASE_BADGES.map(([id, name, tier, icon, detail]) => ({
    id,
    name,
    tier,
    icon,
    detail,
    earned: earned.has(id)
  })) as PioneerBadge[];

  return {
    totalPoints,
    level,
    nextLevel,
    progress,
    reputation,
    percentile: reputation >= 8500 ? "Top 5%" : reputation >= 4000 ? "Top 15%" : reputation > 0 ? "Rising" : "--",
    earlyAdopterStatus: done.length || checkins ? "Active Pioneer" : "Not started",
    counts: { swaps, bridges, payments, automation, agentUsage, feedback, bugs, checkins, total: done.length },
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
