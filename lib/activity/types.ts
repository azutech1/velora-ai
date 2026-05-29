export type ActivityStatus = "pending" | "success" | "failed" | "info";

export type ActivityFeature =
  | "wallet"
  | "network"
  | "faucet"
  | "social"
  | "swap"
  | "bridge"
  | "send"
  | "automation"
  | "settings"
  | "token"
  | "dashboard";

export type ActivityActionType =
  | "trade_tab_opened"
  | "quote_requested"
  | "arc_native_route_checked"
  | "live_quote_success"
  | "live_quote_failed"
  | "fallback_quote_used"
  | "swap_reviewed"
  | "bridge_reviewed"
  | "quote_failed"
  | "wallet_connect"
  | "wallet_disconnect"
  | "network_switch"
  | "faucet_claim"
  | "avl_testnet_claim"
  | "social_task_opened"
  | "social_task_verified"
  | "social_reward_claimed"
  | "swap_started"
  | "swap_completed"
  | "swap_failed"
  | "bridge_started"
  | "bridge_completed"
  | "bridge_failed"
  | "usdc_send_started"
  | "usdc_send_completed"
  | "usdc_send_failed"
  | "ai_automation_created"
  | "ai_automation_toggled"
  | "ai_agent_viewed"
  | "ai_agent_recommendation_created"
  | "automation_rule_created"
  | "automation_rule_enabled"
  | "automation_rule_disabled"
  | "automation_triggered"
  | "approval_requested"
  | "approval_approved"
  | "approval_rejected"
  | "ai_action_prepared"
  | "ai_action_failed"
  | "settings_updated"
  | "token_page_viewed"
  | "dashboard_viewed";

export type ActivityRecord = {
  id: string;
  walletAddress: string;
  actionType: ActivityActionType;
  title: string;
  description: string;
  feature: ActivityFeature;
  token?: string;
  amount?: string;
  network?: string;
  status: ActivityStatus;
  txHash?: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type ActivityInput = Omit<ActivityRecord, "id" | "walletAddress" | "timestamp"> & {
  walletAddress?: string | null;
  timestamp?: string;
};

export const GUEST_WALLET_KEY = "guest";
