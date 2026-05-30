import type { ActivityInput, ActivityRecord } from "@/lib/activity/types";
import type { AgentPaymentRecord } from "@/lib/agent-payments/types";
import { createSupabaseRestClient } from "./client";
import type { DatabaseActivity, DatabaseAgentPayment, DatabaseFaucetClaim, DatabaseReward, DatabaseTransaction, DatabaseUser } from "./types";

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

function toDatabaseAgentPayment(record: AgentPaymentRecord, walletAddress: string): DatabaseAgentPayment {
  return {
    wallet_address: walletAddress.toLowerCase(),
    payment_id: record.paymentId,
    agent_name: record.agentName,
    service_name: record.serviceName,
    recipient_name: record.recipientName ?? null,
    payment_type: record.paymentType,
    amount: record.amount,
    token: record.token,
    destination: record.destination,
    network: record.network,
    rail: record.rail,
    status: record.status,
    execution_mode: record.executionMode,
    resource_url: record.resourceUrl ?? null,
    description: record.description ?? null,
    schedule_date: record.scheduleDate ?? null,
    approval_time: record.approvalTime ?? null,
    rejection_time: record.rejectionTime ?? null,
    rejection_reason: record.rejectionReason ?? null,
    execution_started_at: record.executionStartedAt ?? null,
    completed_at: record.completedAt ?? null,
    failed_at: record.failedAt ?? null,
    failure_reason: record.failureReason ?? null,
    tx_hash: record.txHash ?? null,
    transfer_id: record.transferId ?? null,
    retry_count: record.retryCount,
    logs: record.logs
  };
}

function fromDatabaseAgentPayment(record: DatabaseAgentPayment): AgentPaymentRecord {
  return {
    id: record.payment_id,
    paymentId: record.payment_id,
    agentName: record.agent_name,
    serviceName: record.service_name,
    recipientName: record.recipient_name ?? undefined,
    paymentType: record.payment_type as AgentPaymentRecord["paymentType"],
    amount: record.amount,
    token: "USDC",
    destination: record.destination,
    network: record.network,
    rail: record.rail as AgentPaymentRecord["rail"],
    status: record.status as AgentPaymentRecord["status"],
    timestamp: record.created_at ?? new Date().toISOString(),
    executionMode: record.execution_mode as AgentPaymentRecord["executionMode"],
    resourceUrl: record.resource_url ?? undefined,
    description: record.description ?? undefined,
    scheduleDate: record.schedule_date ?? undefined,
    approvalTime: record.approval_time ?? undefined,
    rejectionTime: record.rejection_time ?? undefined,
    rejectionReason: record.rejection_reason ?? undefined,
    executionStartedAt: record.execution_started_at ?? undefined,
    completedAt: record.completed_at ?? undefined,
    failedAt: record.failed_at ?? undefined,
    failureReason: record.failure_reason ?? undefined,
    txHash: record.tx_hash ?? undefined,
    transferId: record.transfer_id ?? undefined,
    retryCount: record.retry_count,
    logs: Array.isArray(record.logs) ? (record.logs as AgentPaymentRecord["logs"]) : []
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

export async function saveAgentPaymentToDatabase(record: AgentPaymentRecord, walletAddress: string) {
  const client = createSupabaseRestClient();
  if (!client) return null;
  const query = new URLSearchParams({
    wallet_address: `eq.${walletAddress.toLowerCase()}`,
    payment_id: `eq.${record.paymentId}`
  });
  const existing = await client.request<DatabaseAgentPayment[]>(`agent_payment_requests?${query.toString()}`, {
    method: "PATCH",
    body: toDatabaseAgentPayment(record, walletAddress)
  });
  if (existing[0]) return fromDatabaseAgentPayment(existing[0]);

  const result = await client.request<DatabaseAgentPayment[]>("agent_payment_requests", {
    method: "POST",
    body: toDatabaseAgentPayment(record, walletAddress)
  });
  return result[0] ? fromDatabaseAgentPayment(result[0]) : null;
}

export async function updateAgentPaymentInDatabase(record: AgentPaymentRecord, walletAddress: string) {
  const client = createSupabaseRestClient();
  if (!client) return null;
  const query = new URLSearchParams({
    wallet_address: `eq.${walletAddress.toLowerCase()}`,
    payment_id: `eq.${record.paymentId}`
  });
  const result = await client.request<DatabaseAgentPayment[]>(`agent_payment_requests?${query.toString()}`, {
    method: "PATCH",
    body: toDatabaseAgentPayment(record, walletAddress)
  });
  if (result[0]) return fromDatabaseAgentPayment(result[0]);

  const created = await client.request<DatabaseAgentPayment[]>("agent_payment_requests", {
    method: "POST",
    body: toDatabaseAgentPayment(record, walletAddress)
  });
  return created[0] ? fromDatabaseAgentPayment(created[0]) : null;
}

export async function listAgentPaymentsFromDatabase(walletAddress: string, limit = 100, offset = 0) {
  const client = createSupabaseRestClient();
  if (!client) return null;
  const query = new URLSearchParams({
    wallet_address: `eq.${walletAddress.toLowerCase()}`,
    order: "created_at.desc",
    limit: String(limit),
    offset: String(offset)
  });
  const rows = await client.request<DatabaseAgentPayment[]>(`agent_payment_requests?${query.toString()}`);
  return rows.map(fromDatabaseAgentPayment);
}
