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
  {
    id: "arc-testnet",
    name: "Arc Testnet",
    chainId: 5042002,
    rpcUrl: "https://rpc.testnet.arc.network",
    explorerUrl: "https://testnet.arcscan.app",
    status: "supported",
    iconId: "arc"
  },
  {
    id: "ethereum-sepolia",
    name: "Ethereum Sepolia",
    chainId: 11155111,
    rpcUrl: "https://ethereum-sepolia-rpc.placeholder",
    explorerUrl: "https://sepolia.etherscan.io",
    status: "supported",
    iconId: "ethereum"
  },
  {
    id: "base-sepolia",
    name: "Base Sepolia",
    chainId: 84532,
    rpcUrl: "https://base-sepolia-rpc.placeholder",
    explorerUrl: "https://sepolia.basescan.org",
    status: "supported",
    iconId: "base"
  },
  {
    id: "optimism-sepolia",
    name: "Optimism Sepolia",
    chainId: 11155420,
    rpcUrl: "https://optimism-sepolia-rpc.placeholder",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    status: "supported",
    iconId: "optimism"
  },
  {
    id: "arbitrum-sepolia",
    name: "Arbitrum Sepolia",
    chainId: 421614,
    rpcUrl: "https://arbitrum-sepolia-rpc.placeholder",
    explorerUrl: "https://sepolia.arbiscan.io",
    status: "supported",
    iconId: "arbitrum"
  }
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
