export const TOKEN_ICON_PATHS = {
  USDC: "/tokens/usdc.svg",
  EURC: "/tokens/eurc.svg",
  USDT: "/tokens/usdt.svg",
  WETH: "/tokens/weth.svg",
  WBTC: "/tokens/wbtc.svg",
  ETH: "/tokens/eth.svg",
  BTC: "/tokens/btc.svg",
  ARC: "/tokens/arc-official.jpg",
  AVL: "/brand/velora-mark-dark.png"
} as const;

export type TokenIconSymbol = keyof typeof TOKEN_ICON_PATHS;

export function getTokenIconPath(symbol: string) {
  return TOKEN_ICON_PATHS[symbol as TokenIconSymbol] ?? TOKEN_ICON_PATHS.AVL;
}
