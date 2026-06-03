"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Clock,
  Eye,
  LockKeyhole,
  MousePointerClick,
  Network,
  Radio,
  Repeat,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { MetricCard, Panel } from "@/components/azu/ui";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useAdminMode } from "@/hooks/useAdminMode";
import {
  type AdminAnalyticsEvent,
  buildAdminOverview,
  buildAdminUserAnalytics,
  buildDailySeries,
  getAdminAnalyticsEvents
} from "@/lib/admin/analytics";
import type { ActivityRecord } from "@/lib/activity/types";
import { shortAddress } from "@/lib/utils/format";

function formatDate(value: string) {
  if (!value || value === "--") return "--";
  return new Date(value).toLocaleString();
}

function withinMinutes(timestamp: string, minutes: number) {
  return Date.now() - new Date(timestamp).getTime() <= minutes * 60 * 1000;
}

function withinDays(timestamp: string, days: number) {
  return Date.now() - new Date(timestamp).getTime() <= days * 24 * 60 * 60 * 1000;
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function countPageViews(events: AdminAnalyticsEvent[], matcher: (path: string) => boolean) {
  return events.filter((event) => event.type === "page_view" && matcher(event.path)).length;
}

function eventLabel(event: AdminAnalyticsEvent) {
  if (event.type === "wallet_connected") return "Wallet connected";
  if (event.path.includes("/faucet")) return "Faucet opened";
  if (event.path.includes("/profile")) return "Profile viewed";
  if (event.path.includes("/pioneers")) return "Pioneer page viewed";
  if (event.path.includes("/token")) return "Velora Token viewed";
  if (event.path.includes("/trade")) return "Bridge & Swap viewed";
  return "Page viewed";
}

function activityLabel(record: ActivityRecord) {
  if (record.feature === "swap" || record.actionType.includes("swap")) return "Swap completed";
  if (record.feature === "bridge" || record.actionType.includes("bridge")) return "Bridge completed";
  if (record.feature === "faucet") return "Faucet opened";
  if (record.feature === "pioneers") return "Pioneer check-in";
  return record.title;
}

function EmptyAdminState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

function AdminChart({ data }: { data: ReturnType<typeof buildDailySeries> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="adminVisitors" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#FF2D3D" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={34} />
          <Tooltip contentStyle={{ background: "#090d15", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#e2e8f0" }} />
          <Area type="monotone" dataKey="visitors" name="Daily visitors" stroke="#F97316" strokeWidth={2.5} fill="url(#adminVisitors)" />
          <Area type="monotone" dataKey="walletConnections" name="Wallet connections" stroke="#3B82F6" strokeWidth={2} fill="transparent" />
          <Area type="monotone" dataKey="swaps" name="Swaps" stroke="#10B981" strokeWidth={2} fill="transparent" />
          <Area type="monotone" dataKey="bridges" name="Bridges" stroke="#A855F7" strokeWidth={2} fill="transparent" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PageViewsChart({ rows }: { rows: Array<{ page: string; views: number }> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="page" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} width={34} />
          <Tooltip contentStyle={{ background: "#090d15", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#e2e8f0" }} />
          <Bar dataKey="views" name="Page views" fill="#F97316" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { isAdmin } = useAdminMode();
  const { activities } = useActivityRecorder();
  const [events, setEvents] = useState<AdminAnalyticsEvent[]>([]);

  useEffect(() => {
    const refresh = () => setEvents(getAdminAnalyticsEvents());
    refresh();
    window.addEventListener("velora:admin-analytics-updated", refresh);
    window.addEventListener("velora:activity-updated", refresh);
    return () => {
      window.removeEventListener("velora:admin-analytics-updated", refresh);
      window.removeEventListener("velora:activity-updated", refresh);
    };
  }, []);

  const overview = useMemo(() => buildAdminOverview(events, activities), [activities, events]);
  const users = useMemo(() => buildAdminUserAnalytics(events, activities), [activities, events]);
  const dailySeries = useMemo(() => buildDailySeries(events, activities, 30), [activities, events]);
  const todayKey = new Date().toISOString().slice(0, 10);

  const online = useMemo(() => {
    const online5 = unique(events.filter((event) => withinMinutes(event.timestamp, 5)).map((event) => event.sessionId));
    const online30 = unique(events.filter((event) => withinMinutes(event.timestamp, 30)).map((event) => event.sessionId));
    const online24h = unique(events.filter((event) => withinDays(event.timestamp, 1)).map((event) => event.sessionId));
    return {
      now: online5.length,
      fiveMinutes: online5.length,
      thirtyMinutes: online30.length,
      twentyFourHours: online24h.length
    };
  }, [events]);

  const newUsersToday = useMemo(() => {
    return users.filter((user) => user.firstVisitDate !== "--" && user.firstVisitDate.slice(0, 10) === todayKey).length;
  }, [todayKey, users]);

  const pageViews = useMemo(
    () => [
      { page: "Dashboard", views: countPageViews(events, (path) => path.includes("/dashboard") || path === "/") },
      { page: "Trade", views: countPageViews(events, (path) => path.includes("/trade")) },
      { page: "Faucet", views: countPageViews(events, (path) => path.includes("/faucet")) },
      { page: "Profile", views: countPageViews(events, (path) => path.includes("/profile")) },
      { page: "Token", views: countPageViews(events, (path) => path.includes("/token")) },
      { page: "Pioneers", views: countPageViews(events, (path) => path.includes("/pioneers")) }
    ],
    [events]
  );

  const activityFeed = useMemo(() => {
    const eventRows = events.slice(0, 50).map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
      wallet: event.walletAddress ?? "Visitor",
      action: eventLabel(event),
      status: "Tracked"
    }));
    const activityRows = activities.slice(0, 50).map((record) => ({
      id: record.id,
      timestamp: record.timestamp,
      wallet: record.walletAddress,
      action: activityLabel(record),
      status: record.status
    }));
    return [...eventRows, ...activityRows].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 12);
  }, [activities, events]);

  const topUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => b.reputationScore - a.reputationScore || b.totalSwaps + b.totalBridges - (a.totalSwaps + a.totalBridges))
      .slice(0, 8);
  }, [users]);

  const platformAnalytics = [
    { title: "Total Swaps", value: String(overview.totalSwaps), detail: "Confirmed Velora swap records", icon: Sparkles },
    { title: "Total Bridges", value: String(overview.totalBridges), detail: "Confirmed bridge records", icon: Network },
    { title: "Faucet Visits", value: String(overview.totalFaucetVisits), detail: "Official faucet page opens", icon: MousePointerClick },
    { title: "Profile Visits", value: String(countPageViews(events, (path) => path.includes("/profile"))), detail: "Profile page views", icon: Eye },
    { title: "Token Page Visits", value: String(countPageViews(events, (path) => path.includes("/token"))), detail: "Velora Token views", icon: TrendingUp },
    { title: "AI Page Visits", value: String(countPageViews(events, (path) => path.includes("/agents") || path.includes("/automation") || path.includes("/agent-payments"))), detail: "Coming Soon AI page views", icon: Activity }
  ];

  if (!isConnected) {
    return (
      <AppShell title="Admin" eyebrow="Secure platform analytics">
        <Panel title="Admin access" eyebrow="Wallet access required">
          <EmptyAdminState message="Connect an approved admin wallet to view this page." />
        </Panel>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Admin" eyebrow="Secure platform analytics">
        <Panel title="Access Denied" eyebrow="Restricted route">
          <div className="rounded-xl border border-red-400/25 bg-red-500/[0.08] p-8 text-center">
            <LockKeyhole className="mx-auto h-9 w-9 text-red-200" />
            <h2 className="mt-4 text-2xl font-black text-white">Access Denied</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">You do not have permission to view this page.</p>
            <Link href="/dashboard" className="mt-5 inline-flex rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white hover:border-orange/40">
              Return to Dashboard
            </Link>
          </div>
        </Panel>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin Analytics" eyebrow="Admin-only platform statistics">
      <div className="space-y-6">
        <Panel title="Secure Admin Dashboard" eyebrow="Private analytics for approved Velora admin wallets">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-orange/25 bg-orange/10 p-4">
              <p className="text-sm text-slate-300">Admin wallet</p>
              <p className="mt-2 break-all font-bold text-white">{address ? shortAddress(address) : "--"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">Privacy boundary</p>
              <p className="mt-2 font-bold text-white">Admin wallet gated</p>
            </div>
            <div className="rounded-xl border border-mint/20 bg-mint/10 p-4">
              <p className="text-sm text-slate-300">Status</p>
              <p className="mt-2 font-bold text-white">Analytics active</p>
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="Total Visitors" value={String(overview.totalVisitors)} detail="Unique browser sessions" icon={Users} />
          <MetricCard title="Connected Wallets" value={String(overview.totalConnectedWallets)} detail="Wallet-connected events" icon={Wallet} />
          <MetricCard title="Unique Wallets" value={String(overview.uniqueWallets)} detail="Distinct wallet addresses" icon={ShieldCheck} />
          <MetricCard title="Active Today" value={String(overview.activeUsersToday)} detail="Daily active sessions" icon={CalendarDays} />
          <MetricCard title="Active This Week" value={String(overview.activeUsersThisWeek)} detail="Weekly active sessions" icon={TrendingUp} />
          <MetricCard title="Monthly Active" value={String(unique(events.filter((event) => withinDays(event.timestamp, 30)).map((event) => event.sessionId)).length)} detail="30-day active sessions" icon={BarChart3} />
          <MetricCard title="Online Now" value={String(online.now)} detail="Seen in last 5 minutes" icon={Radio} />
          <MetricCard title="Returning Users" value={String(overview.returningUsers)} detail="Sessions seen more than once" icon={Repeat} />
          <MetricCard title="New Users Today" value={String(newUsersToday)} detail="First activity today" icon={UserPlus} />
          <MetricCard title="Pioneer Users" value={String(overview.totalPioneerUsers)} detail="Pioneer page or check-in activity" icon={Sparkles} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Growth Charts" eyebrow="Daily visitors, wallet connections, swaps, and bridges">
            <AdminChart data={dailySeries} />
          </Panel>
          <Panel title="Traffic Analytics" eyebrow="Most visited pages">
            <PageViewsChart rows={pageViews} />
          </Panel>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Online Users Now" value={String(online.now)} detail="Last 5 minutes" icon={Radio} />
          <MetricCard title="Last 5 Minutes" value={String(online.fiveMinutes)} detail="Active sessions" icon={Clock} />
          <MetricCard title="Last 30 Minutes" value={String(online.thirtyMinutes)} detail="Active sessions" icon={Clock} />
          <MetricCard title="Last 24 Hours" value={String(online.twentyFourHours)} detail="Active sessions" icon={CalendarDays} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {platformAnalytics.map((metric) => (
            <MetricCard key={metric.title} title={metric.title} value={metric.value} detail={metric.detail} icon={metric.icon} />
          ))}
        </div>

        <Panel title="User Analytics" eyebrow="Wallet-level activity summary">
          {users.length ? (
            <div className="scrollbar-soft overflow-x-auto">
              <table className="w-full min-w-[920px] border-separate border-spacing-y-3 text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="px-4 font-medium">Wallet Address</th>
                    <th className="px-4 font-medium">First Visit Date</th>
                    <th className="px-4 font-medium">Last Active Date</th>
                    <th className="px-4 font-medium">Network Used</th>
                    <th className="px-4 font-medium">Recent Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.walletAddress} className="bg-white/[0.04] text-slate-300">
                      <td className="rounded-l-lg px-4 py-4 font-semibold text-white">{shortAddress(user.walletAddress)}</td>
                      <td className="px-4 py-4">{formatDate(user.firstVisitDate)}</td>
                      <td className="px-4 py-4">{formatDate(user.lastActiveDate)}</td>
                      <td className="px-4 py-4">{user.networkUsed}</td>
                      <td className="rounded-r-lg px-4 py-4">{user.recentActivity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyAdminState message="No wallet analytics yet." />
          )}
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel title="Recent Activity Feed" eyebrow="Live admin event stream">
            {activityFeed.length ? (
              <div className="space-y-3">
                {activityFeed.map((item) => (
                  <div key={item.id} className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm md:grid-cols-[1fr_0.9fr_0.7fr]">
                    <div>
                      <p className="font-bold text-white">{item.action}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(item.timestamp)}</p>
                    </div>
                    <p className="break-all text-slate-300">{item.wallet === "Visitor" ? "Visitor" : shortAddress(item.wallet)}</p>
                    <span className="w-fit rounded-full border border-orange/25 bg-orange/10 px-3 py-1 text-xs font-bold text-orange">{item.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyAdminState message="No admin activity events recorded yet." />
            )}
          </Panel>

          <Panel title="Top Users" eyebrow="Wallet leaderboard">
            {topUsers.length ? (
              <div className="space-y-3">
                {topUsers.map((user, index) => (
                  <div key={user.walletAddress} className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm sm:grid-cols-[auto_1fr_auto]">
                    <span className="grid h-8 w-8 place-items-center rounded-lg border border-orange/25 bg-orange/10 font-black text-orange">{index + 1}</span>
                    <div>
                      <p className="font-bold text-white">{shortAddress(user.walletAddress)}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.pioneerLevel} · Reputation {user.reputationScore.toLocaleString()}</p>
                    </div>
                    <p className="text-slate-300">{user.totalSwaps} swaps · {user.totalBridges} bridges</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyAdminState message="No ranked users yet." />
            )}
          </Panel>
        </div>

        <Panel title="Future Analytics Support" eyebrow="Prepared data model">
          <div className="grid gap-4 md:grid-cols-3">
            {["Referral analytics", "Campaign tracking", "Token launch participation", "Community rewards", "Average session duration", "Growth attribution"].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="font-semibold text-white">{item}</p>
                <p className="mt-2 text-sm leading-5 text-slate-400">Prepared for future database-backed analytics.</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
