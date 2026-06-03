import type { AutomationRiskLevel } from "./automationRules";

export type AgentStatus = "online" | "paused" | "needs approval";

export type AgentApproval = {
  id: string;
  title: string;
  description: string;
  riskLevel: AutomationRiskLevel;
  status: "pending" | "approved" | "rejected";
};

export type VeloraAgent = {
  id: string;
  name: string;
  purpose: string;
  status: AgentStatus;
  permissions: string[];
  connectedTools: string[];
  lastInsight: string;
  confidenceScore: number;
  recentActions: string[];
  currentAnalysis: string;
  suggestedAction: string;
  riskLevel: AutomationRiskLevel;
  dataSource: string;
  instructions: string;
  allowedActions: string[];
  spendingLimits: string;
  dataSources: string[];
  activityHistory: string[];
  recommendations: string[];
  approvalQueue: AgentApproval[];
};

export const initialAIAgents: VeloraAgent[] = [
  {
    id: "treasury-agent",
    name: "Treasury Agent",
    purpose: "Manages stablecoin allocation and recommends USDC/EURC/USDT rebalancing.",
    status: "online",
    permissions: ["Read balances", "Prepare rebalance recommendations", "Request approvals"],
    connectedTools: ["Activity history", "Stablecoin prices", "Arc token metadata"],
    lastInsight: "Wallet allocation analysis is ready once live balances are available.",
    confidenceScore: 88,
    recentActions: ["Analyze USDC/EURC/USDT balances", "Suggest rebalancing", "Show allocation percentage", "Recommend safer distribution"],
    currentAnalysis: "Reviews wallet stablecoin balances and allocation percentages. It only prepares recommendations.",
    suggestedAction: "Review balance allocation before preparing any rebalance quote.",
    riskLevel: "medium",
    dataSource: "Wallet balances, stablecoin prices, activity records",
    instructions: "Keep treasury allocations stable, conservative, and fully approval-first.",
    allowedActions: ["Prepare swap quote", "Recommend allocation changes", "Flag imbalance"],
    spendingLimits: "Cannot execute funds. Draft recommendations only.",
    dataSources: ["Wallet state", "Stablecoin ticker", "Activity recorder"],
    activityHistory: ["Policy initialized", "No automatic transaction rights granted"],
    recommendations: ["USDC/EURC diversification can be reviewed after balance sync."],
    approvalQueue: [
      {
        id: "treasury-rebalance-approval",
        title: "Approve rebalance recommendation draft",
        description: "Let Treasury Agent prepare a USDC/EURC allocation draft. No swap is executed.",
        riskLevel: "medium",
        status: "pending"
      }
    ]
  },
  {
    id: "routing-agent",
    name: "Routing Agent",
    purpose: "Finds best swap and bridge routes using LI.FI quote data and chain metadata.",
    status: "online",
    permissions: ["Read quote state", "Compare routes", "Flag unsupported execution"],
    connectedTools: ["LI.FI quote route", "Arc chain config", "Token registry"],
    lastInsight: "Arc-native USDC/EURC is preferred before third-party routing.",
    confidenceScore: 84,
    recentActions: ["Compare available routes", "Check fees", "Check estimated receive", "Warn when route is unavailable"],
    currentAnalysis: "Compares swap and bridge route availability before a user reviews wallet execution.",
    suggestedAction: "Check route availability and prepare only routes that return wallet transaction data.",
    riskLevel: "medium",
    dataSource: "Trade quotes, bridge provider diagnostics, chain metadata",
    instructions: "Prefer Arc-native stablecoin routing, then route through LI.FI only when needed.",
    allowedActions: ["Prepare route preview", "Request swap approval", "Flag route failure"],
    spendingLimits: "Cannot execute swaps without wallet confirmation.",
    dataSources: ["Trade page quotes", "Chain metadata", "Activity recorder"],
    activityHistory: ["Route policy loaded", "Fallback route guard enabled"],
    recommendations: ["USDC to EURC route is available. Review quote before execution."],
    approvalQueue: []
  },
  {
    id: "payment-agent",
    name: "Payment Agent",
    purpose: "Prepares recurring payments and stablecoin transfers.",
    status: "needs approval",
    permissions: ["Create payment reminders", "Prepare transfer drafts", "Request wallet review"],
    connectedTools: ["Payments", "Wallet status", "Activity recorder"],
    lastInsight: "Recurring payments require recipient approval before any transfer draft.",
    confidenceScore: 79,
    recentActions: ["Create payment request draft", "Check recipient wallet", "Check amount", "Require approval before transaction"],
    currentAnalysis: "Prepares stablecoin payment drafts and approval records. It never submits funds automatically.",
    suggestedAction: "Create a payment draft, then send it to Agent Payments for user approval.",
    riskLevel: "low",
    dataSource: "Payment form, wallet status, approval workflow",
    instructions: "Never send funds automatically. Create payment drafts and ask the user to approve.",
    allowedActions: ["Create reminder", "Prepare USDC transfer draft", "Pause payment"],
    spendingLimits: "Manual approval required for every payment.",
    dataSources: ["Wallet connection", "Payment form", "Activity recorder"],
    activityHistory: ["Payment policy initialized", "No recipient allowlist configured"],
    recommendations: ["Recurring payment rule is ready for user approval."],
    approvalQueue: [
      {
        id: "payment-policy-approval",
        title: "Approve recurring payment policy",
        description: "Allow Payment Agent to prepare payment reminders and drafts.",
        riskLevel: "low",
        status: "pending"
      }
    ]
  },
  {
    id: "risk-agent",
    name: "Risk Agent",
    purpose: "Detects high slippage, unsupported routes, failed quotes, suspicious activity, and gas spikes.",
    status: "online",
    permissions: ["Read failures", "Pause risky recommendations", "Request user review"],
    connectedTools: ["Activity recorder", "Route validation", "Gas estimates"],
    lastInsight: "Failed route history should pause automated execution until reviewed.",
    confidenceScore: 91,
    recentActions: ["Warn about high fees", "Warn about unsupported routes", "Warn about wrong network", "Warn about suspicious recipients"],
    currentAnalysis: "Monitors failed quotes, wrong-network states, route gaps, and risky payment inputs.",
    suggestedAction: "Review warnings before preparing a swap, bridge, or payment action.",
    riskLevel: "high",
    dataSource: "Activity failures, route validation, wallet network state",
    instructions: "Be conservative. Block action preparation when route risk is high.",
    allowedActions: ["Flag risk", "Pause rule", "Request approval"],
    spendingLimits: "No spending rights. Risk controls only.",
    dataSources: ["Activity logs", "Swap errors", "Gas estimates"],
    activityHistory: ["Risk monitor active", "Manual approval enforced"],
    recommendations: ["Bridge route failed recently. Risk Agent recommends waiting."],
    approvalQueue: []
  },
  {
    id: "analytics-agent",
    name: "Analytics Agent",
    purpose: "Summarizes wallet activity, trading activity, rewards, and stablecoin flow.",
    status: "paused",
    permissions: ["Read activity records", "Summarize usage", "Create insights"],
    connectedTools: ["Activity dashboard", "Transaction history", "Rewards metadata"],
    lastInsight: "Connect wallet and use Velora AI to generate real activity summaries.",
    confidenceScore: 76,
    recentActions: ["Show total swaps", "Show total bridges", "Show total volume", "Show Velora Pioneers progress"],
    currentAnalysis: "Summarizes real user activity only after wallet activity exists.",
    suggestedAction: "Connect wallet and generate an activity summary from recorded actions.",
    riskLevel: "low",
    dataSource: "Activity records, profile metrics, Velora Pioneers progress",
    instructions: "Summarize only real user activity and clearly label incomplete data.",
    allowedActions: ["Create activity summary", "Draft insight", "Request approval"],
    spendingLimits: "No transaction permissions.",
    dataSources: ["Activity recorder", "Wallet session", "Rewards metadata"],
    activityHistory: ["Insight engine ready", "No live summary generated"],
    recommendations: ["No AI insight will be generated until wallet activity exists."],
    approvalQueue: []
  }
];

// Future integration points:
// - Replace this local rule-based layer with OpenAI/Claude reasoning APIs.
// - Connect Arc MCP tools for chain-aware route analysis and policy checks.
// - Add agent wallets only after explicit smart contract permissions and user limits exist.
// - Persist instructions, approvals, and agent history in Supabase with privacy controls.
