import type { Address } from "viem";
import { getTokenAddress as getConfiguredTokenAddress } from "@/lib/config/tokens";

export type SwapTokenCategory = "stablecoin" | "wrapped asset" | "native ecosystem token";

export type SwapToken = {
  symbol: string;
  name: string;
  decimals: number;
  fallbackPrice: number;
  contractAddress: Address;
  category: SwapTokenCategory;
};

const UNCONFIGURED_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

export const SWAP_TOKENS: SwapToken[] = [
  { symbol: "USDC", name: "USD Coin", decimals: 6, fallbackPrice: 1, contractAddress: (getConfiguredTokenAddress("USDC", 5042002) ?? UNCONFIGURED_TOKEN_ADDRESS) as Address, category: "stablecoin" },
  { symbol: "EURC", name: "Euro Coin", decimals: 6, fallbackPrice: 1.08, contractAddress: (getConfiguredTokenAddress("EURC", 5042002) ?? UNCONFIGURED_TOKEN_ADDRESS) as Address, category: "stablecoin" },
  { symbol: "USDT", name: "Tether USD", decimals: 6, fallbackPrice: 1, contractAddress: (getConfiguredTokenAddress("USDT", 5042002) ?? UNCONFIGURED_TOKEN_ADDRESS) as Address, category: "stablecoin" },
  { symbol: "WETH", name: "Wrapped Ether", decimals: 18, fallbackPrice: 3850, contractAddress: UNCONFIGURED_TOKEN_ADDRESS, category: "wrapped asset" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", decimals: 8, fallbackPrice: 103500, contractAddress: UNCONFIGURED_TOKEN_ADDRESS, category: "wrapped asset" },
  { symbol: "ETH", name: "Ether", decimals: 18, fallbackPrice: 3850, contractAddress: UNCONFIGURED_TOKEN_ADDRESS, category: "wrapped asset" },
  { symbol: "BTC", name: "Bitcoin", decimals: 8, fallbackPrice: 103500, contractAddress: UNCONFIGURED_TOKEN_ADDRESS, category: "wrapped asset" },
  { symbol: "AVL", name: "Velora AI Token", decimals: 18, fallbackPrice: 0.08, contractAddress: UNCONFIGURED_TOKEN_ADDRESS, category: "native ecosystem token" }
];

export const QUICK_SWAP_PAIRS = [
  ["USDC", "EURC"],
  ["EURC", "USDC"],
  ["USDC", "USDT"],
  ["USDT", "USDC"],
  ["USDC", "WETH"],
  ["WETH", "USDC"],
  ["USDC", "WBTC"],
  ["WBTC", "USDC"],
  ["USDC", "AVL"],
  ["AVL", "USDC"],
  ["ETH", "USDC"],
  ["BTC", "USDC"]
] as const;

export const RECENT_SWAP_TOKENS = ["USDC", "EURC", "USDT", "WETH", "AVL"];
export const INDICATIVE_SWAP_VOLUME_24H = "Coming Soon";

export function isConfiguredSwapToken(token: SwapToken) {
  return token.contractAddress !== UNCONFIGURED_TOKEN_ADDRESS;
}

export function getSwapToken(symbol: string) {
  return SWAP_TOKENS.find((token) => token.symbol === symbol) ?? SWAP_TOKENS[0];
}

export function estimateIndicativeSwap(fromSymbol: string, toSymbol: string, amount: string) {
  const from = getSwapToken(fromSymbol);
  const to = getSwapToken(toSymbol);
  const input = Number(amount);
  if (!Number.isFinite(input) || input <= 0 || from.symbol === to.symbol) {
    return {
      output: 0,
      usdValue: 0,
      priceImpact: 0,
      minimumReceived: 0,
      networkFee: 0.0038,
      rate: 0
    };
  }

  const usdValue = input * from.fallbackPrice;
  const grossOutput = usdValue / to.fallbackPrice;
  const priceImpact = Math.min(0.04 + input / 1_000_000, 0.42);
  const output = grossOutput * (1 - priceImpact / 100);
  const minimumReceived = output * 0.995;

  return {
    output,
    usdValue,
    priceImpact,
    minimumReceived,
    networkFee: 0.0038,
    rate: from.fallbackPrice / to.fallbackPrice
  };
}

export function formatTokenAmount(value: number, symbol: string) {
  const maximumFractionDigits = ["WETH", "WBTC", "ETH", "BTC"].includes(symbol) ? 6 : 2;
  return `${value.toLocaleString(undefined, { maximumFractionDigits })} ${symbol}`;
}
