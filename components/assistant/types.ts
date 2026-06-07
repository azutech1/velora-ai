export type AssistantAction = "send" | "swap" | "bridge" | "balance" | "rewards" | "dailyReward" | "unknown";

export type ParsedCommand = {
  actionType: AssistantAction;
  amount?: string;
  token?: string;
  destinationAddress?: string;
  sourceChain?: string;
  destinationChain?: string;
  receiveToken?: string;
  status: string;
  confidence: "high" | "medium" | "low";
};
