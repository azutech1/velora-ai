import type { Address } from "viem";
import { ARC_EURC_ADDRESS, ARC_USDC_ADDRESS } from "@/lib/web3/chains";

export type SwapTokenCategory = "stablecoin" | "wrapped asset" | "native ecosystem token";

export type SwapToken = {
  symbol: string;
  name: string;
  decimals: number;
  mockBalance: string;
  mockPrice: number;
  contractAddress: Address;
  icon: string;
  category: SwapTokenCategory;
};

const UNCONFIGURED_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

export const SWAP_TOKENS: SwapToken[] = [
  { symbol: "USDC", name: "USD Coin", decimals: 6, mockBalance: "284,920.42", mockPrice: 1, contractAddress: ARC_USDC_ADDRESS, icon: "$", category: "stablecoin" },
  { symbol: "EURC", name: "Euro Coin", decimals: 6, mockBalance: "42,180.10", mockPrice: 1.08, contractAddress: ARC_EURC_ADDRESS, icon: "EUR", category: "stablecoin" },
  { symbol: "USDT", name: "Tether USD", decimals: 6, mockBalance: "18,450.00", mockPrice: 1, contractAddress: UNCONFIGURED_TOKEN_ADDRESS, icon: "USDT", category: "stablecoin" },
  { symbol: "DAI", name: "Dai Stablecoin", decimals: 18, mockBalance: "9,820.44", mockPrice: 1, contractAddress: UNCONFIGURED_TOKEN_ADDRESS, icon: "D", category: "stablecoin" },
  { symbol: "PYUSD", name: "PayPal USD", decimals: 6, mockBalance: "6,210.00", mockPrice: 1, contractAddress: UNCONFIGURED_TOKEN_ADDRESS, icon: "P", category: "stablecoin" },
  { symbol: "cirBTC", name: "Circle Bitcoin", decimals: 8, mockBalance: "0.014", mockPrice: 103500, contractAddress: UNCONFIGURED_TOKEN_ADDRESS, icon: "cB", category: "wrapped asset" },
  { symbol: "WETH", name: "Wrapped Ether", decimals: 18, mockBalance: "12.84", mockPrice: 3850, contractAddress: UNCONFIGURED_TOKEN_ADDRESS, icon: "ETH", category: "wrapped asset" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", decimals: 8, mockBalance: "0.82", mockPrice: 103500, contractAddress: UNCONFIGURED_TOKEN_ADDRESS, icon: "BTC", category: "wrapped asset" },
  { symbol: "AVL", name: "Velora AI Token", decimals: 18, mockBalance: "12,840", mockPrice: 0.08, contractAddress: UNCONFIGURED_TOKEN_ADDRESS, icon: "VAI", category: "native ecosystem token" }
];

export const QUICK_SWAP_PAIRS = [
  ["USDC", "EURC"],
  ["EURC", "USDC"],
  ["USDC", "USDT"],
  ["USDC", "DAI"],
  ["USDC", "PYUSD"],
  ["USDC", "cirBTC"],
  ["USDC", "WETH"],
  ["USDC", "WBTC"],
  ["USDC", "AVL"],
  ["AVL", "USDC"]
] as const;

export const RECENT_SWAP_TOKENS = ["USDC", "EURC", "cirBTC", "AVL"];
export const DEMO_SWAP_VOLUME_24H = "$2.48M";

export function isConfiguredSwapToken(token: SwapToken) {
  return token.contractAddress !== UNCONFIGURED_TOKEN_ADDRESS;
}

export function getSwapToken(symbol: string) {
  return SWAP_TOKENS.find((token) => token.symbol === symbol) ?? SWAP_TOKENS[0];
}

export function estimateDemoSwap(fromSymbol: string, toSymbol: string, amount: string) {
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

  const usdValue = input * from.mockPrice;
  const grossOutput = usdValue / to.mockPrice;
  const priceImpact = Math.min(0.04 + input / 1_000_000, 0.42);
  const output = grossOutput * (1 - priceImpact / 100);
  const minimumReceived = output * 0.995;

  return {
    output,
    usdValue,
    priceImpact,
    minimumReceived,
    networkFee: 0.0038,
    rate: from.mockPrice / to.mockPrice
  };
}

export function formatTokenAmount(value: number, symbol: string) {
  const maximumFractionDigits = ["WETH", "WBTC", "cirBTC"].includes(symbol) ? 6 : 2;
  return `${value.toLocaleString(undefined, { maximumFractionDigits })} ${symbol}`;
}
