import type { AgentPaymentRecord } from "./types";

export async function listPersistedAgentPayments() {
  const response = await fetch("/api/agent-payments", { cache: "no-store" });
  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as { payments?: AgentPaymentRecord[] } | null;
  return payload?.payments ?? null;
}

export async function createPersistedAgentPayment(payment: AgentPaymentRecord) {
  const response = await fetch("/api/agent-payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment })
  });
  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as { payment?: AgentPaymentRecord | null } | null;
  return payload?.payment ?? null;
}

export async function updatePersistedAgentPayment(payment: AgentPaymentRecord) {
  const response = await fetch("/api/agent-payments", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment })
  });
  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as { payment?: AgentPaymentRecord | null } | null;
  return payload?.payment ?? null;
}
