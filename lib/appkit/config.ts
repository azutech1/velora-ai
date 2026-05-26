export const CIRCLE_APP_KIT_KEY = process.env.NEXT_PUBLIC_CIRCLE_APP_KIT_KEY || "";

export const ARC_APP_KIT_CHAIN = "Arc_Testnet" as const;
export const ARC_APP_KIT_SWAP_TOKENS = ["USDC", "EURC", "cirBTC", "USDT"] as const;
export const ARC_CIRBTC_ADDRESS = "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF";
export const ARC_USDT_ADDRESS = process.env.NEXT_PUBLIC_ARC_TESTNET_USDT_ADDRESS || "";
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export type ArcAppKitSwapToken = (typeof ARC_APP_KIT_SWAP_TOKENS)[number];

export function hasCircleAppKitKey() {
  return Boolean(CIRCLE_APP_KIT_KEY && !CIRCLE_APP_KIT_KEY.includes("replace_with"));
}

export function isArcAppKitSwapToken(symbol: string): symbol is ArcAppKitSwapToken {
  return ARC_APP_KIT_SWAP_TOKENS.includes(symbol as ArcAppKitSwapToken);
}

export function isArcAppKitTokenSupported(symbol: string) {
  if (symbol === "USDC" || symbol === "EURC" || symbol === "cirBTC") return true;
  if (symbol === "USDT") return Boolean(ARC_USDT_ADDRESS && ARC_USDT_ADDRESS !== ZERO_ADDRESS);
  return false;
}

export function getArcAppKitUnsupportedReason(tokenIn: string, tokenOut: string) {
  if ((tokenIn === "USDT" || tokenOut === "USDT") && !isArcAppKitTokenSupported("USDT")) {
    return "USDT is not supported by App Kit on Arc yet.";
  }

  if (!isArcAppKitSwapToken(tokenIn) || !isArcAppKitSwapToken(tokenOut)) {
    return "This pair is not supported by Circle App Kit on Arc yet.";
  }

  if (!isArcAppKitTokenSupported(tokenIn) || !isArcAppKitTokenSupported(tokenOut)) {
    return "This token is not supported by Circle App Kit on Arc yet.";
  }

  return null;
}

export function isArcAppKitSwapPair(tokenIn: string, tokenOut: string) {
  return (
    tokenIn !== tokenOut &&
    isArcAppKitSwapToken(tokenIn) &&
    isArcAppKitSwapToken(tokenOut) &&
    isArcAppKitTokenSupported(tokenIn) &&
    isArcAppKitTokenSupported(tokenOut)
  );
}
