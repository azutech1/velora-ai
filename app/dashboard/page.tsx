"use client";

import { useMemo } from "react";
import { ArrowRightLeft, BadgeCheck, Bot, Droplets, Flame, Network, Search, ShieldCheck, Trophy, Wallet } from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";
import { OpenAssistantButton } from "@/components/assistant/OpenAssistantButton";
import { TokenLogo } from "@/components/token/TokenLogo";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useArcNetwork } from "@/hooks/useArcNetwork";
import { usePioneerProfile } from "@/hooks/usePioneerProfile";
import { usePortfolioBalances } from "@/hooks/usePortfolioBalances";
import { getMainActivityRecords } from "@/lib/activity/display";
import type { ActivityRecord } from "@/lib/activity/types";
import type { ActiveTokenSymbol } from "@/lib/config/tokens";
import { shortAddress } from "@/lib/utils/format";

type ChartBucket = {
  key: string;
  label: string;
  swaps: number;
  bridges: number;
  payments: number;
  total: number;
};

const PORTFOLIO_TOKENS: ActiveTokenSymbol[] = ["USDC", "EURC", "USDT"];

function isSwapActivity(record: ActivityRecord) {
  return record.feature === "swap" || record.actionType.includes("swap");
}

function isBridgeActivity(record: ActivityRecord) {
  return record.feature === "bridge" || record.actionType.includes("bridge");
}

function isPaymentActivity(record: ActivityRecord) {
  return record.feature === "send" || record.feature === "agent_payments" || record.actionType.includes("payment") || record.actionType.includes("send");
}

function buildActivityChartData(records: ActivityRecord[]): ChartBucket[] {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      swaps: 0,
      bridges: 0,
      payments: 0,
      total: 0
    };
  });

  records.forEach((record) => {
    const key = new Date(record.timestamp).toISOString().slice(0, 10);
    const bucket = days.find((day) => day.key === key);
    if (!bucket) return;

    if (isSwapActivity(record)) bucket.swaps += 1;
    if (isBridgeActivity(record)) bucket.bridges += 1;
    if (isPaymentActivity(record)) bucket.payments += 1;
    bucket.total += 1;
  });

  return days;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
      <div>
        <Search className="mx-auto h-9 w-9 text-cyan" />
        <p className="mt-4 text-sm leading-6 text-slate-400">{message}</p>
      </div>
    </div>
  );
}

function PortfolioCard({ symbol, balance, value }: { symbol: ActiveTokenSymbol; balance: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-3">
        <TokenLogo symbol={symbol} size={32} />
        <div>
          <p className="text-sm text-slate-400">{symbol}</p>
          <p className="mt-1 text-lg font-bold text-white">
            {balance} {symbol}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-400">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { isArc } = useArcNetwork();
  const portfolio = usePortfolioBalances();
  const { activities } = useActivityRecorder();

  const walletActivities = useMemo(() => {
    if (!isConnected || !address) return [];
    const normalizedAddress = address.toLowerCase();
    return getMainActivityRecords(activities).filter((activity) => activity.walletAddress.toLowerCase() === normalizedAddress);
  }, [activities, address, isConnected]);

  const chartData = useMemo(() => buildActivityChartData(walletActivities), [walletActivities]);
  const hasChartData = chartData.some((item) => item.total > 0);
  const pioneers = usePioneerProfile(walletActivities);
  const pioneerSummary = pioneers.summary;
  const latestPioneerBadge = pioneerSummary.badges.filter((badge) => badge.earned).at(-1)?.name ?? "--";

  const portfolioPositions = useMemo(
    () => PORTFOLIO_TOKENS.map((symbol) => portfolio.positions.find((position) => position.token.symbol === symbol)).filter(Boolean),
    [portfolio.positions]
  );

  const walletStatus = isConnected ? (isArc ? "Wallet Connected" : "Switch to Arc Testnet") : "Wallet Disconnected";
  const progressToNextLevel = isConnected ? pioneerSummary.progress : 0;
  const nextLevelName = pioneerSummary.nextLevel?.name ?? "Complete";

  return (
    <AppShell title="Dashboard" eyebrow="Velora AI Public Beta">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-2xl border border-orange/25 bg-gradient-to-br from-orange/15 via-white/[0.04] to-red-500/10 p-5 shadow-[0_24px_80px_rgba(249,115,22,0.12)] light:border-black light:bg-orange-50 light:from-orange-50 light:via-white light:to-red-50">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-[0_16px_42px_rgba(249,115,22,0.28)]">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-200 light:text-orange-700">Talk to your wallet</p>
                <h2 className="mt-1 text-2xl font-black text-white light:text-slate-950">🤖 Velora AI Assistant</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 light:text-slate-700">
                  Send, Swap, Bridge, Check Rewards, and manage your wallet using natural language.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Send 10 USDC", "Swap 20 USDC to EURC", "Bridge 10 USDC to Base", "Show my wallet balance"].map((example) => (
                    <span key={example} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-slate-200 light:border-black light:bg-white light:text-slate-800">
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <OpenAssistantButton>Open AI Assistant</OpenAssistantButton>
          </div>
        </section>

        <Panel title="Portfolio Overview" eyebrow="Wallet balances">
          {!isConnected ? (
            <EmptyState message="Connect wallet to view your portfolio." />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-lg border border-cyan/20 bg-cyan/10 p-4 xl:col-span-2">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-cyan" />
                    <p className="text-sm font-semibold text-white">Total Portfolio Value</p>
                  </div>
                  <p className="mt-4 text-3xl font-black text-white">{portfolio.arcConnected ? portfolio.totalValueLabel : "--"}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {isConnecting || isReconnecting ? "Connecting..." : address ? `${walletStatus} · ${shortAddress(address)}` : walletStatus}
                  </p>
                </div>

                {portfolioPositions.map((position) =>
                  position ? (
                    <PortfolioCard key={position.token.symbol} symbol={position.token.symbol} balance={position.isLoading ? "Loading..." : position.balanceLabel} value={position.valueLabel} />
                  ) : null
                )}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Quick Actions" eyebrow="Start from the wallet">
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/trade" className="rounded-lg border border-white/10 bg-white/[0.04] p-5 transition hover:border-orange/40 hover:bg-orange/10">
              <ArrowRightLeft className="h-5 w-5 text-orange" />
              <p className="mt-4 text-lg font-bold text-white">Swap</p>
            </Link>
            <Link href="/trade" className="rounded-lg border border-white/10 bg-white/[0.04] p-5 transition hover:border-orange/40 hover:bg-orange/10">
              <Network className="h-5 w-5 text-orange" />
              <p className="mt-4 text-lg font-bold text-white">Bridge</p>
            </Link>
            <Link href="/faucet" className="rounded-lg border border-white/10 bg-white/[0.04] p-5 transition hover:border-orange/40 hover:bg-orange/10">
              <Droplets className="h-5 w-5 text-orange" />
              <p className="mt-4 text-lg font-bold text-white">Faucet</p>
            </Link>
          </div>
        </Panel>

        <Panel title="Wallet Activity Overview" eyebrow="Daily swaps, bridges, payments, and total activity">
          {!isConnected || !hasChartData ? (
            <EmptyState message="No wallet activity yet." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="totalActivityFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#F97316" stopOpacity={0.34} />
                      <stop offset="100%" stopColor="#FF2D3D" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={32} />
                  <Tooltip contentStyle={{ background: "#090d15", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#e2e8f0" }} />
                  <Area type="monotone" dataKey="total" name="Total activity" stroke="#F97316" strokeWidth={2.5} fill="url(#totalActivityFill)" />
                  <Area type="monotone" dataKey="swaps" name="Swaps" stroke="#3B82F6" strokeWidth={2} fill="transparent" />
                  <Area type="monotone" dataKey="bridges" name="Bridges" stroke="#A855F7" strokeWidth={2} fill="transparent" />
                  <Area type="monotone" dataKey="payments" name="Payments" stroke="#10B981" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <div className="grid gap-6">
          <Panel
            title="Velora Pioneers Progress"
            eyebrow="Community status"
            action={
              <Link href="/pioneers" className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-2 text-sm font-bold text-orange transition hover:border-orange/50 hover:text-white">
                Open Velora Pioneers
              </Link>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <Trophy className="h-5 w-5 text-orange" />
                <p className="mt-3 text-sm text-slate-400">Current Level</p>
                <p className="mt-2 font-bold text-white">{isConnected ? pioneerSummary.level.name : "--"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <BadgeCheck className="h-5 w-5 text-orange" />
                <p className="mt-3 text-sm text-slate-400">Total Points</p>
                <p className="mt-2 font-bold text-white">{isConnected ? `${pioneerSummary.totalPoints.toLocaleString()} Points` : "--"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <Flame className="h-5 w-5 text-orange" />
                <p className="mt-3 text-sm text-slate-400">Current Streak</p>
                <p className="mt-2 font-bold text-white">{isConnected ? `${pioneers.currentStreak} Days` : "--"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <ShieldCheck className="h-5 w-5 text-orange" />
                <p className="mt-3 text-sm text-slate-400">Latest Badge</p>
                <p className="mt-2 font-bold text-white">{isConnected ? latestPioneerBadge : "--"}</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-400">Progress to next level</span>
                <span className="font-bold text-white">{isConnected ? nextLevelName : "--"}</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-black/30">
                <div className="h-full rounded-full bg-gradient-to-r from-orange to-red-500" style={{ width: `${progressToNextLevel}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-400">{isConnected ? `${progressToNextLevel}% complete` : "Connect wallet to start progress."}</p>
            </div>
          </Panel>
        </div>

        <Panel title="Network Status" eyebrow="Launch readiness">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <Network className="h-5 w-5 text-mint" />
              <p className="mt-3 text-sm text-slate-400">Arc Testnet</p>
              <p className="mt-2 font-bold text-white">{isArc ? "Connected" : "Connected network required"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <Wallet className="h-5 w-5 text-mint" />
              <p className="mt-3 text-sm text-slate-400">Wallet</p>
              <p className="mt-2 font-bold text-white">{isConnected ? "Connected" : "Disconnected"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <ShieldCheck className="h-5 w-5 text-mint" />
              <p className="mt-3 text-sm text-slate-400">Systems</p>
              <p className="mt-2 font-bold text-white">Operational</p>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
