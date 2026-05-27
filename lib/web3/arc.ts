import { defineChain, type Address } from "viem";

export const ARC_TESTNET = {
  id: 5042002,
  name: "Arc Testnet",
  rpcUrl: process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network",
  rpcFallbackUrls: (process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_FALLBACK_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
  explorerUrl: process.env.NEXT_PUBLIC_ARC_TESTNET_EXPLORER_URL || "https://testnet.arcscan.app",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  },
  usdcAddress: (process.env.NEXT_PUBLIC_ARC_TESTNET_USDC_ADDRESS || "0x3600000000000000000000000000000000000000") as Address,
  // Add the official Arc Testnet EURC contract address here once Circle/Arc publishes it.
  eurcAddress: (process.env.NEXT_PUBLIC_ARC_TESTNET_EURC_ADDRESS || "0x0000000000000000000000000000000000000000") as Address,
  // Paste the official Arc Testnet USDT address here only after Circle/App Kit confirms support.
  usdtAddress: (process.env.NEXT_PUBLIC_ARC_TESTNET_USDT_ADDRESS || "0x0000000000000000000000000000000000000000") as Address
} as const;

export const arcTestnetChain = defineChain({
  id: ARC_TESTNET.id,
  name: ARC_TESTNET.name,
  nativeCurrency: ARC_TESTNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: [ARC_TESTNET.rpcUrl, ...ARC_TESTNET.rpcFallbackUrls]
    }
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: ARC_TESTNET.explorerUrl
    }
  },
  contracts: {}
});

export function isArcTestnetConfigReady() {
  return Boolean(ARC_TESTNET.id && ARC_TESTNET.rpcUrl && ARC_TESTNET.explorerUrl && ARC_TESTNET.usdcAddress);
}

export function isArcChainId(chainId?: number) {
  return chainId === ARC_TESTNET.id;
}
