import { getBridgeNetwork } from "./networks";

export type BridgeQuote = {
  valid: boolean;
  reason?: string;
  estimatedReceive: number | null;
  bridgeFee: number | null;
  gasEstimate: string | null;
  estimatedTime: string | null;
  route: string | null;
};

export function estimateBridgeQuote(fromId: string, toId: string, amount: string, tokenSymbol = "USDC"): BridgeQuote {
  const from = getBridgeNetwork(fromId);
  const to = getBridgeNetwork(toId);
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return {
      valid: false,
      reason: `Enter a ${tokenSymbol} amount greater than zero.`,
      estimatedReceive: null,
      bridgeFee: null,
      gasEstimate: null,
      estimatedTime: null,
      route: `${from.name} ${tokenSymbol} -> ${to.name} ${tokenSymbol}`
    };
  }

  if (from.id === to.id) {
    return {
      valid: false,
      reason: "Choose different source and destination networks.",
      estimatedReceive: null,
      bridgeFee: null,
      gasEstimate: null,
      estimatedTime: null,
      route: `${from.name} ${tokenSymbol} -> ${to.name} ${tokenSymbol}`
    };
  }

  if (to.status !== "supported") {
    return {
      valid: false,
      reason: "Destination network is not supported yet.",
      estimatedReceive: null,
      bridgeFee: null,
      gasEstimate: null,
      estimatedTime: null,
      route: `${from.name} ${tokenSymbol} -> ${to.name} ${tokenSymbol}`
    };
  }

  return {
    valid: true,
    estimatedReceive: null,
    bridgeFee: null,
    gasEstimate: null,
    estimatedTime: null,
    route: `${from.name} ${tokenSymbol} -> ${to.name} ${tokenSymbol}`
  };
}
