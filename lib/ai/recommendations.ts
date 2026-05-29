import type { ActivityRecord } from "@/lib/activity/types";
import type { AutomationRiskLevel } from "./automationRules";

export type AIRecommendationStatus = "recommendation" | "approval requested" | "approved" | "rejected" | "prepared";

export type AIRecommendation = {
  id: string;
  agentId: string;
  title: string;
  description: string;
  token?: string;
  network: string;
  riskLevel: AutomationRiskLevel;
  confidence: number;
  status: AIRecommendationStatus;
  actionLabel: string;
  createdAt: string;
  source: string;
  requiresApproval: true;
};

export type RecommendationInput = {
  walletConnected: boolean;
  activities: ActivityRecord[];
  selectedChain?: string;
  selectedToken?: string;
  quoteAvailable?: boolean;
};

export function generateAIRecommendations(input: RecommendationInput): AIRecommendation[] {
  const network = input.selectedChain ?? "Arc Testnet";
  const recentFailures = input.activities.filter((activity) => activity.status === "failed").length;
  const recentSwaps = input.activities.filter((activity) => activity.feature === "swap").length;
  const recommendations: AIRecommendation[] = [];

  if (!input.walletConnected) {
    return [
      {
        id: "connect-wallet-recommendation",
        agentId: "analytics-agent",
        title: "Connect wallet to activate AI insights",
        description: "Velora AI needs a connected wallet before it can summarize real activity or prepare approval requests.",
        network,
        riskLevel: "low",
        confidence: 96,
        status: "recommendation",
        actionLabel: "Connect wallet",
        createdAt: "Now",
        source: "Wallet state",
        requiresApproval: true
      }
    ];
  }

  if (input.quoteAvailable) {
    recommendations.push({
      id: "review-usdc-eurc-route",
      agentId: "routing-agent",
      title: "USDC to EURC route is available",
      description: "Routing Agent found a supported stablecoin route. Review the quote and wallet confirmation before execution.",
      token: input.selectedToken ?? "USDC",
      network,
      riskLevel: "low",
      confidence: 87,
      status: "approval requested",
      actionLabel: "Review quote",
      createdAt: "Now",
      source: "Quote state",
      requiresApproval: true
    });
  }

  if (recentFailures > 0) {
    recommendations.push({
      id: "wait-after-route-failure",
      agentId: "risk-agent",
      title: "Recent route failures detected",
      description: "Risk Agent recommends waiting or lowering amount before preparing another route.",
      network,
      riskLevel: "high",
      confidence: 91,
      status: "approval requested",
      actionLabel: "Review risk",
      createdAt: "Now",
      source: "Activity history",
      requiresApproval: true
    });
  }

  if (recentSwaps === 0) {
    recommendations.push({
      id: "start-with-small-stablecoin-route",
      agentId: "treasury-agent",
      title: "Start with a small stablecoin review",
      description: "Treasury Agent suggests testing a small USDC/EURC quote before creating larger automation policies.",
      token: "USDC",
      network,
      riskLevel: "low",
      confidence: 82,
      status: "recommendation",
      actionLabel: "Prepare review",
      createdAt: "Now",
      source: "Activity history",
      requiresApproval: true
    });
  }

  recommendations.push({
    id: "recurring-payment-ready",
    agentId: "payment-agent",
    title: "Recurring payment rule is ready for approval",
    description: "Payment Agent can prepare a reminder and transfer draft, but every payment still requires wallet approval.",
    token: "USDC",
    network,
    riskLevel: "low",
    confidence: 79,
    status: "approval requested",
    actionLabel: "Review rule",
    createdAt: "Now",
    source: "Automation policy",
    requiresApproval: true
  });

  return recommendations;
}

// Future integration points:
// - Enrich recommendation generation with a hosted reasoning API and signed wallet context.
// - Use blockchain indexers for balances, failed routes, and wallet risk signals.
// - Store recommendations and approval decisions in Supabase with user consent.
// - Feed approved recommendations into real transaction preparation only after policy checks pass.
