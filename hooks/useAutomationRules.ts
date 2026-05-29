"use client";

import { useMemo, useState } from "react";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import {
  ApprovalRequest,
  AutomationRule,
  getAutomationOverview,
  initialApprovalRequests,
  initialAutomationLogs,
  initialAutomationRules
} from "@/lib/ai/automationRules";

export function useAutomationRules() {
  const { recordActivity } = useActivityRecorder();
  const [rules, setRules] = useState<AutomationRule[]>(initialAutomationRules);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(initialApprovalRequests);
  const [selectedRuleId, setSelectedRuleId] = useState<string>(initialAutomationRules[0]?.id ?? "");

  const selectedRule = useMemo(() => rules.find((rule) => rule.id === selectedRuleId) ?? rules[0], [rules, selectedRuleId]);
  const overview = useMemo(() => getAutomationOverview(rules, approvals), [approvals, rules]);

  function toggleRule(ruleId: string) {
    setRules((current) =>
      current.map((rule) => {
        if (rule.id !== ruleId) return rule;
        const enabled = !rule.enabled;
        const status = enabled ? "active" : "paused";
        recordActivity({
          actionType: enabled ? "automation_rule_enabled" : "automation_rule_disabled",
          title: enabled ? "Automation rule enabled" : "Automation rule disabled",
          description: `${rule.name} was ${enabled ? "enabled" : "paused"}. Manual approval remains required before execution.`,
          feature: "automation",
          token: rule.allowedTokens[0],
          network: rule.allowedChains[0],
          status: "success",
          metadata: { ruleId }
        });
        return { ...rule, enabled, status };
      })
    );
  }

  function createRule(conditionLabel: string, actionLabel: string) {
    const id = `custom-${Date.now()}`;
    const rule: AutomationRule = {
      id,
      name: "Custom approval-first automation",
      trigger: conditionLabel,
      action: actionLabel,
      status: "pending approval",
      riskLevel: "medium",
      lastRun: "Created just now",
      nextCheck: "Manual review",
      enabled: true,
      approvalsPending: 1,
      allowedTokens: ["USDC", "EURC"],
      allowedChains: ["Arc Testnet"],
      maxTransactionAmount: "100 USDC",
      dailySpendLimit: "250 USDC",
      requireManualApproval: true
    };
    const approval: ApprovalRequest = {
      id: `approval-${id}`,
      ruleId: id,
      title: "Approve custom automation rule",
      description: `${conditionLabel} -> ${actionLabel}. Velora AI will only prepare the action after approval.`,
      riskLevel: "medium",
      requestedAt: "Now",
      status: "pending"
    };
    setRules((current) => [rule, ...current]);
    setApprovals((current) => [approval, ...current]);
    setSelectedRuleId(id);
    recordActivity({
      actionType: "automation_rule_created",
      title: "Automation rule created",
      description: "A custom approval-first automation rule was created.",
      feature: "automation",
      token: "USDC",
      network: "Arc Testnet",
      status: "success",
      metadata: { ruleId: id }
    });
    recordActivity({
      actionType: "approval_requested",
      title: "Approval requested",
      description: "Velora AI requested review before preparing a custom automation action.",
      feature: "automation",
      token: "USDC",
      network: "Arc Testnet",
      status: "pending",
      metadata: { ruleId: id }
    });
  }

  function triggerRule(ruleId: string) {
    const rule = rules.find((item) => item.id === ruleId);
    if (!rule) return;
    recordActivity({
      actionType: "automation_triggered",
      title: "Automation rule triggered",
      description: `${rule.name} triggered and created an approval-first review item.`,
      feature: "automation",
      token: rule.allowedTokens[0],
      network: rule.allowedChains[0],
      status: "pending",
      metadata: { ruleId }
    });
  }

  function resolveApproval(approvalId: string, status: "approved" | "rejected") {
    setApprovals((current) => current.map((approval) => (approval.id === approvalId ? { ...approval, status } : approval)));
    const approval = approvals.find((item) => item.id === approvalId);
    recordActivity({
      actionType: status === "approved" ? "approval_approved" : "approval_rejected",
      title: status === "approved" ? "AI approval accepted" : "AI approval rejected",
      description: approval ? approval.title : "An AI approval item was updated.",
      feature: "automation",
      network: "Arc Testnet",
      status: status === "approved" ? "success" : "info",
      metadata: { approvalId }
    });
  }

  return {
    rules,
    approvals,
    logs: initialAutomationLogs,
    overview,
    selectedRule,
    setSelectedRuleId,
    toggleRule,
    createRule,
    triggerRule,
    resolveApproval
  };
}
