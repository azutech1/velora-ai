import { parseUnits, type Address, type Hex } from "viem";
import { getChainById } from "@/lib/config/chains";
import { createTransactionRequestProvider, isValidTransactionRequest, type RouteProvider, type RouteQuote } from "@/lib/routes/router";

type CircleBridgeChain = "Arc_Testnet" | "Base_Sepolia" | "Ethereum_Sepolia" | "Arbitrum_Sepolia";

type LifiQuoteFetcher = (params: {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  fromAddress: string;
  slippage: number;
}) => Promise<{
  toAmount: string | null;
  toAmountMin: string | null;
  provider: string;
  gasEstimateUsd: string | null;
  feeEstimateUsd: string | null;
  approvalAddress: string | null;
  transactionRequest: unknown;
}>;

type CircleBridgeStep = {
  name?: string;
  state?: string;
  txHash?: string;
  hash?: string;
  transactionHash?: string;
  explorerUrl?: string;
};

type CircleBridgeResult = {
  state?: "pending" | "success" | "error";
  provider?: string;
  steps?: CircleBridgeStep[];
  txHash?: string;
  hash?: string;
  transactionHash?: string;
  [key: string]: unknown;
};

type CircleBridgeStage =
  | "waitingWalletConfirmation"
  | "sendingTransaction"
  | "waitingForBridgeMessage"
  | "waitingForDestinationConfirmation";

type CircleBridgeStageHandler = (stage: CircleBridgeStage, message: string) => void;
type CircleBridgePayloadHandler = (payload: unknown) => void;

const CIRCLE_BRIDGE_CHAIN_BY_ID: Record<number, CircleBridgeChain> = {
  5042002: "Arc_Testnet",
  84532: "Base_Sepolia",
  11155111: "Ethereum_Sepolia",
  421614: "Arbitrum_Sepolia"
};

const SUPPORTED_BRIDGE_CHAIN_IDS = new Set(Object.keys(CIRCLE_BRIDGE_CHAIN_BY_ID).map(Number));
const EVM_TX_HASH = /^0x[a-fA-F0-9]{64}$/;

function getInjectedProvider() {
  if (typeof window === "undefined") return null;
  return (window as typeof window & { ethereum?: unknown }).ethereum ?? null;
}

function getCircleChain(chainId: number) {
  return CIRCLE_BRIDGE_CHAIN_BY_ID[chainId] ?? null;
}

function sumUsdcFees(estimate: { fees?: Array<{ amount?: string | null }> }) {
  return (estimate.fees ?? []).reduce((total, fee) => {
    const value = Number(fee.amount ?? 0);
    return Number.isFinite(value) ? total + value : total;
  }, 0);
}

function formatDecimalAmount(value: number) {
  if (!Number.isFinite(value)) return null;
  return value.toFixed(6).replace(/\.?0+$/, "");
}

function getStepHash(step: CircleBridgeStep) {
  return [step.txHash, step.transactionHash, step.hash].find((value) => value && EVM_TX_HASH.test(value));
}

function collectEvmHashes(value: unknown, seen = new Set<unknown>()): string[] {
  if (!value || seen.has(value)) return [];
  if (typeof value === "string") return EVM_TX_HASH.test(value) ? [value] : [];
  if (typeof value !== "object") return [];
  seen.add(value);

  const hashes: string[] = [];
  for (const entry of Object.values(value as Record<string, unknown>)) {
    hashes.push(...collectEvmHashes(entry, seen));
  }
  return Array.from(new Set(hashes));
}

function selectPrimarySourceTxHash(result: CircleBridgeResult) {
  const steps = result.steps ?? [];
  const successfulSteps = steps.filter((step) => step.state === "success" && getStepHash(step));
  const sourceStep =
    successfulSteps.find((step) => {
      const name = (step.name ?? "").toLowerCase();
      return (name.includes("burn") || name.includes("deposit") || name.includes("bridge") || name.includes("transfer") || name.includes("spend")) && !name.includes("approve");
    }) ?? successfulSteps.find((step) => !(step.name ?? "").toLowerCase().includes("approve"));

  const preferredHash = sourceStep ? getStepHash(sourceStep) : getStepHash(successfulSteps[0] ?? {});
  if (preferredHash) return preferredHash as Hex;

  const directHash = [result.txHash, result.transactionHash, result.hash].find((value) => value && EVM_TX_HASH.test(value));
  if (directHash) return directHash as Hex;

  const nestedHash = collectEvmHashes(result).find(Boolean);
  return nestedHash as Hex | undefined;
}

function notifyCircleBridgeStage(payload: unknown, onStage?: CircleBridgeStageHandler) {
  if (!onStage) return;
  const text = JSON.stringify(payload ?? {}).toLowerCase();
  if (text.includes("approve") || text.includes("wallet") || text.includes("signature")) {
    onStage("waitingWalletConfirmation", "Confirm next step in Wallet.");
    return;
  }
  if (text.includes("txhash") || text.includes("submitted") || text.includes("transaction")) {
    onStage("sendingTransaction", "Your bridge transaction is processing. Please wait.");
    return;
  }
  if (text.includes("attestation") || text.includes("message") || text.includes("cctp")) {
    onStage("waitingForBridgeMessage", "Cross-chain message is processing.");
    return;
  }
  if (text.includes("mint") || text.includes("destination") || text.includes("complete")) {
    onStage("waitingForDestinationConfirmation", "Waiting for destination confirmation.");
  }
}

function attachCircleBridgeStageListener(kit: unknown, onStage?: CircleBridgeStageHandler, onPayload?: CircleBridgePayloadHandler) {
  if (!onStage && !onPayload) return;
  const maybeEmitter = kit as { on?: (event: string, handler: (payload: unknown) => void) => void };
  if (typeof maybeEmitter.on !== "function") return;
  const handlePayload = (payload: unknown) => {
    onPayload?.(payload);
    notifyCircleBridgeStage(payload, onStage);
  };
  const eventNames = [
    "*",
    "bridge.approve",
    "bridge.burn",
    "bridge.mint",
    "bridge.deposit",
    "bridge.transfer",
    "bridge.complete",
    "bridge.error",
    "bridge.step"
  ];
  for (const eventName of eventNames) {
    try {
      maybeEmitter.on(eventName, handlePayload);
    } catch {
      // Some BridgeKit versions may not support every event alias.
    }
  }
}

async function createCircleAdapter() {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("Wallet provider unavailable.");
  }

  const [{ createViemAdapterFromProvider }, { createPublicClient, http }] = await Promise.all([
    import("@circle-fin/adapter-viem-v2"),
    import("viem")
  ]);

  return createViemAdapterFromProvider({
    provider: provider as Parameters<typeof createViemAdapterFromProvider>[0]["provider"],
    getPublicClient: ({ chain }) => {
      const appChain = getChainById(chain.id);
      return createPublicClient({
        chain,
        transport: http(appChain?.rpcUrl)
      });
    },
    capabilities: { addressContext: "user-controlled" }
  });
}

export function createCircleBridgeProvider(): RouteProvider {
  return {
    providerName: "Circle CCTP / Gateway",
    supportsChain(request) {
      return Boolean(getCircleChain(request.fromChainId) && getCircleChain(request.toChainId));
    },
    supportsToken(token) {
      return token.symbol === "USDC";
    },
    supportsPair(request) {
      return request.routeType === "bridge" && request.fromToken.symbol === "USDC" && request.toToken.symbol === "USDC" && request.fromChainId !== request.toChainId && Number(request.amount) > 0;
    },
    async getQuote(request) {
      const fromChain = getCircleChain(request.fromChainId);
      const toChain = getCircleChain(request.toChainId);
      if (!fromChain || !toChain) {
        throw new Error("Circle does not support this bridge route.");
      }

      const [{ BridgeKit }, adapter] = await Promise.all([import("@circle-fin/bridge-kit"), createCircleAdapter()]);
      const kit = new BridgeKit();
      const estimate = await kit.estimate({
        from: { adapter, chain: fromChain },
        to: { adapter, chain: toChain, recipientAddress: request.walletAddress },
        amount: request.amount,
        token: "USDC",
        config: { transferSpeed: "FAST" },
        invocationMeta: {
          callers: [{ type: "app", name: "Velora", version: "public-beta" }]
        }
      });

      const protocolFee = sumUsdcFees(estimate);
      const estimatedReceive = formatDecimalAmount(Math.max(Number(request.amount) - protocolFee, 0));

      return {
        provider: "Circle CCTP / Gateway",
        toAmount: estimatedReceive,
        toAmountMin: estimatedReceive,
        feeEstimateUsd: protocolFee > 0 ? formatDecimalAmount(protocolFee) : null,
        gasEstimateUsd: estimate.gasFees?.map((fee) => fee.fees?.fee).filter(Boolean).join(", ") || null,
        raw: {
          type: "circle-bridge-kit-estimate",
          estimate,
          fromChain,
          toChain,
          gatewayMode: request.fromChainId === 5042002 ? "arc-outbound-liquidity" : "not-required"
        }
      } satisfies RouteQuote;
    },
    async buildTransactionRequest() {
      return null;
    },
    isExecutable(quote, _transactionRequest, request) {
      return Boolean(quote.raw && request.walletChainId === request.fromChainId && this.supportsPair(request));
    }
  };
}

export function createLifiBridgeProvider(fetchQuote: LifiQuoteFetcher, enabled: boolean): RouteProvider {
  return createTransactionRequestProvider({
    providerName: "LI.FI Bridge",
    routeType: "bridge",
    supportedChains: Array.from(SUPPORTED_BRIDGE_CHAIN_IDS),
    getQuote: async (request) => {
      if (!enabled) throw new Error("LI.FI bridge provider is disabled.");
      const quote = await fetchQuote({
        fromChain: request.fromChainId,
        toChain: request.toChainId,
        fromToken: request.fromToken.address ?? "",
        toToken: request.toToken.address ?? "",
        fromAmount: parseUnits(request.amount, request.fromToken.decimals).toString(),
        fromAddress: request.walletAddress,
        slippage: request.slippage
      });
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

export function createRelayBridgeProvider(): RouteProvider {
  return {
    providerName: "Relay Bridge",
    supportsChain: () => false,
    supportsToken: () => false,
    supportsPair: () => false,
    async getQuote() {
      throw new Error("Relay bridge provider is prepared for future integration.");
    },
    async buildTransactionRequest() {
      return null;
    },
    isExecutable: () => false
  };
}

export function createBridgeServiceProviders(fetchLifiQuote: LifiQuoteFetcher, lifiEnabled = true) {
  return [createCircleBridgeProvider(), createLifiBridgeProvider(fetchLifiQuote, lifiEnabled), createRelayBridgeProvider()];
}

export async function executeCircleBridgeRoute(request: {
  fromChainId: number;
  toChainId: number;
  amount: string;
  walletAddress: Address;
  onStage?: CircleBridgeStageHandler;
}) {
  const fromChain = getCircleChain(request.fromChainId);
  const toChain = getCircleChain(request.toChainId);
  if (!fromChain || !toChain) {
    throw new Error("Circle does not support this bridge route.");
  }

  const [{ BridgeKit }, adapter] = await Promise.all([import("@circle-fin/bridge-kit"), createCircleAdapter()]);
  const kit = new BridgeKit();
  const observedEventHashes: Hex[] = [];
  attachCircleBridgeStageListener(kit, request.onStage, (payload) => {
    for (const hash of collectEvmHashes(payload)) {
      observedEventHashes.push(hash as Hex);
    }
    console.info("[Velora Bridge] Circle bridge event", {
      fromChainId: request.fromChainId,
      toChainId: request.toChainId,
      payload
    });
  });
  request.onStage?.("waitingWalletConfirmation", "Please confirm the transaction in your wallet.");
  const result = (await kit.bridge({
    from: { adapter, chain: fromChain },
    to: { adapter, chain: toChain, recipientAddress: request.walletAddress },
    amount: request.amount,
    token: "USDC",
    config: { transferSpeed: "FAST" },
    invocationMeta: {
      callers: [{ type: "app", name: "Velora", version: "public-beta" }]
    }
  })) as unknown as CircleBridgeResult;

  console.info("[Velora Bridge] Circle bridge result", {
    fromChainId: request.fromChainId,
    toChainId: request.toChainId,
    state: result.state,
    provider: result.provider,
    steps: result.steps,
    raw: result
  });

  const txHash = selectPrimarySourceTxHash(result) ?? observedEventHashes.find(Boolean);
  console.info("[Velora Bridge] Circle bridge hash selection", {
    fromChainId: request.fromChainId,
    toChainId: request.toChainId,
    resultHash: selectPrimarySourceTxHash(result),
    observedEventHashes,
    selectedTxHash: txHash
  });
  if (!txHash || !EVM_TX_HASH.test(txHash)) {
    throw new Error("Transaction submitted but hash missing.");
  }

  if (result.state !== "success") {
    request.onStage?.("waitingForDestinationConfirmation", "Waiting for destination confirmation.");
  }

  return {
    txHash,
    confirmationStatus: result.state === "success" ? ("confirmed" as const) : ("pending" as const),
    raw: result
  };
}

export function isSupportedPublicBetaBridgeChain(chainId: number) {
  return SUPPORTED_BRIDGE_CHAIN_IDS.has(chainId);
}

export function isValidBridgeTransactionRequest(transactionRequest: unknown, walletChainId: number) {
  return isValidTransactionRequest(transactionRequest as Parameters<typeof isValidTransactionRequest>[0], walletChainId);
}
