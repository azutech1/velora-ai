export const AI_AUTOMATION_STATUS = {
  enabled: false,
  mode: "prepare-only",
  description: "Future AI automation orchestration for payments, policies, and agent marketplace workflows."
} as const;

// Future MCP integration: connect Codex/agent tools here for policy-aware automation,
// payment intent generation, spend-limit reasoning, and approval workflows.
export type AIAutomationIntent = {
  id: string;
  title: string;
  riskLevel: "low" | "medium" | "high";
  requiresApproval: boolean;
};

export const AI_AUTOMATION_INTENTS: AIAutomationIntent[] = [
  { id: "pay-api-invoice", title: "Pay verified API invoice", riskLevel: "low", requiresApproval: false },
  { id: "new-recipient", title: "Approve new recipient wallet", riskLevel: "medium", requiresApproval: true },
  { id: "large-transfer", title: "Review large USDC transfer", riskLevel: "high", requiresApproval: true }
];
