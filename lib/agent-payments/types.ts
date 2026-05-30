export type AgentPaymentServiceStatus = "available" | "needs setup" | "disabled";

export type AgentPaymentStatus = "pending" | "approved" | "executing" | "completed" | "failed" | "rejected";

export type AgentPaymentExecutionMode = "x402-resource" | "gateway-transfer";

export type AgentPaymentLogLevel = "info" | "success" | "warning" | "error";

export type AgentPaymentType = "one-time" | "recurring" | "scheduled";

export type AgentPaymentService = {
  id: string;
  name: string;
  description: string;
  category: "data" | "risk" | "analytics" | "webhook";
  status: AgentPaymentServiceStatus;
  supportedRails: AgentPaymentRail[];
};

export type AgentPaymentRail = "x402 Payments" | "Circle Gateway" | "Arc Nanopayments" | "Agent-to-Agent Payments";

export type AgentPaymentRecord = {
  id: string;
  paymentId: string;
  agentName: string;
  serviceName: string;
  recipientName?: string;
  paymentType: AgentPaymentType;
  amount: string;
  token: "USDC";
  destination: string;
  network: string;
  rail: AgentPaymentRail;
  status: AgentPaymentStatus;
  timestamp: string;
  executionMode: AgentPaymentExecutionMode;
  resourceUrl?: string;
  description?: string;
  scheduleDate?: string;
  approvalTime?: string;
  rejectionTime?: string;
  rejectionReason?: string;
  executionStartedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  txHash?: string;
  transferId?: string;
  retryCount: number;
  logs: AgentPaymentExecutionLog[];
};

export type AgentPaymentPolicy = {
  agentWalletBalance: string;
  dailySpendLimit: string;
  monthlySpendLimit: string;
  availableBudget: string;
  mode: "prepare-only";
};

export type AgentPaymentSafetyPolicy = {
  perPaymentLimit: string;
  dailySpendLimit: string;
  monthlySpendLimit: string;
  requireAllowlist: boolean;
};

export type AgentPaymentRecipient = {
  id: string;
  name: string;
  address: string;
  createdAt: string;
};

export type AgentPaymentExecutionLog = {
  id: string;
  timestamp: string;
  level: AgentPaymentLogLevel;
  message: string;
  details?: string;
};

export type AgentPaymentRequestInput = {
  agentName: string;
  serviceName: string;
  recipientName?: string;
  amount: string;
  token?: "USDC";
  destination: string;
  network?: string;
  rail?: AgentPaymentRail;
  executionMode?: AgentPaymentExecutionMode;
  resourceUrl?: string;
  paymentType?: AgentPaymentType;
  description?: string;
  scheduleDate?: string;
};

export type AgentPaymentExecutionRequest = Pick<
  AgentPaymentRecord,
  "paymentId" | "agentName" | "serviceName" | "amount" | "token" | "destination" | "network" | "rail" | "executionMode" | "resourceUrl" | "retryCount"
>;

export type AgentPaymentExecutionResult = {
  status: "completed" | "failed";
  txHash?: string;
  transferId?: string;
  gatewayBalanceBefore?: string;
  gatewayBalanceAfter?: string;
  walletBalance?: string;
  amountPaid?: string;
  logs: AgentPaymentExecutionLog[];
  error?: string;
};
