import type { Address, Hex } from "viem";

export type RouteType = "swap" | "bridge";

export type RouteTransactionRequest = {
  to?: string;
  from?: string;
  data?: string;
  value?: string;
  gas?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  chainId?: number;
};

export type RouteToken = {
  symbol: string;
  address?: string | null;
  decimals: number;
};

export type RouteRequest = {
  routeType: RouteType;
  walletAddress: Address;
  walletChainId: number;
  fromChainId: number;
  toChainId: number;
  fromToken: RouteToken;
  toToken: RouteToken;
  amount: string;
  slippage: number;
  balance?: number | null;
};

export type RouteQuote = {
  toAmount?: string | null;
  toAmountMin?: string | null;
  provider: string;
  approvalAddress?: string | null;
  feeEstimateUsd?: string | null;
  gasEstimateUsd?: string | null;
  raw?: unknown;
};

export type RouteExecutionResult = {
  txHash: Hex;
  approvalTxHash?: Hex | null;
  destinationTxHash?: Hex | null;
  destinationExplorerLink?: string | null;
  completionTime?: string | null;
  receivedAmount?: string;
  confirmationStatus?: "confirmed" | "pending";
  raw?: unknown;
};

export type RouteExecutionContext = {
  sendTransaction: (transactionRequest: RouteTransactionRequest) => Promise<Hex>;
  executeProviderRoute?: () => Promise<RouteExecutionResult>;
};

export type ExecutableRoute = {
  routeType: RouteType;
  providerName: string;
  quote: RouteQuote;
  transactionRequest?: RouteTransactionRequest | null;
  executionMode: "transactionRequest" | "provider";
  execute: (context: RouteExecutionContext) => Promise<RouteExecutionResult>;
  diagnostics: RouteDiagnostics;
};

export type RouteDiagnostics = {
  providersTried: string[];
  selectedProvider: string | null;
  failureReasons: Record<string, string>;
  quoteOnlyProviders: Record<string, { toAmount?: string | null; reason: string }>;
  executable: boolean;
  routeType: RouteType;
  chainId: number;
  tokenPair: string;
};

export type RouteProvider = {
  providerName: string;
  supportsChain(request: RouteRequest): boolean;
  supportsToken(token: RouteToken, chainId: number): boolean;
  supportsPair(request: RouteRequest): boolean;
  getQuote(request: RouteRequest): Promise<RouteQuote>;
  buildTransactionRequest(quote: RouteQuote, request: RouteRequest): Promise<RouteTransactionRequest | null>;
  isExecutable(quote: RouteQuote, transactionRequest: RouteTransactionRequest | null, request: RouteRequest): boolean;
  execute?(quote: RouteQuote, request: RouteRequest): Promise<RouteExecutionResult>;
};

export type SwapProvider = RouteProvider;
export type BridgeProvider = RouteProvider;

export type ProviderRouteResult = {
  route: ExecutableRoute | null;
  diagnostics: RouteDiagnostics;
};

function isPositiveAmount(amount: string) {
  const parsed = Number(amount);
  return Number.isFinite(parsed) && parsed > 0;
}

function isEvmAddress(value: unknown) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isNonEmptyHexData(value: unknown) {
  return typeof value === "string" && /^0x[a-fA-F0-9]+$/.test(value) && value.length > 2;
}

export function isValidTransactionRequest(transactionRequest: RouteTransactionRequest | null | undefined, walletChainId: number) {
  return Boolean(
    isEvmAddress(transactionRequest?.to) &&
      isNonEmptyHexData(transactionRequest?.data) &&
      (transactionRequest?.chainId ?? walletChainId) === walletChainId
  );
}

export function createUnavailableProvider(providerName = "Configured Fallback Provider"): RouteProvider {
  return {
    providerName,
    supportsChain: () => false,
    supportsToken: () => false,
    supportsPair: () => false,
    async getQuote() {
      throw new Error("Provider is not configured.");
    },
    async buildTransactionRequest() {
      return null;
    },
    isExecutable: () => false
  };
}

export const fallbackProvider = createUnavailableProvider();

export function createTransactionRequestProvider(options: {
  providerName: string;
  routeType: RouteType;
  supportedChains?: number[];
  getQuote: (request: RouteRequest) => Promise<RouteQuote>;
}) {
  const supportedChains = options.supportedChains;

  return {
    providerName: options.providerName,
    supportsChain(request: RouteRequest) {
      if (!supportedChains?.length) return true;
      return supportedChains.includes(request.fromChainId) && supportedChains.includes(request.toChainId);
    },
    supportsToken(token: RouteToken) {
      return Boolean(token.address && token.address.startsWith("0x"));
    },
    supportsPair(request: RouteRequest) {
      if (request.routeType !== options.routeType) return false;
      if (request.fromToken.symbol === request.toToken.symbol && request.fromChainId === request.toChainId) return false;
      return isPositiveAmount(request.amount);
    },
    async getQuote(request: RouteRequest) {
      return options.getQuote(request);
    },
    async buildTransactionRequest(quote: RouteQuote) {
      return (quote.raw as { transactionRequest?: RouteTransactionRequest | null } | undefined)?.transactionRequest ?? null;
    },
    isExecutable(_quote: RouteQuote, transactionRequest: RouteTransactionRequest | null, request: RouteRequest) {
      return isValidTransactionRequest(transactionRequest, request.walletChainId);
    }
  } satisfies RouteProvider;
}

export function createProviderExecutionRoute(options: {
  providerName: string;
  routeType: RouteType;
  supportedChains: number[];
  supportedTokens: string[];
  getQuote: (request: RouteRequest) => Promise<RouteQuote>;
  execute: (quote: RouteQuote, request: RouteRequest) => Promise<RouteExecutionResult>;
}) {
  const supportedTokens = new Set(options.supportedTokens.map((token) => token.toLowerCase()));

  return {
    providerName: options.providerName,
    supportsChain(request: RouteRequest) {
      return options.supportedChains.includes(request.fromChainId) && options.supportedChains.includes(request.toChainId);
    },
    supportsToken(token: RouteToken) {
      return supportedTokens.has(token.symbol.toLowerCase());
    },
    supportsPair(request: RouteRequest) {
      if (request.routeType !== options.routeType) return false;
      if (request.fromChainId !== request.toChainId) return false;
      if (request.fromToken.symbol === request.toToken.symbol) return false;
      return isPositiveAmount(request.amount);
    },
    async getQuote(request: RouteRequest) {
      return options.getQuote(request);
    },
    async buildTransactionRequest() {
      return null;
    },
    isExecutable() {
      return false;
    },
    execute: options.execute
  } satisfies RouteProvider;
}

export const arcNativeSwapProvider = createUnavailableProvider("Arc Native Swap");
export const stablefxProvider = createUnavailableProvider("StableFX");
export const lifiSwapProvider = createUnavailableProvider("LI.FI Swap");
export const arcNativeBridgeProvider = createUnavailableProvider("Arc Native Bridge");
export const lifiBridgeProvider = createUnavailableProvider("LI.FI Bridge");

export async function findExecutableRoute(request: RouteRequest, providers: RouteProvider[]): Promise<ProviderRouteResult> {
  const diagnostics: RouteDiagnostics = {
    providersTried: [],
    selectedProvider: null,
    failureReasons: {},
    quoteOnlyProviders: {},
    executable: false,
    routeType: request.routeType,
    chainId: request.fromChainId,
    tokenPair: `${request.fromToken.symbol}/${request.toToken.symbol}`
  };

  if (!isPositiveAmount(request.amount)) {
    diagnostics.failureReasons.input = "Invalid amount.";
    return { route: null, diagnostics };
  }

  if (request.walletChainId !== request.fromChainId) {
    diagnostics.failureReasons.wallet = "Wallet is on the wrong chain.";
    return { route: null, diagnostics };
  }

  if (typeof request.balance === "number" && request.balance < Number(request.amount)) {
    diagnostics.failureReasons.balance = "Insufficient balance.";
    return { route: null, diagnostics };
  }

  for (const provider of providers) {
    diagnostics.providersTried.push(provider.providerName);

    if (!provider.supportsChain(request)) {
      diagnostics.failureReasons[provider.providerName] = "Unsupported chain.";
      continue;
    }

    if (!provider.supportsToken(request.fromToken, request.fromChainId) || !provider.supportsToken(request.toToken, request.toChainId)) {
      diagnostics.failureReasons[provider.providerName] = "Unsupported token.";
      continue;
    }

    if (!provider.supportsPair(request)) {
      diagnostics.failureReasons[provider.providerName] = "Unsupported pair.";
      continue;
    }

    try {
      const quote = await provider.getQuote(request);
      const transactionRequest = await provider.buildTransactionRequest(quote, request);
      const executable = provider.isExecutable(quote, transactionRequest, request);
      if (!executable) {
        const reason = transactionRequest ? "Provider returned an invalid transaction request." : "Provider returned a quote without wallet transaction data.";
        diagnostics.failureReasons[provider.providerName] = reason;
        if (quote.toAmount) {
          diagnostics.quoteOnlyProviders[provider.providerName] = {
            toAmount: quote.toAmount,
            reason
          };
        }
        continue;
      }

      diagnostics.selectedProvider = provider.providerName;
      diagnostics.executable = true;

      return {
        diagnostics,
        route: {
          routeType: request.routeType,
          providerName: provider.providerName,
          quote,
          transactionRequest,
          executionMode: transactionRequest ? "transactionRequest" : "provider",
          diagnostics,
          execute: async (context: RouteExecutionContext) => {
            if (transactionRequest) {
              const txHash = await context.sendTransaction(transactionRequest);
              return { txHash };
            }
            if (context.executeProviderRoute) {
              return context.executeProviderRoute();
            }
            if (provider.execute) {
              return provider.execute(quote, request);
            }
            throw new Error("Provider execution is unavailable.");
          }
        }
      };
    } catch (error) {
      diagnostics.failureReasons[provider.providerName] = error instanceof Error ? error.message : "Provider failed.";
    }
  }

  return { route: null, diagnostics };
}
