import type { ActivityInput, ActivityRecord } from "@/lib/activity/types";
import { createSupabaseRestClient } from "./client";
import type { DatabaseActivity, DatabaseFaucetClaim, DatabaseReward, DatabaseTransaction, DatabaseUser } from "./types";

function toDatabaseActivity(input: ActivityInput, walletAddress: string): DatabaseActivity {
  return {
    wallet_address: walletAddress.toLowerCase(),
    action_type: input.actionType,
    title: input.title,
    description: input.description,
    feature: input.feature,
    token: input.token ?? null,
    amount: input.amount ?? null,
    network: input.network ?? null,
    status: input.status,
    tx_hash: input.txHash ?? null,
    metadata: input.metadata ?? null
  };
}

function fromDatabaseActivity(record: DatabaseActivity): ActivityRecord {
  return {
    id: record.id ?? `${record.wallet_address}-${record.created_at}`,
    walletAddress: record.wallet_address,
    actionType: record.action_type as ActivityRecord["actionType"],
    title: record.title,
    description: record.description,
    feature: record.feature as ActivityRecord["feature"],
    token: record.token ?? undefined,
    amount: record.amount ?? undefined,
    network: record.network ?? undefined,
    status: record.status as ActivityRecord["status"],
    txHash: record.tx_hash ?? undefined,
    timestamp: record.created_at ?? new Date().toISOString(),
    metadata: record.metadata ?? undefined
  };
}

export async function upsertUser(user: DatabaseUser) {
  const client = createSupabaseRestClient();
  if (!client) return null;
  return client.request<DatabaseUser[]>("users?on_conflict=wallet_address", {
    method: "POST",
    body: user
  });
}

export async function saveActivityToDatabase(input: ActivityInput, walletAddress: string) {
  const client = createSupabaseRestClient();
  if (!client) return null;
  const result = await client.request<DatabaseActivity[]>("activity_logs", {
    method: "POST",
    body: toDatabaseActivity(input, walletAddress)
  });
  return result[0] ? fromDatabaseActivity(result[0]) : null;
}

export async function listActivitiesFromDatabase(walletAddress: string, limit = 50, offset = 0) {
  const client = createSupabaseRestClient();
  if (!client) return null;
  const query = new URLSearchParams({
    wallet_address: `eq.${walletAddress.toLowerCase()}`,
    order: "created_at.desc",
    limit: String(limit),
    offset: String(offset)
  });
  const rows = await client.request<DatabaseActivity[]>(`activity_logs?${query.toString()}`);
  return rows.map(fromDatabaseActivity);
}

export async function saveRewardMetadata(reward: DatabaseReward) {
  const client = createSupabaseRestClient();
  if (!client) return null;
  return client.request<DatabaseReward[]>("rewards", { method: "POST", body: reward });
}

export async function saveFaucetClaim(claim: DatabaseFaucetClaim) {
  const client = createSupabaseRestClient();
  if (!client) return null;
  return client.request<DatabaseFaucetClaim[]>("faucet_claims", { method: "POST", body: claim });
}

export async function saveTransaction(transaction: DatabaseTransaction) {
  const client = createSupabaseRestClient();
  if (!client) return null;
  return client.request<DatabaseTransaction[]>("transaction_history", { method: "POST", body: transaction });
}
