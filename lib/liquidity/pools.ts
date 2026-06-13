import type { ActiveTokenSymbol } from "@/lib/config/tokens";

export type LiquidityPoolId = "usdc-eurc" | "usdc-usdt" | "eurc-usdt";

export type LiquidityPool = {
  id: LiquidityPoolId;
  tokenA: ActiveTokenSymbol;
  tokenB: ActiveTokenSymbol;
  pair: string;
  status: "Testnet Beta" | "Coming Soon";
  availability: "active" | "coming-soon";
  contractAddress: null;
  totalLiquidityLabel: string;
  userLiquidityLabel: string;
  poolShareLabel: string;
};

export const LIQUIDITY_POOL_DISCLAIMER =
  "Liquidity Pools are currently running on testnet. Values, rewards, and pool positions are for testing only and do not represent real yield or financial returns.";

export const LIQUIDITY_CONTRACT_NOTICE =
  "Pool contracts are not integrated yet, so Velora AI can prepare a safe testnet preview but will not request a wallet transaction for add/remove liquidity.";

export const TESTNET_BETA_FOCUS_NOTICE =
  "Velora AI Testnet Beta currently focuses on the USDC ↔ EURC ecosystem on Arc. Additional assets such as USDT will be introduced in future updates.";

export const USDT_COMING_SOON_MESSAGE =
  "USDT support is currently under development and will be available in a future Velora AI update. Testnet Beta currently supports USDC ↔ EURC.";

export const LIQUIDITY_POOLS: LiquidityPool[] = [
  {
    id: "usdc-eurc",
    tokenA: "USDC",
    tokenB: "EURC",
    pair: "USDC / EURC",
    status: "Testnet Beta",
    availability: "active",
    contractAddress: null,
    totalLiquidityLabel: "Awaiting pool contract",
    userLiquidityLabel: "No verified position",
    poolShareLabel: "--"
  },
  {
    id: "usdc-usdt",
    tokenA: "USDC",
    tokenB: "USDT",
    pair: "USDC / USDT",
    status: "Coming Soon",
    availability: "coming-soon",
    contractAddress: null,
    totalLiquidityLabel: "Coming soon",
    userLiquidityLabel: "Not available yet",
    poolShareLabel: "--"
  },
  {
    id: "eurc-usdt",
    tokenA: "EURC",
    tokenB: "USDT",
    pair: "EURC / USDT",
    status: "Coming Soon",
    availability: "coming-soon",
    contractAddress: null,
    totalLiquidityLabel: "Coming soon",
    userLiquidityLabel: "Not available yet",
    poolShareLabel: "--"
  }
];

export const LIQUIDITY_REWARD_TASKS = [
  { id: "first-liquidity", title: "First liquidity added", reward: 2000, availability: "active" },
  { id: "liquidity-usdc-eurc", title: "Add liquidity to USDC/EURC", reward: 1000, availability: "active" },
  { id: "liquidity-usdc-usdt", title: "Add liquidity to USDC/USDT", reward: 1000, availability: "coming-soon" },
  { id: "liquidity-eurc-usdt", title: "Add liquidity to EURC/USDT", reward: 1000, availability: "coming-soon" }
] as const;

export function isLiquidityPoolActive(pool: LiquidityPool) {
  return pool.availability === "active";
}

export function isUsdtRelated(tokenA?: string, tokenB?: string) {
  return tokenA?.toUpperCase() === "USDT" || tokenB?.toUpperCase() === "USDT";
}

export function getLiquidityPool(id: string | undefined) {
  return LIQUIDITY_POOLS.find((pool) => pool.id === id) ?? LIQUIDITY_POOLS[0];
}

export function findLiquidityPoolByTokens(tokenA?: string, tokenB?: string) {
  const a = tokenA?.toUpperCase();
  const b = tokenB?.toUpperCase();
  if (!a || !b) return null;
  return (
    LIQUIDITY_POOLS.find(
      (pool) => (pool.tokenA === a && pool.tokenB === b) || (pool.tokenA === b && pool.tokenB === a)
    ) ?? null
  );
}

export function parseLiquidityPair(command: string) {
  const tokens = Array.from(new Set(command.match(/\b(USDC|EURC|USDT)\b/gi)?.map((token) => token.toUpperCase()) ?? []));
  if (tokens.length >= 2) return findLiquidityPoolByTokens(tokens[0], tokens[1]);
  return null;
}

export function estimatePairedAmount(amount: string | undefined) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return numeric.toLocaleString(undefined, { maximumFractionDigits: 6 });
}
