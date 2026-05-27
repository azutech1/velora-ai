"use client";

import { useEffect, useState } from "react";
import { Bot, CheckCircle2, Droplets, RadioTower, Wallet } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { VolumeAreaChart } from "@/components/azu/charts";
import { activityLogs, agents, dashboardMetrics, networkSignals, rules, transactions } from "@/components/azu/data";
import { MetricCard, Panel, TransactionsTable } from "@/components/azu/ui";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { useArcNetwork } from "@/hooks/useArcNetwork";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useStablecoinPrices } from "@/hooks/useStablecoinPrices";
import { ARC_EXPLORER_URL } from "@/lib/web3/chains";
import { explorerTxUrl, shortAddress } from "@/lib/utils/format";
import { estimateDemoSwap } from "@/lib/swap/tokens";
import { FAUCET_STORAGE_KEY, FAUCET_TOKENS, type FaucetClaim } from "@/lib/faucet/tokens";
import { CROSS_CHAIN_NETWORKS } from "@/lib/swap/networks";

type StoredTx = {
  hash: string;
  amount: string;
  recipient: string;
  createdAt: string;
};

export default function DashboardPage() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { chainId, expectedChain, isArc } = useArcNetwork();
  const [lastTx, setLastTx] = useState<StoredTx | null>(null);
  const [txCount, setTxCount] = useState(0);
  const [lastFaucetClaim, setLastFaucetClaim] = useState<FaucetClaim | null>(null);
  const { activities, recordActivity } = useActivityRecorder();
  const stablecoinPrices = useStablecoinPrices();
  const eurcRate = estimateDemoSwap("USDC", "EURC", "1").output;
  const faucetDailyLimit = FAUCET_TOKENS.reduce((sum, token) => sum + token.dailyLimit, 0);

  useEffect(() => {
    const raw = window.localStorage.getItem("velora:lastTransaction");
    const count = window.localStorage.getItem("velora:transactionCount");
    const faucetRaw = window.localStorage.getItem(FAUCET_STORAGE_KEY);
    setLastTx(raw ? (JSON.parse(raw) as StoredTx) : null);
    setTxCount(count ? Number(count) : 0);
    setLastFaucetClaim(faucetRaw ? (JSON.parse(faucetRaw) as FaucetClaim[])[0] ?? null : null);
  }, []);

  useEffect(() => {
    recordActivity({
      actionType: "dashboard_viewed",
      title: "Dashboard viewed",
      description: "The Velora AI dashboard was opened.",
      feature: "dashboard",
      network: isConnected ? expectedChain.name : undefined,
      status: "info"
    });
  }, [expectedChain.name, isConnected, recordActivity]);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <Panel title="Wallet connection" eyebrow="Live Web3 status">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-cyan">
                <Wallet className="h-5 w-5" />
                <p className="font-semibold text-white">Connected wallet</p>
              </div>
              <p className="mt-3 break-all text-sm text-slate-400">
                {isConnecting || isReconnecting ? "Connecting..." : isConnected && address ? address : "Disconnected"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Selected network</p>
              <p className="mt-3 font-semibold text-white">{isConnected ? (isArc ? expectedChain.name : `Chain ${chainId}`) : "No wallet network"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Session transactions</p>
              <p className="mt-3 font-semibold text-white">{txCount}</p>
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {dashboardMetrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Analytics overview" eyebrow="Real-time USDC payment intelligence">
            <div className="h-72">
              <VolumeAreaChart />
            </div>
          </Panel>
          <Panel title="AI insights panel" eyebrow="Autonomous finance monitor">
            <div className="space-y-4">
              {[
                ["Spend anomaly", "Nova is 18% under its weekly API payment baseline."],
                ["Fee opportunity", "Arc fees are low. Batch creator payouts within the next hour."],
                ["Risk note", "One new recipient awaits policy confirmation."]
              ].map(([title, text]) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel
          title="Bridge & Swap"
          eyebrow="Unified stablecoin terminal"
          action={
            <Link href="/trade" className="rounded-lg bg-gradient-to-r from-mint to-cyan px-4 py-2 text-sm font-bold text-[#031018] shadow-neon transition hover:scale-[1.02]">
              Open Bridge & Swap
            </Link>
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Active tokens</p>
              <p className="mt-2 text-xl font-bold text-white">USDC, EURC, USDT</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Top pair</p>
              <p className="mt-2 text-xl font-bold text-white">USDC -&gt; EURC</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Supported networks</p>
              <p className="mt-2 text-xl font-bold text-white">{CROSS_CHAIN_NETWORKS.length}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="text-xs text-slate-500">USDC</p>
              <p className="mt-1 font-semibold text-white">${stablecoinPrices.prices.USDC.price.toFixed(4)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="text-xs text-slate-500">EURC</p>
              <p className="mt-1 font-semibold text-white">${stablecoinPrices.prices.EURC.price.toFixed(4)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="text-xs text-slate-500">USDT</p>
              <p className="mt-1 font-semibold text-white">${stablecoinPrices.prices.USDT.price.toFixed(4)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-cyan">
            1 USDC ≈ {eurcRate.toFixed(4)} EURC. Quote mode only - real router/bridge not connected yet.
          </p>
        </Panel>

        <Panel
          title="Testnet Faucet"
          eyebrow="Arc development tokens"
          action={
            <Link href="/faucet" className="rounded-lg border border-mint/30 bg-mint/10 px-4 py-2 text-sm font-bold text-mint transition hover:bg-mint hover:text-[#031018]">
              Open Faucet
            </Link>
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <Droplets className="h-5 w-5 text-cyan" />
              <p className="mt-3 text-sm text-slate-400">Available faucet tokens</p>
              <p className="mt-2 text-xl font-bold text-white">{FAUCET_TOKENS.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Last claim</p>
              <p className="mt-2 text-xl font-bold text-white">{lastFaucetClaim ? lastFaucetClaim.symbol : "None"}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Daily remaining claims</p>
              <p className="mt-2 text-xl font-bold text-white">{faucetDailyLimit}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-cyan">Faucet tokens are for Arc testnet development only and have no real monetary value.</p>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel
            title="Recent Velora Activity"
            eyebrow="Latest 5 recorded actions"
            action={
              <Link href="/activity" className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-bold text-cyan transition hover:border-mint/40 hover:text-mint">
                View Activity
              </Link>
            }
          >
            <ActivityTimeline records={activities.slice(0, 5)} emptyText="No Velora AI activity recorded yet." />
          </Panel>
          <Panel title="AI agent activity">
            <div className="space-y-4">
              {agents.slice(0, 3).map((agent) => (
                <div key={agent.name} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bot className="h-5 w-5 text-cyan" />
                      <div>
                        <p className="font-semibold text-white">{agent.name}</p>
                        <p className="text-xs text-slate-400">{agent.activity}</p>
                      </div>
                    </div>
                    <span className="h-2.5 w-2.5 rounded-full bg-mint shadow-neon" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Arc network status">
            <div className="grid gap-3">
              {networkSignals.map((signal) => (
                <div key={signal.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div>
                    <p className="text-sm text-slate-400">{signal.label}</p>
                    <p className="mt-1 font-bold text-white">{signal.value}</p>
                  </div>
                  <RadioTower className="h-5 w-5 text-mint" />
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Last transaction">
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
                <a className="inline-flex items-center text-sm font-semibold text-cyan hover:text-mint" href={explorerTxUrl(ARC_EXPLORER_URL, lastTx.hash)} target="_blank" rel="noreferrer">
                  Open in ArcScan
                </a>
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-400">No confirmed USDC transaction has been recorded in this browser session yet.</p>
            )}
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
          <Panel title="Automation overview">
            <div className="grid gap-3 md:grid-cols-3">
              {rules.slice(0, 3).map((rule) => (
                <div key={rule.name} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <CheckCircle2 className="h-5 w-5 text-mint" />
                  <div>
                    <p className="text-sm font-semibold text-white">{rule.name}</p>
                    <p className="text-xs text-slate-400">Saved {rule.saved} in reviewed spend</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Recent transactions">
            <TransactionsTable rows={transactions.slice(0, 4)} />
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
          <Panel title="Connected account">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Wallet address</p>
              <p className="mt-2 break-all text-white">{address ?? "Connect a wallet to activate Arc Testnet actions."}</p>
            </div>
          </Panel>
          <Panel title="Live transaction feed">
            <div className="space-y-4">
              {activityLogs.map((log, index) => (
                <div key={log} className="flex gap-3">
                  <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-cyan/30 bg-cyan/10 text-xs text-cyan">{index + 1}</div>
                  <p className="text-sm leading-6 text-slate-300">{log}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
