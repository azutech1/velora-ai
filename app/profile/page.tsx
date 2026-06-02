"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Award, BadgeCheck, Copy, Crown, Download, Flame, LogOut, RefreshCw, Sparkles, WalletCards } from "lucide-react";
import { useAccount, useChainId, useDisconnect } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { MetricCard, Panel } from "@/components/azu/ui";
import { cx } from "@/components/azu/utils";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { AchievementProgressCard } from "@/components/pioneers/AchievementProgressCard";
import { PioneerBadgeCard } from "@/components/pioneers/PioneerBadgeCard";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useAdminMode } from "@/hooks/useAdminMode";
import { usePioneerProfile } from "@/hooks/usePioneerProfile";
import { usePortfolioBalances } from "@/hooks/usePortfolioBalances";
import { isMainActivityRecord } from "@/lib/activity/display";
import type { ActivityRecord } from "@/lib/activity/types";
import { getChainById } from "@/lib/config/chains";
import { shortAddress } from "@/lib/utils/format";

type ProfileTab = "positions" | "activities";

function avatarStyle(address?: string) {
  const seed = address ?? "velora";
  const hueA = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const hueB = (hueA + 80) % 360;
  return {
    background: `radial-gradient(circle at 30% 25%, hsl(${hueB} 90% 60%), transparent 35%), linear-gradient(135deg, hsl(${hueA} 88% 46%), hsl(${hueB} 80% 38%))`
  };
}

function activityCounts(records: ActivityRecord[]) {
  return {
    total: records.length,
    swaps: records.filter((record) => record.feature === "swap" || record.actionType.includes("swap")).length,
    bridges: records.filter((record) => record.feature === "bridge" || record.actionType.includes("bridge")).length,
    agentPayments: records.filter((record) => record.feature === "agent_payments" || record.actionType.includes("agent_payment")).length,
    automation: records.filter((record) => record.feature === "automation" || record.actionType.includes("approval")).length
  };
}

function isVeloraProfileActivity(record: ActivityRecord) {
  return isMainActivityRecord(record);
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { isAdmin } = useAdminMode();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const chain = getChainById(chainId);
  const [tab, setTab] = useState<ProfileTab>("positions");
  const { activities, exportCsv } = useActivityRecorder();
  const portfolio = usePortfolioBalances();
  const profileActivities = useMemo(() => {
    if (!isConnected || !address) return [];
    const connectedWallet = address.toLowerCase();
    return activities.filter((activity) => activity.walletAddress.toLowerCase() === connectedWallet && isVeloraProfileActivity(activity));
  }, [activities, address, isConnected]);
  const stats = useMemo(() => activityCounts(profileActivities), [profileActivities]);
  const pioneers = usePioneerProfile(profileActivities);
  const pioneerSummary = pioneers.summary;
  const earnedBadges = pioneerSummary.badges.filter((badge) => badge.earned);
  const hasAssets = portfolio.positions.some((position) => position.balance > 0);
  const statValue = (value: number) => (isConnected ? String(value) : "--");

  function downloadCsv() {
    if (!isConnected || !profileActivities.length) return;
    const blob = new Blob([exportCsv(profileActivities)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "velora-profile-activity.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
  }

  return (
    <AppShell title="Profile" eyebrow="Wallet portfolio and Velora AI activity center">
      <div className="space-y-6">
        {isConnected && isAdmin ? (
          <Panel title="Admin Tools" eyebrow="Creator wallet access">
            <div className="rounded-lg border border-mint/20 bg-mint/10 p-4 text-sm text-slate-300">
              Platform Admin access is enabled for this wallet. Platform setup and integration controls are available from the Admin page.
            </div>
          </Panel>
        ) : null}

        <Panel
          title="Wallet Profile"
          eyebrow="Personal control center"
          action={
            <div className="flex flex-wrap gap-2">
              <button onClick={copyAddress} disabled={!address} className="inline-flex items-center gap-2 rounded-lg border border-cyan/30 px-3 py-2 text-xs font-semibold text-cyan hover:bg-cyan/10 disabled:cursor-not-allowed disabled:opacity-50">
                <Copy className="h-4 w-4" /> Copy Wallet
              </button>
              <button onClick={() => portfolio.refresh()} disabled={!isConnected} className="inline-flex items-center gap-2 rounded-lg border border-mint/30 px-3 py-2 text-xs font-semibold text-mint hover:bg-mint/10 disabled:cursor-not-allowed disabled:opacity-50">
                <RefreshCw className={cx("h-4 w-4", portfolio.refreshing ? "animate-spin" : "")} /> Refresh Portfolio
              </button>
              <button onClick={() => disconnect()} disabled={!isConnected} className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50">
                <LogOut className="h-4 w-4" /> Disconnect
              </button>
            </div>
          }
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-cyan/30 shadow-neon" style={avatarStyle(address)}>
                <WalletCards className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-mint">{isConnected ? "Connected" : "Not connected"}</p>
                <p className="mt-1 break-all text-xl font-bold text-white">{address ? shortAddress(address) : "Connect wallet to view profile"}</p>
                <p className="mt-2 text-sm text-slate-400">{chain?.name ?? (chainId ? `Chain ${chainId}` : "No network")}</p>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm text-slate-400">Total Portfolio Value</p>
              <p className="mt-2 text-4xl font-bold text-white">{isConnected ? portfolio.totalValueLabel : "--"}</p>
              <p className={cx("mt-2 text-sm font-semibold", isConnected ? (portfolio.dailyChange >= 0 ? "text-mint" : "text-red-200") : "text-slate-500")}>{isConnected ? portfolio.dailyChangeLabel : "--"} Daily change</p>
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="Total Transactions" value={statValue(stats.total)} detail="Velora AI activity" icon={WalletCards} />
          <MetricCard title="Total Swaps" value={statValue(stats.swaps)} detail="Swap records" icon={WalletCards} />
          <MetricCard title="Total Bridges" value={statValue(stats.bridges)} detail="Bridge records" icon={WalletCards} />
          <MetricCard title="Total Agent Payments" value={statValue(stats.agentPayments)} detail="Agent payment activity" icon={WalletCards} />
          <MetricCard title="Total Automation Actions" value={statValue(stats.automation)} detail="Approval and automation events" icon={WalletCards} />
        </div>

        <Panel title="Velora Pioneers" eyebrow="Points, level, reputation, streaks, and badges">
          {!isConnected ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-slate-400">Connect wallet to view Pioneer status</div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <Sparkles className="h-5 w-5 text-mint" />
                  <p className="mt-4 text-sm text-slate-400">Total Points</p>
                  <p className="mt-2 text-2xl font-black text-white">{pioneerSummary.totalPoints.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <Crown className="h-5 w-5 text-cyan" />
                  <p className="mt-4 text-sm text-slate-400">Current Level</p>
                  <p className="mt-2 text-2xl font-black text-white">{pioneerSummary.level.name}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <BadgeCheck className="h-5 w-5 text-cyan" />
                  <p className="mt-4 text-sm text-slate-400">Reputation Score</p>
                  <p className="mt-2 text-2xl font-black text-white">{pioneerSummary.reputation.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <Flame className="h-5 w-5 text-warning" />
                  <p className="mt-4 text-sm text-slate-400">Current Streak</p>
                  <p className="mt-2 text-2xl font-black text-white">{pioneers.currentStreak} Days</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <Award className="h-5 w-5 text-warning" />
                  <p className="mt-4 text-sm text-slate-400">Best Streak</p>
                  <p className="mt-2 text-2xl font-black text-white">{pioneers.bestStreak} Days</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <Award className="h-5 w-5 text-mint" />
                  <p className="mt-4 text-sm text-slate-400">Early Adopter Status</p>
                  <p className="mt-2 text-2xl font-black text-white">{pioneerSummary.earlyAdopterStatus}</p>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-white">Badge Completion</p>
                  <p className="text-sm font-bold text-cyan">{pioneerSummary.badgeCompletion}%</p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-black/30">
                  <div className="h-full rounded-full bg-cyan" style={{ width: `${pioneerSummary.badgeCompletion}%` }} />
                </div>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {pioneerSummary.achievementProgress.map((item) => (
                  <AchievementProgressCard key={item.id} item={item} />
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pioneerSummary.badges.map((badge) => (
                  <PioneerBadgeCard key={badge.id} badge={badge} compact />
                ))}
              </div>
              {!earnedBadges.length ? <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-slate-400">No badges earned yet</div> : null}
              <p className="text-xs leading-6 text-slate-500">Early participation, activity, and contributions may be considered in future Velora ecosystem programs.</p>
            </div>
          )}
        </Panel>

        <Panel
          title="Portfolio"
          eyebrow="Real balances and real activity only"
          action={
            <div className="flex rounded-lg border border-white/10 bg-black/20 p-1">
              {(["positions", "activities"] as ProfileTab[]).map((item) => (
                <button key={item} onClick={() => setTab(item)} className={cx("rounded-md px-4 py-2 text-sm font-semibold capitalize transition", tab === item ? "bg-cyan text-white" : "text-slate-400 hover:text-white")}>
                  {item}
                </button>
              ))}
            </div>
          }
        >
          {tab === "positions" ? (
            !isConnected ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-slate-400">Connect wallet to view profile</div>
            ) : !hasAssets && !portfolio.isLoading ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-slate-400">No assets found</div>
                <HoldingsTable positions={portfolio.positions} />
              </div>
            ) : (
              <HoldingsTable positions={portfolio.positions} />
            )
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={downloadCsv} disabled={!isConnected || !profileActivities.length} className="inline-flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-bold text-cyan hover:border-cyan/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
                  <Download className="h-4 w-4" /> Export Activity CSV
                </button>
              </div>
              <ActivityTimeline records={profileActivities} emptyText="No activity yet" />
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

function HoldingsTable({ positions }: { positions: ReturnType<typeof usePortfolioBalances>["positions"] }) {
  return (
    <div className="scrollbar-soft overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-y-3 text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="px-4 font-medium">Token</th>
            <th className="px-4 font-medium">Balance</th>
            <th className="px-4 font-medium">Price</th>
            <th className="px-4 font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => (
            <tr key={position.token.symbol} className="bg-white/[0.04] text-slate-300">
              <td className="rounded-l-lg px-4 py-4">
                <span className="flex items-center gap-3">
                  <Image src={position.token.logo} alt="" width={28} height={28} />
                  <span>
                    <span className="block font-semibold text-white">{position.token.symbol}</span>
                    <span className="text-xs text-slate-500">{position.token.name}</span>
                  </span>
                </span>
              </td>
              <td className="px-4 py-4 font-semibold text-white">{position.isLoading ? "Loading..." : position.balanceLabel}</td>
              <td className="px-4 py-4">{position.priceLabel}</td>
              <td className="rounded-r-lg px-4 py-4 font-semibold text-white">{position.isLoading ? "--" : position.valueLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
