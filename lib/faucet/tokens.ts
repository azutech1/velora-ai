export type FaucetToken = {
  symbol: string;
  name: string;
  mockBalance: string;
  faucetAmount: string;
  dailyLimit: number;
  cooldownMinutes: number;
  icon: string;
};

export type FaucetClaim = {
  id: string;
  symbol: string;
  amount: string;
  hash: string;
  claimedAt: string;
};

export const FAUCET_TOKENS: FaucetToken[] = [
  { symbol: "USDC", name: "USDC Testnet", mockBalance: "284.20", faucetAmount: "100 test USDC", dailyLimit: 3, cooldownMinutes: 30, icon: "$" },
  { symbol: "EURC", name: "EURC Testnet", mockBalance: "180.50", faucetAmount: "100 test EURC", dailyLimit: 3, cooldownMinutes: 30, icon: "€" },
  { symbol: "cirBTC", name: "cirBTC Testnet", mockBalance: "0.014", faucetAmount: "0.01 test cirBTC", dailyLimit: 2, cooldownMinutes: 60, icon: "₿" },
  { symbol: "AVL", name: "Velora AI Token Testnet", mockBalance: "12,840", faucetAmount: "1,000 test AVL", dailyLimit: 3, cooldownMinutes: 30, icon: "VAI" }
];

export const FAUCET_SAFETY_TEXT = "Faucet tokens are for Arc testnet development only and have no real monetary value.";
export const FAUCET_STORAGE_KEY = "velora:faucetClaims";
export const CIRCLE_FAUCET_URL = "https://faucet.circle.com/";
export const ARC_FAUCET_API_URL = process.env.NEXT_PUBLIC_ARC_FAUCET_API_URL || "";

export function createMockFaucetHash(symbol: string) {
  const entropy = `${symbol}-${Date.now()}-${Math.random()}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return `0xfaucet${symbol.toLowerCase()}${entropy.toString(16).padStart(8, "0")}000000000000000000000000`;
}
