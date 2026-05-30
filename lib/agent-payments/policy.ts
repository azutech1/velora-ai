import type { AgentPaymentRecipient, AgentPaymentRecord, AgentPaymentSafetyPolicy } from "./types";

export const AGENT_PAYMENT_POLICY_STORAGE_KEY = "velora:agent-payments:policy:v1";
export const AGENT_PAYMENT_RECIPIENTS_STORAGE_KEY = "velora:agent-payments:recipients:v1";
export const AGENT_PAYMENT_POLICY_UPDATED_EVENT = "velora:agent-payments-policy-updated";

export const defaultAgentPaymentSafetyPolicy: AgentPaymentSafetyPolicy = {
  perPaymentLimit: "1",
  dailySpendLimit: "10",
  monthlySpendLimit: "100",
  requireAllowlist: false
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeAddress(address: string) {
  return address.trim().toLowerCase();
}

function publish() {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(AGENT_PAYMENT_POLICY_UPDATED_EVENT));
}

export function getAgentPaymentSafetyPolicy(): AgentPaymentSafetyPolicy {
  if (!canUseStorage()) return defaultAgentPaymentSafetyPolicy;
  try {
    const raw = window.localStorage.getItem(AGENT_PAYMENT_POLICY_STORAGE_KEY);
    return raw ? { ...defaultAgentPaymentSafetyPolicy, ...(JSON.parse(raw) as AgentPaymentSafetyPolicy) } : defaultAgentPaymentSafetyPolicy;
  } catch {
    return defaultAgentPaymentSafetyPolicy;
  }
}

export function saveAgentPaymentSafetyPolicy(policy: AgentPaymentSafetyPolicy) {
  if (!canUseStorage()) return policy;
  window.localStorage.setItem(AGENT_PAYMENT_POLICY_STORAGE_KEY, JSON.stringify(policy));
  publish();
  return policy;
}

export function listAgentPaymentRecipients(): AgentPaymentRecipient[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(AGENT_PAYMENT_RECIPIENTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AgentPaymentRecipient[]) : [];
  } catch {
    return [];
  }
}

export function saveAgentPaymentRecipient(input: Pick<AgentPaymentRecipient, "name" | "address">) {
  const recipient: AgentPaymentRecipient = {
    id: `recipient_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`,
    name: input.name.trim(),
    address: normalizeAddress(input.address),
    createdAt: new Date().toISOString()
  };
  const existing = listAgentPaymentRecipients().filter((item) => normalizeAddress(item.address) !== recipient.address);
  const recipients = [recipient, ...existing];
  if (canUseStorage()) window.localStorage.setItem(AGENT_PAYMENT_RECIPIENTS_STORAGE_KEY, JSON.stringify(recipients));
  publish();
  return recipient;
}

export function removeAgentPaymentRecipient(id: string) {
  const recipients = listAgentPaymentRecipients().filter((recipient) => recipient.id !== id);
  if (canUseStorage()) window.localStorage.setItem(AGENT_PAYMENT_RECIPIENTS_STORAGE_KEY, JSON.stringify(recipients));
  publish();
}

export function isRecipientAllowed(address: string, recipients = listAgentPaymentRecipients()) {
  const normalized = normalizeAddress(address);
  return recipients.some((recipient) => normalizeAddress(recipient.address) === normalized);
}

function amountValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isWithinWindow(timestamp: string, windowMs: number) {
  return Date.now() - new Date(timestamp).getTime() <= windowMs;
}

export function getAgentPaymentSpendUsage(payments: AgentPaymentRecord[]) {
  const spendablePayments = payments.filter((payment) => payment.status === "completed" || payment.status === "approved" || payment.status === "executing");
  const daily = spendablePayments
    .filter((payment) => isWithinWindow(payment.approvalTime ?? payment.completedAt ?? payment.timestamp, 24 * 60 * 60 * 1000))
    .reduce((sum, payment) => sum + amountValue(payment.amount), 0);
  const monthly = spendablePayments
    .filter((payment) => isWithinWindow(payment.approvalTime ?? payment.completedAt ?? payment.timestamp, 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, payment) => sum + amountValue(payment.amount), 0);
  return { daily, monthly };
}

export function validateAgentPaymentApproval(payment: AgentPaymentRecord, payments: AgentPaymentRecord[], policy = getAgentPaymentSafetyPolicy(), recipients = listAgentPaymentRecipients()) {
  const amount = amountValue(payment.amount);
  const perPaymentLimit = amountValue(policy.perPaymentLimit);
  const dailySpendLimit = amountValue(policy.dailySpendLimit);
  const monthlySpendLimit = amountValue(policy.monthlySpendLimit);
  const usage = getAgentPaymentSpendUsage(payments);

  if (perPaymentLimit > 0 && amount > perPaymentLimit) {
    return { allowed: false, reason: `Payment exceeds per-payment limit of ${policy.perPaymentLimit} USDC.` };
  }
  if (dailySpendLimit > 0 && usage.daily + amount > dailySpendLimit) {
    return { allowed: false, reason: `Payment exceeds daily spend limit of ${policy.dailySpendLimit} USDC.` };
  }
  if (monthlySpendLimit > 0 && usage.monthly + amount > monthlySpendLimit) {
    return { allowed: false, reason: `Payment exceeds monthly spend limit of ${policy.monthlySpendLimit} USDC.` };
  }
  if (policy.requireAllowlist && !isRecipientAllowed(payment.destination, recipients)) {
    return { allowed: false, reason: "Recipient is not on the allowlist." };
  }

  return { allowed: true, reason: null };
}
