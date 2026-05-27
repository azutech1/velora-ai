import { ARC_TESTNET } from "@/lib/web3/arc";

export type TradeProviderId = "arc-native" | "lifi" | "preview";
export type TradeProviderStatus = "enabled" | "reserved" | "fallback";

export type TradeProviderRoute = {
  id: TradeProviderId;
  label: string;
  status: TradeProviderStatus;
  description: string;
};

type ProviderPriorityInput = {
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  lifiEnabled: boolean;
};

const ARC_NATIVE_STABLECOIN_PAIRS = new Set(["USDC/EURC", "EURC/USDC"]);

export const ARC_NATIVE_STABLEFX = {
  escrowAddress:
    process.env.NEXT_PUBLIC_ARC_TESTNET_STABLEFX_ESCROW_ADDRESS ||
    "0x867650F5eAe8df91445971f14d89fd84F0C9a9f8",
  permit2Address:
    process.env.NEXT_PUBLIC_ARC_TESTNET_PERMIT2_ADDRESS ||
    "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  enabled: process.env.NEXT_PUBLIC_ARC_NATIVE_STABLEFX_ENABLED === "true"
} as const;

export function isArcNativeStablecoinPair(fromToken: string, toToken: string) {
  return ARC_NATIVE_STABLECOIN_PAIRS.has(`${fromToken.toUpperCase()}/${toToken.toUpperCase()}`);
}

export function shouldPreferArcNativeRoute(input: ProviderPriorityInput) {
  return (
    input.fromChainId === ARC_TESTNET.id &&
    input.toChainId === ARC_TESTNET.id &&
    isArcNativeStablecoinPair(input.fromToken, input.toToken)
  );
}

export function getTradeProviderPriority(input: ProviderPriorityInput): TradeProviderRoute[] {
  const providers: TradeProviderRoute[] = [];

  if (shouldPreferArcNativeRoute(input)) {
    providers.push({
      id: "arc-native",
      label: "Arc-native StableFX",
      status: ARC_NATIVE_STABLEFX.enabled ? "enabled" : "reserved",
      description: ARC_NATIVE_STABLEFX.enabled
        ? "Official Arc-native USDC/EURC route is enabled for this pair."
        : "Arc-native USDC/EURC route is preferred and reserved for official Circle/Arc execution tooling."
    });
  }

  if (input.lifiEnabled) {
    providers.push({
      id: "lifi",
      label: "LI.FI fallback",
      status: "enabled",
      description: "LI.FI is used when the Arc-native adapter is not available or does not return executable route data."
    });
  }

  providers.push({
    id: "preview",
    label: "Preview estimate",
    status: "fallback",
    description: "Safe estimated pricing is shown when no live route is available."
  });

  return providers;
}
