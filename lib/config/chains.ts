export type AppChain = {
  id: string;
  chainId: number;
  lifiChainId: number;
  wagmiChainId: number;
  viemChainId: number;
  name: string;
  rpcUrl: string;
  explorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  icon: string;
};

export const APP_CHAINS: AppChain[] = [
  {
    id: "arc-testnet",
    chainId: 5042002,
    lifiChainId: 5042002,
    wagmiChainId: 5042002,
    viemChainId: 5042002,
    name: "Arc Testnet",
    rpcUrl: process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network",
    explorer: process.env.NEXT_PUBLIC_ARC_TESTNET_EXPLORER_URL || "https://testnet.arcscan.app",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    icon: "arc"
  },
  {
    id: "ethereum-sepolia",
    chainId: 11155111,
    lifiChainId: 11155111,
    wagmiChainId: 11155111,
    viemChainId: 11155111,
    name: "Ethereum Sepolia",
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
    explorer: "https://sepolia.etherscan.io",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    icon: "ethereum"
  },
  {
    id: "base-sepolia",
    chainId: 84532,
    lifiChainId: 84532,
    wagmiChainId: 84532,
    viemChainId: 84532,
    name: "Base Sepolia",
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    icon: "base"
  },
  {
    id: "optimism-sepolia",
    chainId: 11155420,
    lifiChainId: 11155420,
    wagmiChainId: 11155420,
    viemChainId: 11155420,
    name: "Optimism Sepolia",
    rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
    explorer: "https://sepolia-optimism.etherscan.io",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    icon: "optimism"
  },
  {
    id: "arbitrum-sepolia",
    chainId: 421614,
    lifiChainId: 421614,
    wagmiChainId: 421614,
    viemChainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorer: "https://sepolia.arbiscan.io",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    icon: "arbitrum"
  }
];

const CHAIN_BY_ID = new Map(APP_CHAINS.map((chain) => [chain.chainId, chain]));
const CHAIN_BY_SLUG = new Map(APP_CHAINS.map((chain) => [chain.id, chain]));

export function getChainById(chainId: number) {
  return CHAIN_BY_ID.get(chainId) ?? null;
}

export function getChainBySlug(slug: string) {
  return CHAIN_BY_SLUG.get(slug) ?? APP_CHAINS[0];
}
