export type AssistantIntent = "knowledge" | "help" | "balance" | "rewards" | "profile" | "transaction-history" | "send" | "swap" | "bridge" | "faucet" | "unknown";

export type AssistantAction = "send" | "swap" | "bridge" | "balance" | "rewards" | "dailyReward" | "faucet" | "knowledge" | "profile" | "transactionHistory" | "unknown";

export type ParsedCommand = {
  intentType?: AssistantIntent;
  actionType: AssistantAction;
  amount?: string;
  token?: string;
  destinationAddress?: string;
  sourceChain?: string;
  destinationChain?: string;
  receiveToken?: string;
  question?: string;
  status: string;
  confidence: "high" | "medium" | "low";
};
