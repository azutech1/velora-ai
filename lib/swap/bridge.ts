import { getBridgeNetwork, type BridgeNetwork } from "./networks";

export type BridgeQuote = {
  valid: boolean;
  reason?: string;
  estimatedReceive: number;
  bridgeFee: number;
  gasEstimate: string;
  estimatedTime: string;
  route: string;
  hashPlaceholder: string;
};

export function createBridgeHashPlaceholder(from: BridgeNetwork, to: BridgeNetwork) {
  return `${from.id}-to-${to.id}-preview-only`;
}

export function estimateBridgeQuote(fromId: string, toId: string, amount: string, tokenSymbol = "USDC"): BridgeQuote {
  const from = getBridgeNetwork(fromId);
  const to = getBridgeNetwork(toId);
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return {
      valid: false,
      reason: `Enter a ${tokenSymbol} amount greater than zero.`,
      estimatedReceive: 0,
      bridgeFee: 0,
      gasEstimate: "Pending",
      estimatedTime: "Pending",
      route: `${from.name} ${tokenSymbol} -> ${to.name} ${tokenSymbol}`,
      hashPlaceholder: createBridgeHashPlaceholder(from, to)
    };
  }

  if (from.id === to.id) {
    return {
      valid: false,
      reason: "Choose different source and destination networks.",
      estimatedReceive: 0,
      bridgeFee: 0,
      gasEstimate: "Pending",
      estimatedTime: "Pending",
      route: `${from.name} ${tokenSymbol} -> ${to.name} ${tokenSymbol}`,
      hashPlaceholder: createBridgeHashPlaceholder(from, to)
    };
  }

  if (to.status !== "supported") {
    return {
      valid: false,
      reason: "Destination network is not supported yet.",
      estimatedReceive: 0,
      bridgeFee: 0,
      gasEstimate: "Pending",
      estimatedTime: "Pending",
      route: `${from.name} ${tokenSymbol} -> ${to.name} ${tokenSymbol}`,
      hashPlaceholder: createBridgeHashPlaceholder(from, to)
    };
  }

  const bridgeFee = Math.max(numericAmount * 0.0015, 0.08);
  const estimatedReceive = Math.max(numericAmount - bridgeFee, 0);

  return {
    valid: true,
    estimatedReceive,
    bridgeFee,
    gasEstimate: "$0.012 demo gas",
    estimatedTime: to.id === "ethereum-sepolia" ? "6-8 min" : "2-4 min",
    route: `${from.name} ${tokenSymbol} -> Estimated preview -> ${to.name} ${tokenSymbol}`,
    hashPlaceholder: createBridgeHashPlaceholder(from, to)
  };
}

// Future integration: replace estimateBridgeQuote and demo flow with calls to the official Arc bridge provider/router contracts.
