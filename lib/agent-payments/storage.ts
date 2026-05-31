import type { AgentPaymentExecutionLog, AgentPaymentExecutionResult, AgentPaymentRecord, AgentPaymentRequestInput } from "./types";

export const AGENT_PAYMENTS_STORAGE_KEY = "velora:agent-payments:v1";
export const AGENT_PAYMENTS_UPDATED_EVENT = "velora:agent-payments-updated";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function createAgentPaymentLog(level: AgentPaymentExecutionLog["level"], message: string, details?: string): AgentPaymentExecutionLog {
  return {
    id: createId("log"),
    timestamp: nowIso(),
    level,
    message,
    details
  };
}

function publish(records: AgentPaymentRecord[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AGENT_PAYMENTS_STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(AGENT_PAYMENTS_UPDATED_EVENT, { detail: records }));
}

export function listAgentPayments(): AgentPaymentRecord[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(AGENT_PAYMENTS_STORAGE_KEY);
    const records = raw ? (JSON.parse(raw) as AgentPaymentRecord[]) : [];
    return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}

export function setAgentPayments(records: AgentPaymentRecord[]) {
  publish(records);
}

export function saveAgentPaymentRequest(input: AgentPaymentRequestInput): AgentPaymentRecord {
  const paymentId = createId("pay");
  const record: AgentPaymentRecord = {
    id: paymentId,
    paymentId,
    walletAddress: input.walletAddress?.toLowerCase(),
    agentName: input.agentName,
    serviceName: input.serviceName,
    recipientName: input.recipientName,
    paymentType: input.paymentType ?? "one-time",
    amount: input.amount,
    token: input.token ?? "USDC",
    destination: input.destination,
    network: input.network ?? "Arc Testnet",
    rail: input.rail ?? "Arc Nanopayments",
    status: "pending",
    timestamp: nowIso(),
    executionMode: input.executionMode ?? "x402-resource",
    resourceUrl: input.resourceUrl,
    description: input.description,
    scheduleDate: input.scheduleDate,
    retryCount: 0,
    logs: [createAgentPaymentLog("info", "Payment request created. User approval is required before execution.")]
  };

  const records = [record, ...listAgentPayments()];
  publish(records);
  return record;
}

export function updateAgentPayment(paymentId: string, updater: (record: AgentPaymentRecord) => AgentPaymentRecord): AgentPaymentRecord | null {
  const records = listAgentPayments();
  let updated: AgentPaymentRecord | null = null;
  const nextRecords = records.map((record) => {
    if (record.paymentId !== paymentId) return record;
    updated = updater(record);
    return updated;
  });
  publish(nextRecords);
  return updated;
}

export function approveStoredAgentPayment(paymentId: string) {
  return updateAgentPayment(paymentId, (record) => ({
    ...record,
    status: "approved",
    approvalTime: nowIso(),
    logs: [...record.logs, createAgentPaymentLog("success", "Payment approved by user.")]
  }));
}

export function rejectStoredAgentPayment(paymentId: string, reason: string) {
  return updateAgentPayment(paymentId, (record) => ({
    ...record,
    status: "rejected",
    rejectionTime: nowIso(),
    rejectionReason: reason,
    logs: [...record.logs, createAgentPaymentLog("warning", "Payment rejected by user.", reason)]
  }));
}

export function markAgentPaymentExecuting(paymentId: string, retry = false) {
  return updateAgentPayment(paymentId, (record) => ({
    ...record,
    status: "executing",
    executionStartedAt: nowIso(),
    retryCount: retry ? record.retryCount + 1 : record.retryCount,
    failureReason: undefined,
    failedAt: undefined,
    logs: [...record.logs, createAgentPaymentLog("info", retry ? "Retry started. Verifying Gateway balance before execution." : "Execution started. Verifying Gateway balance before payment.")]
  }));
}

export function completeStoredAgentPayment(paymentId: string, result: AgentPaymentExecutionResult) {
  return updateAgentPayment(paymentId, (record) => ({
    ...record,
    status: "completed",
    completedAt: nowIso(),
    txHash: result.txHash,
    transferId: result.transferId,
    logs: [...record.logs, ...result.logs, createAgentPaymentLog("success", "Payment completed through Circle Gateway.")]
  }));
}

export function failStoredAgentPayment(paymentId: string, result: AgentPaymentExecutionResult) {
  return updateAgentPayment(paymentId, (record) => ({
    ...record,
    status: "failed",
    failedAt: nowIso(),
    failureReason: result.error ?? "Payment execution failed.",
    logs: [...record.logs, ...result.logs, createAgentPaymentLog("error", "Payment execution failed.", result.error)]
  }));
}
