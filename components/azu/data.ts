import {
  Activity,
  Bot,
  CircleDollarSign,
  Coins,
  Cpu,
  Droplets,
  LayoutDashboard,
  Network,
  Repeat2,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
  type LucideIcon
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  secondary?: boolean;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Payments", href: "/send", icon: Send },
  { label: "Bridge & Swap", href: "/trade", icon: Repeat2 },
  { label: "Faucet", href: "/faucet", icon: Droplets },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "AI Automation", href: "/automation", icon: Cpu },
  { label: "AI Agents", href: "/agents", icon: Bot },
  { label: "Settings", href: "/settings", icon: Settings, secondary: true }
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
  { label: "Arc network", value: "Arc Testnet", detail: "Connect wallet for live state" },
  { label: "Gas estimate", value: "--", detail: "Available during transaction preview" },
  { label: "Finality", value: "--", detail: "Shown from confirmed activity" },
  { label: "Policy engine", value: "Ready", detail: "Controls are configured in Automation" }
];

export const dashboardMetrics = [
  { title: "USDC Balance", value: "--", detail: "Connect wallet", icon: CircleDollarSign },
  { title: "AVL Rewards", value: "Coming Soon", detail: "Not live yet", icon: Coins, badge: "Future utility token" },
  { title: "Arc Network", value: "Arc Testnet", detail: "Connect wallet for live status", icon: Network },
  { title: "Recent Activity", value: "--", detail: "No activity yet", icon: Activity },
  { title: "AI Agents", value: "Ready", detail: "Agent permissions available", icon: Bot },
  { title: "Volume", value: "--", detail: "Volume tracking coming soon", icon: Wallet }
];
