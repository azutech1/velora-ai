"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgentPaymentRecipient, AgentPaymentSafetyPolicy } from "@/lib/agent-payments/types";
import {
  AGENT_PAYMENT_POLICY_UPDATED_EVENT,
  getAgentPaymentSafetyPolicy,
  listAgentPaymentRecipients,
  removeAgentPaymentRecipient,
  saveAgentPaymentRecipient,
  saveAgentPaymentSafetyPolicy
} from "@/lib/agent-payments/policy";

export function useAgentPaymentPolicy() {
  const [policy, setPolicy] = useState<AgentPaymentSafetyPolicy>(getAgentPaymentSafetyPolicy);
  const [recipients, setRecipients] = useState<AgentPaymentRecipient[]>([]);

  const refresh = useCallback(() => {
    setPolicy(getAgentPaymentSafetyPolicy());
    setRecipients(listAgentPaymentRecipients());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(AGENT_PAYMENT_POLICY_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(AGENT_PAYMENT_POLICY_UPDATED_EVENT, refresh);
  }, [refresh]);

  const updatePolicy = useCallback((nextPolicy: AgentPaymentSafetyPolicy) => {
    setPolicy(saveAgentPaymentSafetyPolicy(nextPolicy));
  }, []);

  const addRecipient = useCallback((name: string, address: string) => {
    const recipient = saveAgentPaymentRecipient({ name, address });
    refresh();
    return recipient;
  }, [refresh]);

  const removeRecipient = useCallback((id: string) => {
    removeAgentPaymentRecipient(id);
    refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      policy,
      recipients,
      updatePolicy,
      addRecipient,
      removeRecipient,
      refresh
    }),
    [addRecipient, policy, recipients, refresh, removeRecipient, updatePolicy]
  );
}
