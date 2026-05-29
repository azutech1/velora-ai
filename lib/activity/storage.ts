import { ActivityRecord, ActivityInput, GUEST_WALLET_KEY } from "./types";

export const ACTIVITY_STORAGE_KEY = "velora:activity:v1";
export const MAX_ACTIVITY_PER_WALLET = 500;
const DUPLICATE_WINDOW_MS = 2_500;

function normalizeWallet(walletAddress?: string | null) {
  return walletAddress?.toLowerCase() || GUEST_WALLET_KEY;
}

function createActivityId(record: ActivityInput, walletAddress: string) {
  const entropy = `${walletAddress}-${record.actionType}-${record.feature}-${record.txHash ?? ""}-${Date.now()}-${Math.random()}`;
  return `act_${Array.from(entropy).reduce((sum, char) => sum + char.charCodeAt(0), 0).toString(16)}_${Date.now()}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getAllActivities(): Record<string, ActivityRecord[]> {
  if (!canUseStorage()) return {};

  try {
    const raw = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ActivityRecord[]>) : {};
  } catch {
    return {};
  }
}

export function getActivitiesForWallet(walletAddress?: string | null) {
  const walletKey = normalizeWallet(walletAddress);
  return getAllActivities()[walletKey] ?? [];
}

export function getFlattenedActivities() {
  return Object.values(getAllActivities())
    .flat()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function saveActivity(input: ActivityInput) {
  const walletAddress = normalizeWallet(input.walletAddress);
  const allActivities = getAllActivities();
  const walletRecords = allActivities[walletAddress] ?? [];
  const now = input.timestamp ?? new Date().toISOString();

  const recentDuplicate = walletRecords.find((record) => {
    const age = Date.now() - new Date(record.timestamp).getTime();
    return (
      age < DUPLICATE_WINDOW_MS &&
      record.actionType === input.actionType &&
      record.feature === input.feature &&
      record.status === input.status &&
      record.txHash === input.txHash &&
      record.title === input.title
    );
  });

  if (recentDuplicate) {
    return recentDuplicate;
  }

  const record: ActivityRecord = {
    ...input,
    id: createActivityId(input, walletAddress),
    walletAddress,
    token: input.token ?? "N/A",
    amount: input.amount ?? "N/A",
    network: input.network ?? "N/A",
    timestamp: now
  };

  allActivities[walletAddress] = [record, ...walletRecords].slice(0, MAX_ACTIVITY_PER_WALLET);
  window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(allActivities));
  window.dispatchEvent(new CustomEvent("velora:activity-updated", { detail: record }));
  return record;
}

export function clearActivities(walletAddress?: string | null) {
  if (!canUseStorage()) return;
  if (!walletAddress) {
    window.localStorage.removeItem(ACTIVITY_STORAGE_KEY);
    window.dispatchEvent(new Event("velora:activity-updated"));
    return;
  }

  const allActivities = getAllActivities();
  delete allActivities[normalizeWallet(walletAddress)];
  window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(allActivities));
  window.dispatchEvent(new Event("velora:activity-updated"));
}

export function exportActivitiesToCsv(records: ActivityRecord[]) {
  const headers = ["timestamp", "walletAddress", "actionType", "title", "description", "feature", "token", "amount", "network", "status", "txHash"];
  const rows = records.map((record) =>
    headers
      .map((header) => {
        const value = String(record[header as keyof ActivityRecord] ?? "");
        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

// Future production integration:
// - mirror records to a backend database with wallet signature authentication
// - enrich transaction records with a blockchain indexer
// - expose privacy controls and retention settings before analytics dashboards consume this data
