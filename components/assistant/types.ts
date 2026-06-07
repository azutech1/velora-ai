export type AssistantAction = "send" | "swap" | "bridge" | "balance" | "rewards" | "dailyReward" | "faucet" | "knowledge" | "unknown";

export type ParsedCommand = {
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
