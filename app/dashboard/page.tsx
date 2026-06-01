"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Award, Bot, CheckCircle2, CircleDollarSign, Coins, Flame, Network, RadioTower, Search, Trophy, Wallet } from "lucide-react";
import Link from "next/link";
import { formatUnits } from "viem";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAccount, useReadContract } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { MetricCard, Panel } from "@/components/azu/ui";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { useArcNetwork } from "@/hooks/useArcNetwork";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useAdminMode } from "@/hooks/useAdminMode";
import { usePioneerProfile } from "@/hooks/usePioneerProfile";
import type { ActivityRecord } from "@/lib/activity/types";
import { erc20UsdcAbi, USDC_CONTRACT_ADDRESS } from "@/lib/contracts/usdc";
import { ARC_EXPLORER_URL } from "@/lib/web3/chains";
import { explorerTxUrl, shortAddress } from "@/lib/utils/format";

type StoredTx = {
  hash: string;
  amount: string;
  recipient: string;
  createdAt: string;
};

function buildActivityChartData(records: ActivityRecord[]) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      activity: 0
    };
  });

  records.forEach((record) => {
    const key = new Date(record.timestamp).toISOString().slice(0, 10);
    const bucket = days.find((day) => day.key === key);
    if (bucket) bucket.activity += 1;
  });

  return days;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
      <div>
        <Search className="mx-auto h-10 w-10 text-cyan" />
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-400">{message}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { isAdmin } = useAdminMode();
  const { chainId, expectedChain, isArc } = useArcNetwork();
  const [lastTx, setLastTx] = useState<StoredTx | null>(null);
  const { activities, recordActivity } = useActivityRecorder();

  const { data: usdcBalance, isLoading: isUsdcLoading, isError: isUsdcError } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: erc20UsdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(isConnected && isArc && address) }
  });

  const walletActivities = useMemo(() => {
    if (!isConnected || !address) return [];
    const normalizedAddress = address.toLowerCase();
    return activities.filter((activity) => activity.walletAddress.toLowerCase() === normalizedAddress);
  }, [activities, address, isConnected]);

  const transactionActivities = useMemo(
    () => walletActivities.filter((activity) => Boolean(activity.txHash) || ["send", "swap", "bridge"].includes(activity.feature)),
    [walletActivities]
  );

  const chartData = useMemo(() => buildActivityChartData(walletActivities), [walletActivities]);
  const hasChartData = chartData.some((item) => item.activity > 0);
  const pioneers = usePioneerProfile(walletActivities);
  const pioneerSummary = pioneers.summary;
  const latestPioneerBadge = pioneerSummary.badges.filter((badge) => badge.earned).at(-1)?.name ?? "--";

  const formattedUsdcBalance = useMemo(() => {
    if (!isConnected) return "Connect wallet";
    if (!isArc) return "Switch to Arc";
    if (isUsdcLoading) return "Loading...";
    if (isUsdcError || typeof usdcBalance !== "bigint") return "No data available";
    const value = Number(formatUnits(usdcBalance, 6));
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 4 })} USDC`;
  }, [isArc, isConnected, isUsdcError, isUsdcLoading, usdcBalance]);

  const insightItems = useMemo(() => {
    if (!isConnected || walletActivities.length === 0) return [];
    const failedSwaps = walletActivities.filter((activity) => activity.feature === "swap" && activity.status === "failed").length;
    const completedSwaps = walletActivities.filter((activity) => activity.feature === "swap" && activity.status === "success").length;
    const bridgeActions = walletActivities.filter((activity) => activity.feature === "bridge").length;
    const sendActions = walletActivities.filter((activity) => activity.feature === "send").length;
    const insights: Array<[string, string]> = [];

    if (failedSwaps > 0) insights.push(["Swap review", `${failedSwaps} swap ${failedSwaps === 1 ? "attempt needs" : "attempts need"} attention.`]);
    if (completedSwaps > 0) insights.push(["Stablecoin activity", `${completedSwaps} completed swap ${completedSwaps === 1 ? "is" : "are"} recorded for this wallet.`]);
    if (bridgeActions > 0) insights.push(["Bridge activity", `${bridgeActions} bridge ${bridgeActions === 1 ? "action has" : "actions have"} been recorded.`]);
    if (sendActions > 0) insights.push(["Payment activity", `${sendActions} USDC payment ${sendActions === 1 ? "action is" : "actions are"} available in Activity.`]);

    return insights;
  }, [isConnected, walletActivities]);

  const metrics = [
    {
      title: "USDC Balance",
      value: formattedUsdcBalance,
      detail: !isConnected ? "Connect wallet" : isArc ? "Arc ERC-20 balance" : "Unsupported network",
      icon: CircleDollarSign
    },
    {
      title: "AVL Rewards",
      value: "Coming Soon",
      detail: "Not live yet",
      icon: Coins,
      badge: "Future utility token"
    },
    {
      title: "Arc Network",
      value: isConnected ? (isArc ? "Arc Testnet Connected" : "Unsupported network") : "Connect wallet",
      detail: isConnected ? expectedChain.name : "No data available",
      icon: Network
    },
    {
      title: "Recent Activity",
      value: isConnected ? (walletActivities.length ? `${walletActivities.length}` : "No activity yet") : "--",
      detail: isConnected ? "Recorded actions" : "No data available",
      icon: Activity
    },
    {
      title: "AI Agents",
      value: isConnected ? "Ready" : "Connect wallet",
      detail: "Agent permissions are managed in AI Agents",
      icon: Bot
    },
    {
      title: "Volume",
      value: "--",
      detail: isConnected ? "Volume tracking coming soon" : "No volume data",
      icon: Wallet
    }
  ];

  useEffect(() => {
    const raw = window.localStorage.getItem("velora:lastTransaction");
    setLastTx(raw ? (JSON.parse(raw) as StoredTx) : null);
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    recordActivity({
      actionType: "dashboard_viewed",
      title: "Dashboard viewed",
      description: "The Velora AI dashboard was opened.",
      feature: "dashboard",
      network: expectedChain.name,
      status: "info"
    });
  }, [expectedChain.name, isConnected, recordActivity]);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {!isConnected ? (
          <Panel title="Welcome to Velora AI" eyebrow="Wallet access required">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
              <Wallet className="mx-auto h-10 w-10 text-cyan" />
              <p className="mt-4 text-sm font-semibold text-white">Connect wallet to continue</p>
            </div>
          </Panel>
        ) : null}

        {isConnected && isAdmin ? (
          <Panel title="Admin Panel" eyebrow="Platform overview">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-mint/20 bg-mint/10 p-4">
                <p className="text-sm text-slate-300">Platform health</p>
                <p className="mt-2 font-bold text-white">Testnet Alpha</p>
              </div>
              <div className="rounded-lg border border-cyan/20 bg-cyan/10 p-4">
                <p className="text-sm text-slate-300">Gateway setup</p>
                <p className="mt-2 font-bold text-white">Admin configuration required</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm text-slate-400">Integration readiness</p>
                <p className="mt-2 font-bold text-white">WalletConnect ready</p>
              </div>
            </div>
          </Panel>
        ) : null}

        {isConnected ? (
          <>
        <Panel title="Wallet Status" eyebrow="Live Web3 status">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-cyan">
                <Wallet className="h-5 w-5" />
                <p className="font-semibold text-white">Connected wallet</p>
              </div>
              <p className="mt-3 break-all text-sm text-slate-400">
                {isConnecting || isReconnecting ? "Connecting..." : isConnected && address ? address : "Connect wallet"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Network</p>
              <p className="mt-3 font-semibold text-white">{isConnected ? (isArc ? expectedChain.name : `Chain ${chainId}`) : "No data available"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Session activity</p>
              <p className="mt-3 font-semibold text-white">{isConnected ? (walletActivities.length ? `${walletActivities.length} records` : "No activity yet") : "--"}</p>
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        <Panel
          title="Velora Pioneers"
          eyebrow="Community progression"
          action={
            <Link href="/pioneers" className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-bold text-cyan transition hover:border-cyan/50 hover:text-white">
              Open Pioneers
            </Link>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <Trophy className="h-5 w-5 text-cyan" />
              <p className="mt-3 text-sm text-slate-400">Current Level</p>
              <p className="mt-2 font-bold text-white">{isConnected ? `${pioneerSummary.level.name}` : "--"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <Coins className="h-5 w-5 text-cyan" />
              <p className="mt-3 text-sm text-slate-400">Total Points</p>
              <p className="mt-2 font-bold text-white">{isConnected ? `${pioneerSummary.totalPoints.toLocaleString()} Points` : "--"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <Flame className="h-5 w-5 text-warning" />
              <p className="mt-3 text-sm text-slate-400">Current Streak</p>
              <p className="mt-2 font-bold text-white">{isConnected ? `${pioneers.currentStreak} Days` : "--"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <Award className="h-5 w-5 text-cyan" />
              <p className="mt-3 text-sm text-slate-400">Latest Badge Earned</p>
              <p className="mt-2 font-bold text-white">{isConnected ? latestPioneerBadge : "--"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <CheckCircle2 className="h-5 w-5 text-mint" />
              <p className="mt-3 text-sm text-slate-400">Reputation Score</p>
              <p className="mt-2 font-bold text-white">{isConnected ? pioneerSummary.reputation.toLocaleString() : "--"}</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-cyan/20 bg-cyan/10 p-4">
            <p className="text-sm text-slate-400">Next Achievement</p>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">Next Badge</p>
                <p className="font-bold text-white">{isConnected ? pioneerSummary.nextAchievement.nextBadge : "--"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Progress</p>
                <p className="font-bold text-white">{isConnected ? `${pioneerSummary.nextAchievement.currentProgress} / ${pioneerSummary.nextAchievement.requirement}` : "--"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Remaining</p>
                <p className="font-bold text-white">{isConnected ? pioneerSummary.nextAchievement.remaining : "--"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Completion</p>
                <p className="font-bold text-white">{isConnected ? `${pioneerSummary.nextAchievement.progress}%` : "--"}</p>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-black/30">
              <div className="h-full rounded-full bg-cyan" style={{ width: `${isConnected ? pioneerSummary.nextAchievement.progress : 0}%` }} />
            </div>
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Activity Overview" eyebrow="Wallet-driven activity">
            {!isConnected || !hasChartData ? (
              <EmptyState message={"No activity available yet.\nConnect wallet and start using Velora AI."} />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="activityFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={32} />
                    <Tooltip contentStyle={{ background: "#07111f", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e2e8f0" }} />
                    <Area type="monotone" dataKey="activity" stroke="#3B82F6" strokeWidth={2} fill="url(#activityFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <Panel title="AI Insights" eyebrow="Generated from wallet activity">
            {!isConnected || insightItems.length === 0 ? (
              <EmptyState message={isConnected ? "No AI insights yet." : "Connect wallet to generate insights from real activity."} />
            ) : (
              <div className="space-y-4">
                {insightItems.map(([title, text]) => (
                  <div key={title} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel
            title="Recent Activity"
            eyebrow="Latest recorded actions"
            action={
              <Link href="/activity" className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-bold text-cyan transition hover:border-cyan/50 hover:text-white">
                View Activity
              </Link>
            }
          >
            <ActivityTimeline records={walletActivities.slice(0, 5)} emptyText={isConnected ? "No activity recorded for this wallet yet." : "Connect wallet to view activity."} />
          </Panel>

          <Panel title="AI Agents" eyebrow="Automation workspace">
            <div className="space-y-4">
              {["Agent permissions", "Automation rules", "Marketplace readiness"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-cyan" />
                    <div>
                      <p className="font-semibold text-white">{item}</p>
                      <p className="text-xs text-slate-400">{isConnected ? "Ready for authenticated configuration" : "Connect wallet to configure"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Arc Network" eyebrow="Connection status">
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Status</p>
                    <p className="mt-2 font-bold text-white">{isConnected ? (isArc ? "Arc Testnet Connected" : "Switch to Arc Testnet") : "Connect wallet"}</p>
                  </div>
                  <RadioTower className="h-5 w-5 text-mint" />
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-400">Velora AI uses Arc network state from the connected wallet. No uptime or volume estimates are displayed without live data.</p>
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
          <Panel title="Stablecoin Activity">
            {transactionActivities.length ? (
              <ActivityTimeline records={transactionActivities.slice(0, 4)} emptyText="No transactions yet." />
            ) : (
              <EmptyState message={isConnected ? "No transactions yet." : "Connect wallet to view stablecoin activity."} />
            )}
          </Panel>

          <Panel title="Last Transaction">
            {lastTx ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-mint/20 bg-mint/10 p-4">
                  <p className="text-sm text-slate-400">Hash</p>
                  <p className="mt-2 break-all font-semibold text-white">{shortAddress(lastTx.hash)}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs text-slate-500">Amount</p>
                    <p className="mt-2 font-semibold text-white">{lastTx.amount} USDC</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs text-slate-500">Recipient</p>
                    <p className="mt-2 font-semibold text-white">{shortAddress(lastTx.recipient)}</p>
                  </div>
                </div>
                <a className="inline-flex items-center text-sm font-semibold text-cyan hover:text-cyan" href={explorerTxUrl(ARC_EXPLORER_URL, lastTx.hash)} target="_blank" rel="noreferrer">
                  Open in ArcScan
                </a>
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-400">{isConnected ? "No confirmed USDC transaction has been recorded yet." : "Connect wallet to see the latest confirmed transaction."}</p>
            )}
          </Panel>
        </div>

        <Panel title="Automation Status" eyebrow="Policy controls">
          <div className="grid gap-3 md:grid-cols-3">
            {["Spending policies", "Approval controls", "Agent permissions"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <CheckCircle2 className="h-5 w-5 text-mint" />
                <div>
                  <p className="text-sm font-semibold text-white">{item}</p>
                  <p className="text-xs text-slate-400">{isConnected ? "Available in AI Automation" : "Connect wallet to configure"}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
