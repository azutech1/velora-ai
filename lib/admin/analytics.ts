import type { ActivityRecord } from "@/lib/activity/types";
import { calculatePioneerSummary } from "@/lib/pioneers/system";

export const ADMIN_ANALYTICS_STORAGE_KEY = "velora:admin-analytics:v1";
const SESSION_STORAGE_KEY = "velora:session-id";
const MAX_EVENTS = 2000;

export type AdminAnalyticsEventType =
  | "page_view"
  | "wallet_connected"
  | "wallet_disconnected"
  | "swap_executed"
  | "bridge_executed"
  | "faucet_opened"
  | "pioneer_checkin"
  | "profile_updated";

export type AdminAnalyticsEvent = {
  id: string;
  type: AdminAnalyticsEventType;
  path: string;
  walletAddress?: string;
  network?: string;
  sessionId: string;
  timestamp: string;
};

export type AdminUserAnalytics = {
  walletAddress: string;
  firstVisitDate: string;
  lastActiveDate: string;
  networkUsed: string;
  recentActivity: string;
  totalSwaps: number;
  totalBridges: number;
  reputationScore: number;
  pioneerLevel: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getOrCreateAnalyticsSessionId() {
  if (typeof window === "undefined") return "server";
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const next = createId("session");
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

export function getAdminAnalyticsEvents(): AdminAnalyticsEvent[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(ADMIN_ANALYTICS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AdminAnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

export function recordAdminAnalyticsEvent(input: Omit<AdminAnalyticsEvent, "id" | "sessionId" | "timestamp"> & { timestamp?: string }) {
  if (!canUseStorage()) return null;

  const sessionId = getOrCreateAnalyticsSessionId();
  const timestamp = input.timestamp ?? new Date().toISOString();
  const events = getAdminAnalyticsEvents();
  const latest = events[0];

  if (
    latest &&
    latest.type === input.type &&
    latest.path === input.path &&
    latest.walletAddress === input.walletAddress?.toLowerCase() &&
    Date.now() - new Date(latest.timestamp).getTime() < 1000
  ) {
    return latest;
  }

  const event: AdminAnalyticsEvent = {
    id: createId("evt"),
    type: input.type,
    path: input.path,
    walletAddress: input.walletAddress?.toLowerCase(),
    network: input.network,
    sessionId,
    timestamp
  };

  window.localStorage.setItem(ADMIN_ANALYTICS_STORAGE_KEY, JSON.stringify([event, ...events].slice(0, MAX_EVENTS)));
  window.dispatchEvent(new Event("velora:admin-analytics-updated"));
  return event;
}

function dateKey(timestamp: string) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function withinDays(timestamp: string, days: number) {
  return Date.now() - new Date(timestamp).getTime() <= days * 24 * 60 * 60 * 1000;
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function normalizeWalletAddress(walletAddress?: string | null) {
  return walletAddress?.trim().toLowerCase();
}

function connectedWalletEvents(events: AdminAnalyticsEvent[]) {
  return events.filter((event) => event.type === "wallet_connected" && Boolean(event.walletAddress));
}

function countActualWalletConnections(events: AdminAnalyticsEvent[]) {
  const activeWalletBySession = new Map<string, string>();

  return [...events]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .reduce((count, event) => {
      if (!event.walletAddress) return count;

      if (event.type === "wallet_disconnected") {
        if (activeWalletBySession.get(event.sessionId) === event.walletAddress) {
          activeWalletBySession.delete(event.sessionId);
        }
        return count;
      }

      if (event.type !== "wallet_connected") return count;
      if (activeWalletBySession.get(event.sessionId) === event.walletAddress) return count;

      activeWalletBySession.set(event.sessionId, event.walletAddress);
      return count + 1;
    }, 0);
}

function countActivity(records: ActivityRecord[], feature: "swap" | "bridge" | "faucet" | "pioneers") {
  return records.filter((record) => record.feature === feature || record.actionType.includes(feature)).length;
}

export function buildDailySeries(events: AdminAnalyticsEvent[], records: ActivityRecord[], days = 30) {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    const key = date.toISOString().slice(0, 10);
    const dayEvents = events.filter((event) => dateKey(event.timestamp) === key);
    const dayRecords = records.filter((record) => dateKey(record.timestamp) === key);

    return {
      key,
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      visitors: unique(dayEvents.map((event) => event.sessionId)).length,
      walletConnections: countActualWalletConnections(dayEvents),
      swaps: countActivity(dayRecords, "swap"),
      bridges: countActivity(dayRecords, "bridge"),
      pageViews: dayEvents.filter((event) => event.type === "page_view").length
    };
  });
}

export function buildAdminUserAnalytics(events: AdminAnalyticsEvent[], records: ActivityRecord[]): AdminUserAnalytics[] {
  const wallets = unique([
    ...events.map((event) => event.walletAddress).filter((wallet): wallet is string => Boolean(wallet)),
    ...records.map((record) => record.walletAddress).filter((wallet) => wallet !== "guest")
  ]);

  return wallets.map((walletAddress) => {
    const walletEvents = events.filter((event) => event.walletAddress === walletAddress);
    const walletRecords = records.filter((record) => record.walletAddress.toLowerCase() === walletAddress);
    const timestamps = [...walletEvents.map((event) => event.timestamp), ...walletRecords.map((record) => record.timestamp)].sort();
    const pioneer = calculatePioneerSummary(walletRecords, { currentStreak: 0, bestStreak: 0 });
    const recent = walletRecords[0];

    return {
      walletAddress,
      firstVisitDate: timestamps[0] ?? "--",
      lastActiveDate: timestamps.at(-1) ?? "--",
      networkUsed: recent?.network ?? walletEvents.at(-1)?.network ?? "Arc Testnet",
      recentActivity: recent?.title ?? "No activity yet",
      totalSwaps: countActivity(walletRecords, "swap"),
      totalBridges: countActivity(walletRecords, "bridge"),
      reputationScore: pioneer.reputation,
      pioneerLevel: pioneer.level.name
    };
  });
}

export function buildAdminOverview(events: AdminAnalyticsEvent[], records: ActivityRecord[]) {
  const wallets = unique(records.map((record) => normalizeWalletAddress(record.walletAddress)).filter((wallet): wallet is string => Boolean(wallet && wallet !== "guest")));
  const eventWallets = unique(connectedWalletEvents(events).map((event) => event.walletAddress).filter((wallet): wallet is string => Boolean(wallet)));
  const todayKey = new Date().toISOString().slice(0, 10);
  const sessionsByDay = new Map<string, Set<string>>();

  events.forEach((event) => {
    const key = dateKey(event.timestamp);
    const set = sessionsByDay.get(key) ?? new Set<string>();
    set.add(event.sessionId);
    sessionsByDay.set(key, set);
  });

  const returningUsers = Array.from(sessionsByDay.values()).reduce((counts, set) => {
    set.forEach((session) => counts.set(session, (counts.get(session) ?? 0) + 1));
    return counts;
  }, new Map<string, number>());

  return {
    totalVisitors: unique(events.map((event) => event.sessionId)).length,
    totalConnectedWallets: countActualWalletConnections(events),
    uniqueWallets: unique([...wallets, ...eventWallets]).length,
    activeUsersToday: unique(events.filter((event) => dateKey(event.timestamp) === todayKey).map((event) => event.sessionId)).length,
    activeUsersThisWeek: unique(events.filter((event) => withinDays(event.timestamp, 7)).map((event) => event.sessionId)).length,
    totalSwaps: countActivity(records, "swap"),
    totalBridges: countActivity(records, "bridge"),
    totalFaucetVisits: events.filter((event) => event.path.includes("/faucet")).length + countActivity(records, "faucet"),
    totalPioneerUsers: unique([...events.filter((event) => event.path.includes("/pioneers")).map((event) => event.sessionId), ...records.filter((record) => record.feature === "pioneers").map((record) => record.walletAddress)]).length,
    returningUsers: Array.from(returningUsers.values()).filter((count) => count > 1).length
  };
}
