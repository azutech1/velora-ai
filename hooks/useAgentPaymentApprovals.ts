"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgentPaymentExecutionRequest, AgentPaymentExecutionResult, AgentPaymentRecord } from "@/lib/agent-payments/types";
import { listPersistedAgentPayments, updatePersistedAgentPayment } from "@/lib/agent-payments/database";
import { validateAgentPaymentApproval } from "@/lib/agent-payments/policy";
import {
  AGENT_PAYMENTS_UPDATED_EVENT,
  approveStoredAgentPayment,
  completeStoredAgentPayment,
  failStoredAgentPayment,
  listAgentPayments,
  markAgentPaymentExecuting,
  rejectStoredAgentPayment,
  setAgentPayments
} from "@/lib/agent-payments/storage";
import { useActivityRecorder } from "./useActivityRecorder";
import { useUser } from "./useUser";

function toExecutionRequest(payment: AgentPaymentRecord): AgentPaymentExecutionRequest {
  return {
    paymentId: payment.paymentId,
    agentName: payment.agentName,
    serviceName: payment.serviceName,
    amount: payment.amount,
    token: payment.token,
    destination: payment.destination,
    network: payment.network,
    rail: payment.rail,
    executionMode: payment.executionMode,
    resourceUrl: payment.resourceUrl,
    retryCount: payment.retryCount
  };
}

async function executePayment(payment: AgentPaymentRecord): Promise<AgentPaymentExecutionResult> {
  const response = await fetch("/api/agent-payments/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toExecutionRequest(payment))
  });
  const result = (await response.json().catch(() => null)) as AgentPaymentExecutionResult | null;
  if (!result) {
    return {
      status: "failed",
      error: "Payment executor returned an invalid response.",
      logs: []
    };
  }
  return result;
}

export function useAgentPaymentApprovals() {
  const [payments, setPayments] = useState<AgentPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingPaymentId, setExecutingPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { recordActivity } = useActivityRecorder();
  const { isAuthenticated } = useUser();

  const refresh = useCallback(() => {
    setPayments(listAgentPayments());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(AGENT_PAYMENTS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(AGENT_PAYMENTS_UPDATED_EVENT, refresh);
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    listPersistedAgentPayments()
      .then((persisted) => {
        if (cancelled || !persisted) return;
        const local = listAgentPayments();
        const byId = new Map<string, AgentPaymentRecord>();
        [...local, ...persisted].forEach((payment) => byId.set(payment.paymentId, payment));
        setAgentPayments(Array.from(byId.values()));
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const persistPayment = useCallback(
    (payment: AgentPaymentRecord | null) => {
      if (!payment || !isAuthenticated) return;
      void updatePersistedAgentPayment(payment).catch((persistError) => {
        console.warn("[Velora Agent Payments] Supabase sync failed; local payment retained.", persistError);
      });
    },
    [isAuthenticated]
  );

  const approvePayment = useCallback(
    async (paymentId: string) => {
      setError(null);
      const pending = listAgentPayments().find((payment) => payment.paymentId === paymentId) ?? null;
      if (!pending) {
        setError("Payment approval request was not found.");
        return null;
      }
      const policyCheck = validateAgentPaymentApproval(pending, listAgentPayments());
      if (!policyCheck.allowed) {
        const blocked = rejectStoredAgentPayment(paymentId, policyCheck.reason ?? "Payment policy blocked approval.");
        persistPayment(blocked);
        setError(policyCheck.reason ?? "Payment policy blocked approval.");
        recordActivity({
          actionType: "approval_rejected",
          title: "Agent payment blocked by policy",
          description: policyCheck.reason ?? "Payment policy blocked approval.",
          feature: "agent_payments",
          token: pending.token,
          amount: pending.amount,
          network: pending.network,
          status: "failed",
          metadata: {
            paymentId: pending.paymentId,
            destination: pending.destination,
            paymentType: pending.paymentType
          }
        });
        return blocked;
      }
      const approved = approveStoredAgentPayment(paymentId);
      if (!approved) {
        setError("Payment approval request was not found.");
        return null;
      }
      persistPayment(approved);

      recordActivity({
        actionType: "approval_approved",
        title: "Agent payment approved",
        description: `${approved.agentName} was approved to pay ${approved.serviceName}.`,
        feature: "agent_payments",
        token: approved.token,
        amount: approved.amount,
        network: approved.network,
        status: "success",
        metadata: {
          paymentId: approved.paymentId,
          serviceName: approved.serviceName,
          recipientName: approved.recipientName ?? null,
          paymentType: approved.paymentType,
          destination: approved.destination,
          rail: approved.rail
        }
      });

      const executing = markAgentPaymentExecuting(paymentId);
      if (!executing) return approved;
      persistPayment(executing);
      setExecutingPaymentId(paymentId);

      const result = await executePayment(executing);
      setExecutingPaymentId(null);

      if (result.status === "completed") {
        const completed = completeStoredAgentPayment(paymentId, result);
        persistPayment(completed);
        if (completed) {
          recordActivity({
            actionType: "agent_payment_completed",
            title: "Agent payment completed",
            description: `${completed.agentName} paid ${completed.serviceName} through ${completed.rail}.`,
            feature: "agent_payments",
            token: completed.token,
            amount: completed.amount,
            network: completed.network,
            status: "success",
            txHash: completed.txHash ?? completed.transferId,
            metadata: {
              paymentId: completed.paymentId,
              serviceName: completed.serviceName,
              recipientName: completed.recipientName ?? null,
              paymentType: completed.paymentType,
              destination: completed.destination,
              transferId: completed.transferId ?? null
            }
          });
        }
        return completed;
      }

      const failed = failStoredAgentPayment(paymentId, result);
      persistPayment(failed);
      setError(result.error ?? "Payment execution failed.");
      if (failed) {
        recordActivity({
          actionType: "agent_payment_failed",
          title: "Agent payment failed",
          description: result.error ?? `${failed.agentName} payment execution failed.`,
          feature: "agent_payments",
          token: failed.token,
          amount: failed.amount,
          network: failed.network,
          status: "failed",
          metadata: {
            paymentId: failed.paymentId,
            serviceName: failed.serviceName,
            recipientName: failed.recipientName ?? null,
            paymentType: failed.paymentType,
            destination: failed.destination,
            rail: failed.rail
          }
        });
      }
      return failed;
    },
    [persistPayment, recordActivity]
  );

  const rejectPayment = useCallback(
    (paymentId: string, reason: string) => {
      setError(null);
      const rejected = rejectStoredAgentPayment(paymentId, reason.trim() || "Rejected by user.");
      if (!rejected) {
        setError("Payment approval request was not found.");
        return null;
      }
      persistPayment(rejected);

      recordActivity({
        actionType: "approval_rejected",
        title: "Agent payment rejected",
        description: `${rejected.agentName} payment to ${rejected.serviceName} was rejected.`,
        feature: "agent_payments",
        token: rejected.token,
        amount: rejected.amount,
        network: rejected.network,
        status: "info",
        metadata: {
          paymentId: rejected.paymentId,
          serviceName: rejected.serviceName,
          recipientName: rejected.recipientName ?? null,
          paymentType: rejected.paymentType,
          destination: rejected.destination,
          rejectionReason: rejected.rejectionReason ?? null
        }
      });

      return rejected;
    },
    [persistPayment, recordActivity]
  );

  const retryPayment = useCallback(
    async (paymentId: string) => {
      setError(null);
      const executing = markAgentPaymentExecuting(paymentId, true);
      if (!executing) {
        setError("Failed payment was not found.");
        return null;
      }
      persistPayment(executing);
      setExecutingPaymentId(paymentId);

      const result = await executePayment(executing);
      setExecutingPaymentId(null);

      if (result.status === "completed") {
        const completed = completeStoredAgentPayment(paymentId, result);
        persistPayment(completed);
        return completed;
      }

      setError(result.error ?? "Payment retry failed.");
      const failed = failStoredAgentPayment(paymentId, result);
      persistPayment(failed);
      return failed;
    },
    [persistPayment]
  );

  return useMemo(
    () => ({
      payments,
      pendingApprovals: payments.filter((payment) => payment.status === "pending"),
      recentPayments: payments.filter((payment) => payment.status !== "pending"),
      loading,
      error,
      executingPaymentId,
      approvePayment,
      rejectPayment,
      retryPayment,
      refresh
    }),
    [approvePayment, error, executingPaymentId, loading, payments, refresh, rejectPayment, retryPayment]
  );
}
