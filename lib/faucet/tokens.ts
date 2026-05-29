export type FaucetToken = {
  symbol: string;
  name: string;
  faucetAmount: string;
  dailyLimit: number;
  cooldownMinutes: number;
};

export type FaucetClaim = {
  id: string;
  symbol: string;
  amount: string;
  hash: string;
  claimedAt: string;
};

export const FAUCET_TOKENS: FaucetToken[] = [
  { symbol: "ARC", name: "ARC Testnet", faucetAmount: "10 test ARC", dailyLimit: 3, cooldownMinutes: 30 },
  { symbol: "USDC", name: "USDC Testnet", faucetAmount: "100 test USDC", dailyLimit: 3, cooldownMinutes: 30 },
  { symbol: "EURC", name: "EURC Testnet", faucetAmount: "100 test EURC", dailyLimit: 3, cooldownMinutes: 30 },
  { symbol: "AVL", name: "Velora AI Token Testnet", faucetAmount: "1,000 test AVL", dailyLimit: 3, cooldownMinutes: 30 }
];

export const FAUCET_SAFETY_TEXT = "Faucet tokens are for Arc testnet development only and have no real monetary value.";
export const FAUCET_STORAGE_KEY = "velora:faucetClaims";
export const CIRCLE_FAUCET_URL = "https://faucet.circle.com/";
export const ARC_FAUCET_API_URL = process.env.NEXT_PUBLIC_ARC_FAUCET_API_URL || "";
