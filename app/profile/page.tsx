"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Award, BadgeCheck, Copy, Crown, Download, ExternalLink, Flame, LogOut, RefreshCw, Search, Sparkles, WalletCards } from "lucide-react";
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
import type { ActivityRecord, ActivityStatus } from "@/lib/activity/types";
import { APP_CHAINS, getChainById } from "@/lib/config/chains";
import { explorerTxUrl, shortAddress } from "@/lib/utils/format";

type ProfileTab = "positions" | "activities";

const completedStatuses: ActivityStatus[] = ["success"];
const failedStatuses: ActivityStatus[] = ["failed"];

function avatarStyle(address?: string) {
  const seed = address ?? "velora";
  const hueA = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const hueB = (hueA + 80) % 360;
  return {
    background: `radial-gradient(circle at 30% 25%, hsl(${hueB} 90% 60%), transparent 35%), linear-gradient(135deg, hsl(${hueA} 88% 46%), hsl(${hueB} 80% 38%))`
  };
}

function activityType(record: ActivityRecord) {
  if (record.feature === "swap" || record.actionType.includes("swap")) return "Swap";
  if (record.feature === "bridge" || record.actionType.includes("bridge")) return "Bridge";
  if (record.feature === "agent_payments" || record.actionType.includes("agent_payment")) return "Agent Payment";
  if (record.feature === "automation" || record.actionType.includes("approval")) return "Automation Approval";
  if (record.feature === "send") return "Payment";
  return record.feature.replaceAll("_", " ");
}

function normalizedStatus(status: ActivityStatus) {
  if (completedStatuses.includes(status)) return "Completed";
  if (failedStatuses.includes(status)) return "Failed";
  return "Pending";
}

function statusStyle(status: string) {
  if (status === "Completed") return "border-mint/30 bg-mint/10 text-mint";
  if (status === "Failed") return "border-red-400/30 bg-red-500/10 text-red-200";
  return "border-cyan/30 bg-cyan/10 text-cyan";
}

function metadataText(record: ActivityRecord, key: string) {
  const value = record.metadata?.[key];
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function isEvmHash(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{64}$/.test(value));
}

function activityExplorerUrl(record: ActivityRecord) {
  if (!isEvmHash(record.txHash)) return null;
  const chain = APP_CHAINS.find((item) => item.name === record.network) ?? APP_CHAINS[0];
  return explorerTxUrl(chain.explorer, record.txHash as string);
}

function sourceDestination(record: ActivityRecord) {
  const source = metadataText(record, "fromChain") || metadataText(record, "source") || record.walletAddress;
  const destination =
    metadataText(record, "toChain") ||
    metadataText(record, "destination") ||
    metadataText(record, "recipientName") ||
    metadataText(record, "serviceName") ||
    record.network ||
    "Velora AI";
  return { source, destination };
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
  if (record.actionType === "usdc_receive_completed" && record.metadata?.source === "wallet_watcher") return false;
  if (record.actionType === "usdc_receive_completed" && record.title === "USDC received") return false;
  return true;
}

function ActivitiesTable({ records }: { records: ActivityRecord[] }) {
  if (!records.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
        <Search className="mx-auto h-8 w-8 text-cyan" />
        <p className="mt-4 text-sm text-slate-400">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="scrollbar-soft overflow-x-auto">
      <table className="w-full min-w-[880px] border-separate border-spacing-y-3 text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="px-4 font-medium">Type</th>
            <th className="px-4 font-medium">Source</th>
            <th className="px-4 font-medium">Destination</th>
            <th className="px-4 font-medium">Status</th>
            <th className="px-4 font-medium">Date</th>
            <th className="px-4 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const status = normalizedStatus(record.status);
            const explorerUrl = activityExplorerUrl(record);
            const routeUrl = metadataText(record, "routeExplorerUrl");
            const { source, destination } = sourceDestination(record);
            return (
              <tr key={record.id} className="bg-white/[0.04] text-slate-300">
                <td className="rounded-l-lg px-4 py-4 capitalize text-white">{activityType(record)}</td>
                <td className="max-w-[180px] truncate px-4 py-4" title={source}>{source.startsWith("0x") ? shortAddress(source) : source}</td>
                <td className="max-w-[220px] truncate px-4 py-4" title={destination}>{destination.startsWith("0x") ? shortAddress(destination) : destination}</td>
                <td className="px-4 py-4"><span className={cx("rounded-full border px-2.5 py-1 text-xs font-semibold", statusStyle(status))}>{status}</span></td>
                <td className="px-4 py-4">{new Date(record.timestamp).toLocaleString()}</td>
                <td className="rounded-r-lg px-4 py-4">
                  {explorerUrl || routeUrl ? (
                    <a href={explorerUrl ?? routeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan hover:text-cyan">
                      View Transaction <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-slate-500">No transaction</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
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
              <ActivitiesTable records={profileActivities} />
            </div>
          )}
        </Panel>

        {tab === "activities" ? (
          <Panel title="Activity Timeline" eyebrow="Detailed action feed">
            <ActivityTimeline records={profileActivities} emptyText="No activity yet" />
          </Panel>
        ) : null}
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
