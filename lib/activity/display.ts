import type { ActivityRecord } from "./types";

const MAIN_ACTIVITY_ACTIONS = new Set([
  "swap_completed",
  "swap_pending_hash_missing",
  "swap_failed",
  "bridge_completed",
  "bridge_failed",
  "usdc_send_completed",
  "usdc_send_failed",
  "faucet_claim",
  "avl_testnet_claim",
  "approval_approved",
  "approval_rejected",
  "agent_payment_completed",
  "agent_payment_failed",
  "ai_action_prepared",
  "automation_triggered",
  "ai_automation_created"
]);

export function isMainActivityRecord(record: ActivityRecord) {
  if (record.actionType === "usdc_receive_completed" && record.metadata?.source === "wallet_watcher") return false;
  return MAIN_ACTIVITY_ACTIONS.has(record.actionType);
}

export function getMainActivityRecords(records: ActivityRecord[]) {
  return records.filter(isMainActivityRecord);
}
