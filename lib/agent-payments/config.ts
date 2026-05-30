import type { AgentPaymentPolicy, AgentPaymentRail, AgentPaymentRecord, AgentPaymentService } from "./types";

export const agentPaymentPolicy: AgentPaymentPolicy = {
  agentWalletBalance: "--",
  dailySpendLimit: "Not configured",
  monthlySpendLimit: "Not configured",
  availableBudget: "--",
  mode: "prepare-only"
};

export const agentPaymentRails: AgentPaymentRail[] = [
  "x402 Payments",
  "Circle Gateway",
  "Arc Nanopayments",
  "Agent-to-Agent Payments"
];

export const agentPaymentServices: AgentPaymentService[] = [
  {
    id: "market-data-api",
    name: "Market Data API",
    description: "Price, liquidity, and route data access for approved agent workflows.",
    category: "data",
    status: "needs setup",
    supportedRails: ["x402 Payments", "Circle Gateway", "Arc Nanopayments"]
  },
  {
    id: "risk-oracle",
    name: "Risk Oracle",
    description: "Policy checks for slippage, service spend, counterparty risk, and route health.",
    category: "risk",
    status: "needs setup",
    supportedRails: ["x402 Payments", "Arc Nanopayments"]
  },
  {
    id: "analytics-provider",
    name: "Analytics Provider",
    description: "Usage, payments, and wallet activity analytics for agent decisions.",
    category: "analytics",
    status: "needs setup",
    supportedRails: ["Circle Gateway", "Arc Nanopayments"]
  },
  {
    id: "webhook-service",
    name: "Webhook Service",
    description: "Event delivery for payment confirmations, approvals, and service callbacks.",
    category: "webhook",
    status: "needs setup",
    supportedRails: ["x402 Payments", "Agent-to-Agent Payments"]
  }
];

export const agentPaymentHistory: AgentPaymentRecord[] = [];
