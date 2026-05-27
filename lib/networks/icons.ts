export const NETWORK_ICON_PATHS = {
  arc: "/networks/arc.svg",
  ethereum: "/networks/ethereum.svg",
  base: "/networks/base.svg",
  optimism: "/networks/optimism.svg",
  arbitrum: "/networks/arbitrum.svg"
} as const;

export type NetworkIconId = keyof typeof NETWORK_ICON_PATHS;

export function getNetworkIconPath(id: string) {
  return NETWORK_ICON_PATHS[id as NetworkIconId] ?? NETWORK_ICON_PATHS.arc;
}
