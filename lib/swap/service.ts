import type { Hex } from "viem";
import type { ArcAppKitSwapEstimate, ArcAppKitSwapResult } from "@/lib/appkit/swap";
import {
  createTransactionRequestProvider,
  fallbackProvider,
  isValidTransactionRequest,
  type ExecutableRoute,
  type ProviderRouteResult,
  type RouteDiagnostics,
  type RouteExecutionContext,
  type RouteExecutionResult,
  type RouteProvider,
  type RouteQuote,
  type RouteRequest,
  type RouteTransactionRequest
} from "@/lib/routes/router";

type LifiSwapQuote = {
  toAmount: string | null;
  toAmountMin: string | null;
  provider: string;
  gasEstimateUsd: string | null;
  feeEstimateUsd: string | null;
  approvalAddress: string | null;
  transactionRequest: unknown;
};

type LifiQuoteFetcher = () => Promise<LifiSwapQuote>;

type ArcNativeSwapAdapter = {
  estimateSwap: (tokenIn: string, tokenOut: string, amountIn: string, slippageBps: number) => Promise<ArcAppKitSwapEstimate>;
  executeSwap: (tokenIn: string, tokenOut: string, amountIn: string, slippageBps: number, preparedEstimate?: ArcAppKitSwapEstimate) => Promise<ArcAppKitSwapResult>;
};

function isPositiveAmount(amount: string) {
  const parsed = Number(amount);
  return Number.isFinite(parsed) && parsed > 0;
}

function isProviderExecutable(provider: RouteProvider, quote: RouteQuote, request: RouteRequest) {
  return Boolean(provider.execute && quote.raw && request.walletChainId === request.fromChainId && isPositiveAmount(request.amount));
}

function createDiagnostics(request: RouteRequest): RouteDiagnostics {
  return {
    providersTried: [],
    selectedProvider: null,
    failureReasons: {},
    quoteOnlyProviders: {},
    executable: false,
    routeType: request.routeType,
    chainId: request.fromChainId,
    tokenPair: `${request.fromToken.symbol}/${request.toToken.symbol}`
  };
}

function createArcProvider(options: {
  providerName: string;
  supportedChains: number[];
  supportedTokens: string[];
  appKitSwap: ArcNativeSwapAdapter;
}) {
  const supportedTokens = new Set(options.supportedTokens.map((token) => token.toLowerCase()));

  return {
    providerName: options.providerName,
    supportsChain(request: RouteRequest) {
      return options.supportedChains.includes(request.fromChainId) && request.fromChainId === request.toChainId;
    },
    supportsToken(token) {
      return supportedTokens.has(token.symbol.toLowerCase());
    },
    supportsPair(request: RouteRequest) {
      return request.routeType === "swap" && request.fromToken.symbol !== request.toToken.symbol && isPositiveAmount(request.amount);
    },
    async getQuote(request: RouteRequest) {
      const estimate = await options.appKitSwap.estimateSwap(request.fromToken.symbol, request.toToken.symbol, request.amount, Math.round(request.slippage * 100));
      return {
        provider: options.providerName,
        toAmount: estimate.estimatedOutput?.amount ?? null,
        feeEstimateUsd: estimate.fees?.map((fee) => `${fee.amount} ${fee.token}`).join(", ") || null,
        gasEstimateUsd: null,
        raw: estimate
      };
    },
    async buildTransactionRequest() {
      return null;
    },
    isExecutable(quote, transactionRequest, request) {
      return isValidTransactionRequest(transactionRequest, request.walletChainId) || isProviderExecutable(this, quote, request);
    },
    async execute(quote: RouteQuote, request: RouteRequest): Promise<RouteExecutionResult> {
      const estimate = quote.raw as ArcAppKitSwapEstimate;
      const result = await options.appKitSwap.executeSwap(request.fromToken.symbol, request.toToken.symbol, request.amount, Math.round(request.slippage * 100), estimate);
      return {
        txHash: result.txHash as Hex,
        receivedAmount: result.amountOut ?? estimate.estimatedOutput?.amount,
        confirmationStatus: "confirmed",
        raw: result
      };
    }
  } satisfies RouteProvider;
}

function createUnavailableSwapProvider(providerName: string) {
  return {
    providerName,
    supportsChain: () => false,
    supportsToken: () => false,
    supportsPair: () => false,
    async getQuote() {
      throw new Error(`${providerName} is not configured.`);
    },
    async buildTransactionRequest() {
      return null;
    },
    isExecutable: () => false
  } satisfies RouteProvider;
}

export function createArcNativeSwapProvider(appKitSwap: ArcNativeSwapAdapter, arcChainId: number) {
  return createArcProvider({
    providerName: "Arc Native",
    supportedChains: [arcChainId],
    supportedTokens: ["USDC", "EURC", "USDT"],
    appKitSwap
  });
}

export function createCircleStableFxProvider(appKitSwap: ArcNativeSwapAdapter, arcChainId: number) {
  return createArcProvider({
    providerName: "Circle StableFX",
    supportedChains: [arcChainId],
    supportedTokens: ["USDC", "EURC", "USDT"],
    appKitSwap
  });
}

export function createDexAggregatorProvider() {
  return createUnavailableSwapProvider("Arc DEX Aggregator");
}

export function createLifiSwapProvider(fetchQuote: LifiQuoteFetcher, enabled: boolean, arcChainId: number) {
  return createTransactionRequestProvider({
    providerName: "LI.FI Swap",
    routeType: "swap",
    supportedChains: [arcChainId],
    getQuote: async () => {
      if (!enabled) throw new Error("LI.FI disabled.");
      const quote = await fetchQuote();
      return {
        provider: quote.provider,
        toAmount: quote.toAmount,
        toAmountMin: quote.toAmountMin,
        approvalAddress: quote.approvalAddress,
        feeEstimateUsd: quote.feeEstimateUsd,
        gasEstimateUsd: quote.gasEstimateUsd,
        raw: quote
      };
    }
  });
}

export function createSwapServiceProviders(options: {
  appKitSwap: ArcNativeSwapAdapter;
  fetchLifiQuote: LifiQuoteFetcher;
  lifiEnabled: boolean;
  arcChainId: number;
}) {
  return [
    createArcNativeSwapProvider(options.appKitSwap, options.arcChainId),
    createDexAggregatorProvider(),
    createCircleStableFxProvider(options.appKitSwap, options.arcChainId),
    createLifiSwapProvider(options.fetchLifiQuote, options.lifiEnabled, options.arcChainId),
    fallbackProvider
  ];
}

export async function findExecutableSwapRoute(request: RouteRequest, providers: RouteProvider[]): Promise<ProviderRouteResult> {
  const diagnostics = createDiagnostics(request);

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
      const transactionExecutable = provider.isExecutable(quote, transactionRequest, request);
      const providerExecutable = isProviderExecutable(provider, quote, request);

      if (!transactionExecutable && !providerExecutable) {
        const reason = transactionRequest ? "Provider returned an invalid transaction request." : "Provider returned a quote without wallet transaction data.";
        diagnostics.failureReasons[provider.providerName] = reason;
        if (quote.toAmount) diagnostics.quoteOnlyProviders[provider.providerName] = { toAmount: quote.toAmount, reason };
        continue;
      }

      diagnostics.selectedProvider = provider.providerName;
      diagnostics.executable = true;

      const route: ExecutableRoute = {
        routeType: "swap",
        providerName: provider.providerName,
        quote,
        transactionRequest,
        executionMode: transactionRequest ? "transactionRequest" : "provider",
        diagnostics,
        execute: async (context: RouteExecutionContext) => {
          if (transactionRequest) {
            const txHash = await context.sendTransaction(transactionRequest as RouteTransactionRequest);
            return { txHash };
          }
          if (!provider.execute) throw new Error("Provider execution is unavailable.");
          return provider.execute(quote, request);
        }
      };

      return { route, diagnostics };
    } catch (error) {
      diagnostics.failureReasons[provider.providerName] = error instanceof Error ? error.message : "Provider failed.";
    }
  }

  return { route: null, diagnostics };
}

export function parseLifiQuoteRaw(raw: unknown) {
  return raw as LifiSwapQuote | null;
}

export function parseArcNativeQuoteRaw(raw: unknown) {
  return raw as ArcAppKitSwapEstimate | null;
}
