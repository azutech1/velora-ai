export type AutomationStatus = "active" | "paused" | "pending approval";
export type AutomationRiskLevel = "low" | "medium" | "high";
export type AutomationLogStatus = "info" | "pending" | "success" | "failed";

export type AutomationRule = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: AutomationStatus;
  riskLevel: AutomationRiskLevel;
  lastRun: string;
  nextCheck: string;
  enabled: boolean;
  approvalsPending: number;
  allowedTokens: string[];
  allowedChains: string[];
  maxTransactionAmount: string;
  dailySpendLimit: string;
  requireManualApproval: boolean;
};

export type AutomationLog = {
  id: string;
  ruleId: string;
  event: string;
  detail: string;
  resultStatus?: string;
  status: AutomationLogStatus;
  timestamp: string;
};

export type RuleBuilderCondition =
  | "token_balance"
  | "gas_fee"
  | "stablecoin_price"
  | "chain_change"
  | "schedule_time";

export type RuleBuilderAction =
  | "prepare_swap_quote"
  | "prepare_bridge_quote"
  | "create_payment_reminder"
  | "recommend_rebalance"
  | "pause_risky_route";

export type ApprovalRequest = {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  riskLevel: AutomationRiskLevel;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
};

export const ruleBuilderConditions: Array<{ id: RuleBuilderCondition; label: string }> = [
  { id: "token_balance", label: "Token balance above/below amount" },
  { id: "gas_fee", label: "Gas fee above threshold" },
  { id: "stablecoin_price", label: "Stablecoin price changes" },
  { id: "chain_change", label: "Selected chain changes" },
  { id: "schedule_time", label: "Schedule time" }
];

export const ruleBuilderActions: Array<{ id: RuleBuilderAction; label: string }> = [
  { id: "prepare_swap_quote", label: "Prepare swap quote" },
  { id: "prepare_bridge_quote", label: "Prepare bridge quote" },
  { id: "create_payment_reminder", label: "Create payment reminder" },
  { id: "recommend_rebalance", label: "Create treasury rebalance recommendation" },
  { id: "pause_risky_route", label: "Pause risky route" }
];

export const automationSafetyDefaults = {
  allowedTokens: ["USDC", "EURC", "USDT"],
  allowedChains: ["Arc Testnet", "Ethereum Sepolia", "Base Sepolia", "Optimism Sepolia", "Arbitrum Sepolia"],
  maxTransactionAmount: "250 USDC",
  dailySpendLimit: "500 USDC",
  requireManualApproval: true
};

export const initialAutomationRules: AutomationRule[] = [
  {
    id: "auto-bridge-gas",
    name: "Auto Bridge USDC when gas is cheaper",
    trigger: "Arc gas estimate falls below the user threshold",
    action: "Prepare a USDC bridge quote for review",
    status: "paused",
    riskLevel: "medium",
    lastRun: "No live run yet",
    nextCheck: "Every 30 minutes",
    enabled: false,
    approvalsPending: 0,
    allowedTokens: ["USDC"],
    allowedChains: ["Arc Testnet", "Base Sepolia"],
    maxTransactionAmount: "100 USDC",
    dailySpendLimit: "250 USDC",
    requireManualApproval: true
  },
  {
    id: "rebalance-treasury",
    name: "Rebalance treasury between USDC, EURC, USDT",
    trigger: "Stablecoin allocation drifts beyond policy limits",
    action: "Create a rebalance recommendation",
    status: "pending approval",
    riskLevel: "medium",
    lastRun: "Awaiting first approval",
    nextCheck: "Daily at 09:00",
    enabled: true,
    approvalsPending: 1,
    allowedTokens: ["USDC", "EURC", "USDT"],
    allowedChains: ["Arc Testnet"],
    maxTransactionAmount: "500 USDC",
    dailySpendLimit: "1,000 USDC",
    requireManualApproval: true
  },
  {
    id: "recurring-payment",
    name: "Recurring stablecoin payment",
    trigger: "Scheduled payment date arrives",
    action: "Prepare a USDC payment for approval",
    status: "active",
    riskLevel: "low",
    lastRun: "No payment prepared yet",
    nextCheck: "Monthly on day 1",
    enabled: true,
    approvalsPending: 0,
    allowedTokens: ["USDC"],
    allowedChains: ["Arc Testnet"],
    maxTransactionAmount: "50 USDC",
    dailySpendLimit: "100 USDC",
    requireManualApproval: true
  },
  {
    id: "eurc-rate",
    name: "Swap EURC to USDC when rate improves",
    trigger: "EURC/USDC quote improves above target",
    action: "Prepare a swap quote for review",
    status: "paused",
    riskLevel: "low",
    lastRun: "No quote prepared yet",
    nextCheck: "Every 15 minutes",
    enabled: false,
    approvalsPending: 0,
    allowedTokens: ["EURC", "USDC"],
    allowedChains: ["Arc Testnet"],
    maxTransactionAmount: "200 EURC",
    dailySpendLimit: "500 EURC",
    requireManualApproval: true
  },
  {
    id: "route-risk",
    name: "Pause transactions if route risk is high",
    trigger: "Quote failures, high slippage, or unsupported route detected",
    action: "Pause risky route and request user review",
    status: "active",
    riskLevel: "high",
    lastRun: "Monitoring only",
    nextCheck: "Continuous",
    enabled: true,
    approvalsPending: 0,
    allowedTokens: ["USDC", "EURC", "USDT"],
    allowedChains: ["Arc Testnet"],
    maxTransactionAmount: "0 USDC",
    dailySpendLimit: "0 USDC",
    requireManualApproval: true
  }
];

export const initialAutomationLogs: AutomationLog[] = [
  {
    id: "log-risk-monitor",
    ruleId: "route-risk",
    event: "Rule triggered",
    detail: "Risk Agent checked recent quote failures and kept execution paused until user review.",
    status: "info",
    timestamp: "Latest session"
  },
  {
    id: "log-rebalance-approval",
    ruleId: "rebalance-treasury",
    event: "Approval requested",
    detail: "Treasury rebalance policy needs manual approval before any prepared action.",
    status: "pending",
    timestamp: "Pending"
  },
  {
    id: "log-payment-ready",
    ruleId: "recurring-payment",
    event: "Quote prepared",
    detail: "Recurring payment rule can prepare a payment draft after wallet review.",
    status: "success",
    timestamp: "Ready"
  }
];

export const initialApprovalRequests: ApprovalRequest[] = [
  {
    id: "approval-rebalance",
    ruleId: "rebalance-treasury",
    title: "Review treasury rebalance rule",
    description: "Allow Velora AI to prepare a USDC/EURC/USDT allocation recommendation. No transaction will execute automatically.",
    riskLevel: "medium",
    requestedAt: "Pending",
    status: "pending"
  }
];

export function getAutomationOverview(rules: AutomationRule[], approvals: ApprovalRequest[]) {
  return {
    active: rules.filter((rule) => rule.status === "active").length,
    paused: rules.filter((rule) => rule.status === "paused").length,
    pendingApprovals: approvals.filter((approval) => approval.status === "pending").length,
    estimatedSavings: "Pending live data",
    lastRun: rules.find((rule) => rule.enabled)?.lastRun ?? "No runs yet"
  };
}

// Future integration points:
// - Persist automation rules and approvals in Supabase for cross-device state.
// - Schedule rule evaluation with cron jobs or a backend worker.
// - Connect Arc MCP, real route risk scoring, and smart contract policy permissions.
// - Require wallet signatures before preparing real transaction calldata for execution.
