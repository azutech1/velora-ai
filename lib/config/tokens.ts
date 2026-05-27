import type { Address } from "viem";
import { APP_CHAINS } from "./chains";

export type ActiveTokenSymbol = "USDC" | "EURC" | "USDT";

export type AppToken = {
  symbol: ActiveTokenSymbol;
  name: string;
  decimals: number;
  logo: string;
  addresses: Partial<Record<number, Address>>;
};

const ARC_USDC = (process.env.NEXT_PUBLIC_ARC_TESTNET_USDC_ADDRESS || "0x3600000000000000000000000000000000000000") as Address;
const ARC_EURC = (process.env.NEXT_PUBLIC_ARC_TESTNET_EURC_ADDRESS || "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a") as Address;
const ARC_USDT = (process.env.NEXT_PUBLIC_ARC_TESTNET_USDT_ADDRESS || "0x0000000000000000000000000000000000000000") as Address;

export const APP_TOKENS: AppToken[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logo: "/tokens/usdc.svg",
    addresses: {
      5042002: ARC_USDC,
      11155111: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
      84532: "0x036CbD53842c5426634e7929541eC2318f3dCf7e",
      11155420: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
      421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
    }
  },
  {
    symbol: "EURC",
    name: "Euro Coin",
    decimals: 6,
    logo: "/tokens/eurc.svg",
    addresses: {
      5042002: ARC_EURC
    }
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logo: "/tokens/usdt.svg",
    addresses: {
      5042002: ARC_USDT,
      11155111: "0x148b1aB3e2321d79027C4b71B6118e70434B4784"
    }
  }
];

const TOKEN_BY_SYMBOL = new Map(APP_TOKENS.map((token) => [token.symbol, token]));
const TOKEN_BY_CHAIN_AND_ADDRESS = new Map<string, AppToken>();

for (const token of APP_TOKENS) {
  for (const chain of APP_CHAINS) {
    const address = token.addresses[chain.chainId];
    if (!address) continue;
    TOKEN_BY_CHAIN_AND_ADDRESS.set(`${chain.chainId}:${address.toLowerCase()}`, token);
  }
}

export function getTokenBySymbol(symbol: string) {
  return TOKEN_BY_SYMBOL.get(symbol as ActiveTokenSymbol) ?? null;
}

export function getTokenAddress(symbol: string, chainId: number) {
  const token = getTokenBySymbol(symbol);
  if (!token) return null;
  return token.addresses[chainId] ?? null;
}

export function getTokenByAddress(chainId: number, address: string) {
  return TOKEN_BY_CHAIN_AND_ADDRESS.get(`${chainId}:${address.toLowerCase()}`) ?? null;
}
