import { NextResponse } from "next/server";
import { formatUnits, isAddress, parseUnits } from "viem";
import { ArcTestnet } from "@circle-fin/app-kit/chains";
import { ARC_APP_KIT_CHAIN, CIRCLE_APP_KIT_KEY, type ArcAppKitSwapToken } from "@/lib/appkit/config";

export const runtime = "nodejs";

type QuoteRequestBody = {
  tokenIn: ArcAppKitSwapToken;
  tokenOut: ArcAppKitSwapToken;
  amountIn: string;
  slippageBps: number;
  walletAddress: string;
};

type CircleQuoteFee = {
  amount?: string;
  token?: string;
  type?: string;
};

type CircleQuotePayload = {
  quote?: {
    estimatedAmount?: string;
    amountOut?: string;
    minAmount?: string;
    minimumAmount?: string;
    stopLimit?: string;
    fees?: CircleQuoteFee[];
  };
  estimatedAmount?: string;
  amountOut?: string;
  minAmount?: string;
  minimumAmount?: string;
  stopLimit?: string;
  fees?: CircleQuoteFee[];
};

const QUOTE_DEBUG_VERSION = "velora-quote-route-2026-05-26.1";
const CIRCLE_QUOTE_URL = "https://api.circle.com/v1/stablecoinKits/quote";

const arcTestnet = ArcTestnet as {
  usdcAddress?: string | null;
  eurcAddress?: string | null;
};

const TOKEN_META: Partial<Record<ArcAppKitSwapToken, { address?: string | null; decimals: number }>> = {
  USDC: { address: arcTestnet.usdcAddress, decimals: 6 },
  EURC: { address: arcTestnet.eurcAddress, decimals: 6 }
};

function errorResponse(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details, debugVersion: QUOTE_DEBUG_VERSION }, { status });
}

function isKitKeyReady() {
  return /^KIT_KEY:[A-Za-z0-9._-]+:[A-Za-z0-9._-]+$/.test(CIRCLE_APP_KIT_KEY);
}

function formatCircleAmount(value: string | undefined, decimals: number) {
  if (!value) return undefined;
  return /^\d+$/.test(value) ? formatUnits(BigInt(value), decimals) : value;
}

function pickQuoteAmount(payload: CircleQuotePayload) {
  const quote = payload.quote ?? payload;
  return {
    estimated: quote.estimatedAmount ?? quote.amountOut ?? payload.estimatedAmount ?? payload.amountOut,
    minimum: quote.minAmount ?? quote.minimumAmount ?? quote.stopLimit ?? payload.minAmount ?? payload.minimumAmount,
    fees: quote.fees ?? payload.fees ?? []
  };
}

async function fetchCircleQuote(url: URL, requestId: string) {
  const startedAt = Date.now();
  const safeUrl = `${url.origin}${url.pathname}`;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      console.info("[Velora AppKit Quote] Circle request start", {
        requestId,
        attempt,
        endpoint: safeUrl,
        tokenInChain: url.searchParams.get("tokenInChain"),
        tokenOutChain: url.searchParams.get("tokenOutChain"),
        tokenInAddress: url.searchParams.get("tokenInAddress"),
        tokenOutAddress: url.searchParams.get("tokenOutAddress"),
        amount: url.searchParams.get("amount"),
        slippageBps: url.searchParams.get("slippageBps")
      });

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${CIRCLE_APP_KIT_KEY}`
        },
        cache: "no-store"
      });
      const responseText = await response.text();
      console.info("[Velora AppKit Quote] Circle response", {
        requestId,
        attempt,
        status: response.status,
        ok: response.ok,
        durationMs: Date.now() - startedAt,
        bodyBytes: responseText.length
      });

      return { response, responseText, attempt };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown fetch failure";
      console.error("[Velora AppKit Quote] Circle network failure", {
        requestId,
        attempt,
        endpoint: safeUrl,
        message
      });

      if (attempt === 3) {
        throw new Error(`Circle quote fetch failed after ${attempt} attempts: ${message}`);
      }
    }
  }

  throw new Error("Circle quote fetch failed before a response was received.");
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  console.info("[Velora AppKit Quote] Incoming quote request", { requestId, debugVersion: QUOTE_DEBUG_VERSION });

  if (!isKitKeyReady()) {
    console.error("[Velora AppKit Quote] Kit key validation failed", {
      requestId,
      hasKey: Boolean(CIRCLE_APP_KIT_KEY),
      keyPrefix: CIRCLE_APP_KIT_KEY.slice(0, 7)
    });
    return errorResponse("Circle App Kit key is missing or invalid. Add a valid KIT_KEY value in Vercel environment variables.");
  }

  const body = (await request.json().catch(() => null)) as Partial<QuoteRequestBody> | null;
  if (!body) return errorResponse("Invalid quote request body.");

  const { tokenIn, tokenOut, amountIn, slippageBps, walletAddress } = body;
  console.info("[Velora AppKit Quote] Parsed request body", {
    requestId,
    tokenIn,
    tokenOut,
    amountIn,
    slippageBps,
    walletAddress: walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : null
  });

  if (!tokenIn || !tokenOut || tokenIn === tokenOut) return errorResponse("Choose two different supported tokens.");
  if (!walletAddress || !isAddress(walletAddress)) return errorResponse("A valid connected wallet address is required.");

  const inputToken = TOKEN_META[tokenIn];
  const outputToken = TOKEN_META[tokenOut];
  if (!inputToken?.address || !outputToken?.address) {
    return errorResponse("Real Circle quotes are currently configured for USDC and EURC on Arc Testnet only.");
  }

  const numericAmount = Number(amountIn);
  if (!amountIn || !Number.isFinite(numericAmount) || numericAmount <= 0) {
    return errorResponse("Enter an amount greater than 0.");
  }

  const amountBaseUnits = parseUnits(amountIn, inputToken.decimals).toString();
  const url = new URL(CIRCLE_QUOTE_URL);
  url.searchParams.set("tokenInAddress", inputToken.address);
  url.searchParams.set("tokenInChain", ARC_APP_KIT_CHAIN);
  url.searchParams.set("tokenOutAddress", outputToken.address);
  url.searchParams.set("tokenOutChain", ARC_APP_KIT_CHAIN);
  url.searchParams.set("fromAddress", walletAddress);
  url.searchParams.set("toAddress", walletAddress);
  url.searchParams.set("amount", amountBaseUnits);
  url.searchParams.set("slippageBps", String(slippageBps ?? 50));

  try {
    const { response, responseText, attempt } = await fetchCircleQuote(url, requestId);
    const payload = responseText ? (JSON.parse(responseText) as CircleQuotePayload & { message?: string; error?: string }) : {};

    if (!response.ok) {
      return errorResponse(payload.message ?? payload.error ?? "Circle quote request failed.", response.status, {
        requestId,
        attempt,
        endpoint: CIRCLE_QUOTE_URL,
        payload
      });
    }

    const quote = pickQuoteAmount(payload);
    const estimatedAmount = formatCircleAmount(quote.estimated, outputToken.decimals);
    if (!estimatedAmount) {
      return errorResponse("Circle returned a quote response without an estimated output amount.", 502, {
        requestId,
        responseKeys: Object.keys(payload),
        payload
      });
    }

    console.info("[Velora AppKit Quote] Quote normalized", {
      requestId,
      tokenIn,
      tokenOut,
      estimatedAmount,
      minimumAmount: quote.minimum ? formatCircleAmount(quote.minimum, outputToken.decimals) : null
    });

    return NextResponse.json({
      estimate: {
        estimatedOutput: { amount: estimatedAmount, token: tokenOut },
        stopLimit: quote.minimum
          ? { amount: formatCircleAmount(quote.minimum, outputToken.decimals) ?? estimatedAmount, token: tokenOut }
          : undefined,
        fees: quote.fees.map((fee) => ({
          amount: fee.amount ?? "0",
          token: fee.token ?? tokenIn,
          type: fee.type ?? "network"
        }))
      },
      diagnostics: {
        requestId,
        debugVersion: QUOTE_DEBUG_VERSION,
        circleEndpoint: CIRCLE_QUOTE_URL,
        circleAttempts: attempt
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Circle quote request could not be completed.";
    console.error("[Velora AppKit Quote] Quote route failed", { requestId, message });
    return errorResponse(`Circle quote network request failed: ${message}`, 502, {
      requestId,
      endpoint: CIRCLE_QUOTE_URL,
      retryAttempts: 3
    });
  }
}
