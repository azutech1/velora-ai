export type AgentPaymentServiceStatus = "available" | "needs setup" | "disabled";

export type AgentPaymentService = {
  id: string;
  name: string;
  description: string;
  category: "data" | "risk" | "analytics" | "webhook";
  status: AgentPaymentServiceStatus;
  supportedRails: AgentPaymentRail[];
};

export type AgentPaymentRail = "x402 Payments" | "Circle Gateway" | "Arc Nanopayments" | "Agent-to-Agent Payments";

export type AgentPaymentRecord = {
  id: string;
  agentName: string;
  service: string;
  amount: string;
  status: "approval required" | "prepared" | "submitted" | "confirmed" | "failed";
  timestamp: string;
  txHash?: string;
};

export type AgentPaymentPolicy = {
  agentWalletBalance: string;
  dailySpendLimit: string;
  monthlySpendLimit: string;
  availableBudget: string;
  mode: "prepare-only";
};
