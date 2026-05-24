export const CIRCLE_APP_KIT_KEY = process.env.NEXT_PUBLIC_CIRCLE_APP_KIT_KEY || "";

export const ARC_APP_KIT_CHAIN = "Arc_Testnet" as const;
export const ARC_APP_KIT_SWAP_TOKENS = ["USDC", "EURC", "cirBTC"] as const;

export type ArcAppKitSwapToken = (typeof ARC_APP_KIT_SWAP_TOKENS)[number];

export function hasCircleAppKitKey() {
  return Boolean(CIRCLE_APP_KIT_KEY && !CIRCLE_APP_KIT_KEY.includes("replace_with"));
}

export function isArcAppKitSwapToken(symbol: string): symbol is ArcAppKitSwapToken {
  return ARC_APP_KIT_SWAP_TOKENS.includes(symbol as ArcAppKitSwapToken);
}

export function isArcAppKitSwapPair(tokenIn: string, tokenOut: string) {
  return tokenIn !== tokenOut && isArcAppKitSwapToken(tokenIn) && isArcAppKitSwapToken(tokenOut);
}
