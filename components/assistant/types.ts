export type AssistantIntent = "knowledge" | "help" | "balance" | "rewards" | "profile" | "transaction-history" | "automation" | "liquidity" | "send" | "swap" | "bridge" | "faucet" | "unknown";

export type AssistantAction = "send" | "swap" | "bridge" | "liquidity" | "balance" | "rewards" | "dailyReward" | "faucet" | "knowledge" | "profile" | "transactionHistory" | "automation" | "unknown";

export type ParsedCommand = {
  intentType?: AssistantIntent;
  actionType: AssistantAction;
  amount?: string;
  token?: string;
  destinationAddress?: string;
  contactName?: string;
  sourceChain?: string;
  destinationChain?: string;
  receiveToken?: string;
  liquidityAction?: "show" | "add" | "remove";
  question?: string;
  status: string;
  confidence: "high" | "medium" | "low";
};
