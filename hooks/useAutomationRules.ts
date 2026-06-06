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
  const [logs, setLogs] = useState(initialAutomationLogs);
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

  function getSimulationResult(rule: AutomationRule) {
    switch (rule.id) {
      case "auto-bridge-gas":
        return {
          event: "Rule triggered",
          detail: "Gas estimate condition matched. Bridge quote prepared for manual review.",
          resultStatus: "Ready for review",
          activityTitle: "Automation bridge simulation completed",
          approvalTitle: "Review prepared bridge quote",
          approvalDescription: "Gas estimate condition matched. Review the prepared USDC bridge quote before any wallet action.",
          logStatus: "success" as const
        };
      case "rebalance-treasury":
        return {
          event: "Approval requested",
          detail: "Treasury rebalance recommendation prepared. Manual approval required before execution.",
          resultStatus: "Pending approval",
          activityTitle: "Treasury rebalance simulation completed",
          approvalTitle: "Review treasury rebalance recommendation",
          approvalDescription: "Treasury rebalance recommendation prepared for USDC, EURC, and USDT. Manual approval is required before execution.",
          logStatus: "pending" as const
        };
      case "recurring-payment":
        return {
          event: "Payment prepared",
          detail: "Recurring USDC payment draft prepared for wallet review.",
          resultStatus: "Ready",
          activityTitle: "Recurring payment simulation completed",
          approvalTitle: "Review recurring payment draft",
          approvalDescription: "Recurring USDC payment draft prepared for wallet review. No funds will move without approval.",
          logStatus: "success" as const
        };
      case "eurc-rate":
        return {
          event: "Quote prepared",
          detail: "EURC/USDC quote improved above target. Swap quote prepared for review.",
          resultStatus: "Ready",
          activityTitle: "Swap quote simulation completed",
          approvalTitle: "Review prepared EURC/USDC swap quote",
          approvalDescription: "EURC/USDC quote improved above target. Review the prepared swap quote before any wallet action.",
          logStatus: "success" as const
        };
      case "route-risk":
        return {
          event: "Risk rule triggered",
          detail: "High route risk detected. Risky route paused until manual review.",
          resultStatus: "Paused",
          activityTitle: "Route risk simulation completed",
          approvalTitle: "Review paused risky route",
          approvalDescription: "High route risk was detected. Review the route before enabling any related action.",
          logStatus: "pending" as const
        };
      default:
        return {
          event: "Rule triggered",
          detail: `${rule.name} triggered and created an approval-first review item.`,
          resultStatus: "Ready for review",
          activityTitle: "Automation simulation completed",
          approvalTitle: `Review ${rule.name}`,
          approvalDescription: `${rule.name} triggered in simulation. Review is required before any prepared action.`,
          logStatus: "pending" as const
        };
    }
  }

  function triggerRule(ruleId: string) {
    const rule = rules.find((item) => item.id === ruleId);
    if (!rule) {
      throw new Error("Automation rule not found.");
    }
    const result = getSimulationResult(rule);
    const now = new Date();
    const logId = `simulation-${ruleId}-${now.getTime()}`;

    setLogs((current) => [
      {
        id: logId,
        ruleId,
        event: result.event,
        detail: result.detail,
        resultStatus: result.resultStatus,
        status: result.logStatus,
        timestamp: "Just now"
      },
      ...current
    ]);

    if (rule.requireManualApproval) {
      const approvalId = `approval-${logId}`;
      setApprovals((current) => [
        {
          id: approvalId,
          ruleId,
          title: result.approvalTitle,
          description: result.approvalDescription,
          riskLevel: rule.riskLevel,
          requestedAt: "Just now",
          status: "pending"
        },
        ...current
      ]);
      setRules((current) =>
        current.map((item) =>
          item.id === ruleId
            ? {
                ...item,
                status: "pending approval",
                approvalsPending: item.approvalsPending + 1,
                lastRun: "Simulation just now"
              }
            : item
        )
      );
    } else {
      setRules((current) => current.map((item) => (item.id === ruleId ? { ...item, lastRun: "Simulation just now" } : item)));
    }

    recordActivity({
      actionType: "automation_triggered",
      title: result.activityTitle,
      description: result.detail,
      feature: "automation",
      token: rule.allowedTokens[0],
      network: rule.allowedChains[0],
      status: "pending",
      metadata: { ruleId, simulation: true, logId }
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
    logs,
    overview,
    selectedRule,
    setSelectedRuleId,
    toggleRule,
    createRule,
    triggerRule,
    resolveApproval
  };
}
