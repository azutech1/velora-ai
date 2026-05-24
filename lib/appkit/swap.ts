import { ARC_APP_KIT_CHAIN, ArcAppKitSwapToken, CIRCLE_APP_KIT_KEY } from "./config";

export type ArcAppKitSwapParams = {
  tokenIn: ArcAppKitSwapToken;
  tokenOut: ArcAppKitSwapToken;
  amountIn: string;
  slippageBps: number;
};

export type ArcAppKitSwapEstimate = {
  estimatedOutput?: {
    amount: string;
    token: string;
  };
  stopLimit?: {
    amount: string;
    token: string;
  };
  fees?: Array<{
    amount: string;
    token: string;
    type: string;
  }>;
};

export type ArcAppKitSwapResult = {
  txHash: string;
  explorerUrl?: string;
  amountOut?: string;
};

function getInjectedProvider() {
  if (typeof window === "undefined") return null;
  return (window as Window & { ethereum?: unknown }).ethereum;
}

async function createBrowserAdapter() {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("No injected wallet provider found. Connect a browser wallet before using real App Kit swaps.");
  }

  const { createViemAdapterFromProvider } = await import("@circle-fin/adapter-viem-v2");
  return createViemAdapterFromProvider({ provider });
}

async function createSwapParams(params: ArcAppKitSwapParams) {
  const adapter = await createBrowserAdapter();
  return {
    from: { adapter, chain: ARC_APP_KIT_CHAIN },
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: params.amountIn,
    config: {
      kitKey: CIRCLE_APP_KIT_KEY,
      slippageBps: params.slippageBps,
      allowanceStrategy: "permit" as const
    }
  };
}

export async function estimateArcAppKitSwap(params: ArcAppKitSwapParams): Promise<ArcAppKitSwapEstimate> {
  const { AppKit } = await import("@circle-fin/app-kit");
  const kit = new AppKit();
  return kit.estimateSwap(await createSwapParams(params)) as Promise<ArcAppKitSwapEstimate>;
}

export async function executeArcAppKitSwap(params: ArcAppKitSwapParams): Promise<ArcAppKitSwapResult> {
  const { AppKit } = await import("@circle-fin/app-kit");
  const kit = new AppKit();
  return kit.swap(await createSwapParams(params)) as Promise<ArcAppKitSwapResult>;
}
