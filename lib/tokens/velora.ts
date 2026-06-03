import type { ActivityRecord } from "@/lib/activity/types";

export const VELORA_TOKEN = {
  name: "Velora Token",
  symbol: "To Be Announced",
  status: "In Development",
  purpose: "Designed as future ecosystem utility for Velora AI product access, participation, and community contribution tracking.",
  communityMessage:
    "Velora Token is not launched. Velora AI is building community-first participation systems before any token availability or launch decisions."
};

export const VELORA_BADGES = [
  { id: "explorer", name: "Explorer", detail: "Connect and use core Velora AI pages.", threshold: "Complete any Velora activity." },
  { id: "trader", name: "Trader", detail: "Use swap workflows.", threshold: "Complete 1 swap activity." },
  { id: "bridge-master", name: "Bridge Master", detail: "Use bridge workflows.", threshold: "Complete 1 bridge activity." },
  { id: "stablecoin-whale", name: "Stablecoin Whale", detail: "High stablecoin usage recognition.", threshold: "Reach 10 payment or swap actions." },
  { id: "automation-pioneer", name: "Automation Pioneer", detail: "Create or manage AI automation.", threshold: "Create 1 automation action." },
  { id: "agent-operator", name: "Agent Operator", detail: "Use Velora AI agents.", threshold: "Use 1 agent action." },
  { id: "payment-commander", name: "Payment Commander", detail: "Use stablecoin payments.", threshold: "Complete 1 payment activity." },
  { id: "velora-builder", name: "Velora Builder", detail: "Contribute to platform workflows.", threshold: "Complete 25 Velora actions." },
  { id: "arc-pioneer", name: "Arc Pioneer", detail: "Participate on Arc Testnet.", threshold: "Complete any Arc Testnet activity." }
] as const;

export type VeloraBadgeId = (typeof VELORA_BADGES)[number]["id"];

export type VeloraPointsSummary = {
  totalPoints: number;
  rank: string;
  earlyAdopterStatus: string;
  counts: {
    swaps: number;
    bridges: number;
    payments: number;
    automation: number;
    agentUsage: number;
    referrals: number;
    total: number;
  };
  badges: Array<(typeof VELORA_BADGES)[number] & { earned: boolean }>;
};

function isCompleted(record: ActivityRecord) {
  return record.status === "success";
}

export function calculateVeloraPoints(records: ActivityRecord[]): VeloraPointsSummary {
  const completed = records.filter(isCompleted);
  const swaps = completed.filter((record) => record.feature === "swap" || record.actionType.includes("swap")).length;
  const bridges = completed.filter((record) => record.feature === "bridge" || record.actionType.includes("bridge")).length;
  const payments = completed.filter((record) => record.feature === "send" || record.actionType.includes("payment")).length;
  const automation = completed.filter((record) => record.feature === "automation" || record.actionType.includes("automation") || record.actionType.includes("approval")).length;
  const agentUsage = completed.filter((record) => record.feature === "agent_payments" || record.actionType.includes("agent")).length;
  const referrals = completed.filter((record) => record.metadata?.source === "referral").length;
  const total = completed.length;

  const totalPoints = swaps * 20 + bridges * 30 + payments * 15 + automation * 25 + agentUsage * 25 + referrals * 40;
  const stablecoinActions = payments + swaps;
  const hasArcActivity = completed.some((record) => record.network?.includes("Arc") || record.metadata?.fromChain === "Arc Testnet" || record.metadata?.toChain === "Arc Testnet");
  const earned = new Set<VeloraBadgeId>();

  if (total > 0) earned.add("explorer");
  if (swaps > 0) earned.add("trader");
  if (bridges > 0) earned.add("bridge-master");
  if (stablecoinActions >= 10) earned.add("stablecoin-whale");
  if (automation > 0) earned.add("automation-pioneer");
  if (agentUsage > 0) earned.add("agent-operator");
  if (payments > 0) earned.add("payment-commander");
  if (total >= 25) earned.add("velora-builder");
  if (hasArcActivity) earned.add("arc-pioneer");

  return {
    totalPoints,
    rank: totalPoints >= 1000 ? "Core Contributor" : totalPoints >= 300 ? "Active Contributor" : totalPoints > 0 ? "Early Participant" : "Unranked",
    earlyAdopterStatus: total > 0 ? "Active" : "Not started",
    counts: { swaps, bridges, payments, automation, agentUsage, referrals, total },
    badges: VELORA_BADGES.map((badge) => ({ ...badge, earned: earned.has(badge.id) }))
  };
}
