import {
  Activity,
  Bot,
  CircleDollarSign,
  Coins,
  Cpu,
  Droplets,
  History,
  LayoutDashboard,
  LineChart,
  Network,
  Repeat2,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap
} from "lucide-react";

export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Send USDC", href: "/send", icon: Send },
  { label: "Bridge & Swap", href: "/trade", icon: Repeat2 },
  { label: "Token", href: "/token", icon: Coins },
  { label: "Faucet", href: "/faucet", icon: Droplets },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Transactions", href: "/transactions", icon: History },
  { label: "AI Automation", href: "/automation", icon: Cpu },
  { label: "AI Agents", href: "/agents", icon: Bot },
  { label: "Analytics", href: "/analytics", icon: LineChart },
  { label: "Settings", href: "/settings", icon: Settings }
];

export const featureCards = [
  { title: "USDC Native", text: "Stablecoin-first balances, transfers, and operating metrics.", icon: CircleDollarSign },
  { title: "AI Automation", text: "Rules, agent permissions, and programmable payment flows.", icon: Sparkles },
  { title: "Lightning Fast", text: "Arc-native payment UX designed around low-latency settlement.", icon: Zap },
  { title: "Secure Policies", text: "Limits, approvals, activity logs, and confirmation states.", icon: ShieldCheck },
  { title: "Arc Powered", text: "Network health, fee previews, and explorer-ready transaction records.", icon: Network },
  { title: "Agent Ready", text: "Built for autonomous payment agents and future API integrations.", icon: Bot }
];

export const analyticsData = [
  { day: "Mon", volume: 42000, agents: 18, transactions: 82, fees: 140 },
  { day: "Tue", volume: 66000, agents: 24, transactions: 118, fees: 180 },
  { day: "Wed", volume: 58000, agents: 31, transactions: 104, fees: 126 },
  { day: "Thu", volume: 96000, agents: 42, transactions: 161, fees: 240 },
  { day: "Fri", volume: 122000, agents: 57, transactions: 214, fees: 310 },
  { day: "Sat", volume: 111000, agents: 49, transactions: 184, fees: 252 },
  { day: "Sun", volume: 148000, agents: 64, transactions: 249, fees: 338 }
];

export const transactions = [
  { id: "0x8f2...19a", type: "Send", counterparty: "Nova Support Agent", amount: "-2,450.00", status: "Confirmed", time: "18 sec ago", explorer: "ArcScan" },
  { id: "0xa01...7cd", type: "Receive", counterparty: "Arc Treasury Vault", amount: "+8,100.00", status: "Confirmed", time: "4 min ago", explorer: "ArcScan" },
  { id: "0x74e...ba9", type: "Send", counterparty: "Inference Credits", amount: "-680.50", status: "Pending", time: "8 min ago", explorer: "ArcScan" },
  { id: "0x31c...492", type: "Send", counterparty: "Data Labeling Pool", amount: "-1,240.00", status: "Confirmed", time: "31 min ago", explorer: "ArcScan" },
  { id: "0xe0b...0cc", type: "Receive", counterparty: "Partner Settlement", amount: "+14,900.00", status: "Confirmed", time: "1 hr ago", explorer: "ArcScan" },
  { id: "0xb92...f17", type: "Send", counterparty: "Vector Compute API", amount: "-4,250.00", status: "Failed", time: "2 hr ago", explorer: "ArcScan" }
];

export const agents = [
  { name: "Nova", role: "API cost manager", status: "Active", spend: "$12,480", limit: "$18k/mo", activity: "Paid 8 inference invoices", health: 84 },
  { name: "Lyra", role: "Creator payout agent", status: "Active", spend: "$42,910", limit: "$60k/mo", activity: "Queued 24 USDC transfers", health: 72 },
  { name: "Orion", role: "Treasury watcher", status: "Review", spend: "$8,200", limit: "$12k/mo", activity: "Flagged new recipient", health: 48 },
  { name: "Vega", role: "Webhook settlement agent", status: "Active", spend: "$18,730", limit: "$25k/mo", activity: "Settled 11 API events", health: 91 }
];

export const rules = [
  { name: "Auto-pay inference invoices below $750", enabled: true, limit: "$750", saved: "$1,280" },
  { name: "Require approval for new recipient wallets", enabled: true, limit: "Manual", saved: "$0" },
  { name: "Pause spends if Arc health drops below 98%", enabled: true, limit: "98%", saved: "$4,900" },
  { name: "Route API payments through verified keys only", enabled: false, limit: "API", saved: "$620" }
];

export const activityLogs = [
  "Nova approved recurring compute payment",
  "Lyra completed creator payout batch",
  "Arc Network status refreshed",
  "Policy engine blocked unverified recipient",
  "Webhook integration delivered settlement event"
];

export const networkSignals = [
  { label: "Arc health", value: "99.99%", detail: "18 validators synced" },
  { label: "Gas estimate", value: "$0.0038", detail: "Low congestion" },
  { label: "Finality", value: "1.8s", detail: "Median confirmation" },
  { label: "Policy engine", value: "Active", detail: "4 rules watching" }
];

export const dashboardMetrics = [
  { title: "USDC Balance", value: "$284,920.42", detail: "+12.8% this week", icon: CircleDollarSign },
  { title: "AVL Balance", value: "12,840 AVL", detail: "Utility access credits", icon: Coins },
  { title: "Arc Network", value: "99.99%", detail: "Testnet online", icon: Network },
  { title: "Transactions", value: "1,284", detail: "+214 this week", icon: Activity },
  { title: "AI Agents", value: "4 active", detail: "64 automations", icon: Bot },
  { title: "Total Volume", value: "$2.84M", detail: "Across Arc rails", icon: Wallet }
];
