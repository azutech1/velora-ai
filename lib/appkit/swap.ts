import { ARC_APP_KIT_CHAIN, ArcAppKitSwapToken, CIRCLE_APP_KIT_KEY } from "./config";

export type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  on(event: string, listener: (...args: unknown[]) => void): void;
  removeListener(event: string, listener: (...args: unknown[]) => void): void;
};

export type ArcAppKitSwapParams = {
  tokenIn: ArcAppKitSwapToken;
  tokenOut: ArcAppKitSwapToken;
  amountIn: string;
  slippageBps: number;
  provider?: Eip1193Provider;
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

function normalizeProvider(provider: unknown): Eip1193Provider | null {
  if (!provider || typeof (provider as { request?: unknown }).request !== "function") {
    return null;
  }

  const request = (provider as { request: Eip1193Provider["request"] }).request.bind(provider);
  const on =
    typeof (provider as { on?: unknown }).on === "function"
      ? (provider as { on: Eip1193Provider["on"] }).on.bind(provider)
      : () => undefined;
  const removeListener =
    typeof (provider as { removeListener?: unknown }).removeListener === "function"
      ? (provider as { removeListener: Eip1193Provider["removeListener"] }).removeListener.bind(provider)
      : () => undefined;

  return { request, on, removeListener };
}

function getInjectedProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  return normalizeProvider((window as Window & { ethereum?: unknown }).ethereum);
}

async function createBrowserAdapter(providerFromConnector?: Eip1193Provider) {
  const provider = normalizeProvider(providerFromConnector) ?? getInjectedProvider();
  if (!provider) {
    throw new Error("No injected wallet provider found. Connect a browser wallet before using real App Kit swaps.");
  }

  const { createViemAdapterFromProvider } = await import("@circle-fin/adapter-viem-v2");
  const { ArcTestnet } = await import("@circle-fin/app-kit/chains");

  return createViemAdapterFromProvider({
    provider: provider as unknown as Parameters<typeof createViemAdapterFromProvider>[0]["provider"],
    capabilities: {
      addressContext: "user-controlled",
      supportedChains: [ArcTestnet]
    }
  });
}

async function createSwapParams(params: ArcAppKitSwapParams) {
  const adapter = await createBrowserAdapter(params.provider);
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
