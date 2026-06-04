import { APP_CHAINS } from "@/lib/config/chains";

export type BridgeNetworkStatus = "supported" | "coming soon";

export type BridgeNetwork = {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  status: BridgeNetworkStatus;
  iconId: string;
};

export const CROSS_CHAIN_NETWORKS: BridgeNetwork[] = [
  ...APP_CHAINS.map((chain) => ({
    id: chain.id,
    name: chain.name,
    chainId: chain.chainId,
    rpcUrl: chain.rpcUrl,
    explorerUrl: chain.explorer,
    status: "supported" as const,
    iconId: chain.icon
  })).filter((network) => ["arc-testnet", "base-sepolia", "ethereum-sepolia", "arbitrum-sepolia"].includes(network.id))
];

export function getBridgeNetwork(id: string) {
  return CROSS_CHAIN_NETWORKS.find((network) => network.id === id) ?? CROSS_CHAIN_NETWORKS[0];
}

export const CROSS_CHAIN_USDC = {
  symbol: "USDC",
  name: "USDC Testnet",
  decimals: 6
};

export const CROSS_CHAIN_EURC = {
  symbol: "EURC",
  name: "EURC Testnet",
  decimals: 6
};
