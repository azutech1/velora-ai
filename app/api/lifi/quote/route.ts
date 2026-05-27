import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { getChainById } from "@/lib/config/chains";
import { getTokenByAddress } from "@/lib/config/tokens";

type LifiQuoteRequest = {
  fromChain?: number;
  toChain?: number;
  fromToken?: string;
  toToken?: string;
  fromAmount?: string;
  fromAddress?: string;
  slippage?: number;
};

type LifiQuoteResponse = {
  toAmount?: string;
  estimate?: {
    toAmountMin?: string;
    gasCosts?: Array<{ amountUSD?: string }>;
    feeCosts?: Array<{ amountUSD?: string }>;
  };
  tool?: string;
  toolDetails?: { name?: string };
  transactionRequest?: {
    to?: string;
    from?: string;
    data?: string;
    value?: string;
    gasLimit?: string;
    gasPrice?: string;
    chainId?: number;
  };
};

type CachedQuote = {
  data: {
    estimate: {
      toAmount: string | null;
      toAmountMin: string | null;
      provider: string;
      gasEstimateUsd: string | null;
      feeEstimateUsd: string | null;
      transactionRequest: LifiQuoteResponse["transactionRequest"] | null;
    };
  };
  expiresAt: number;
};

const QUOTE_CACHE = new Map<string, CachedQuote>();
const CACHE_TTL_MS = 20_000;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LifiQuoteRequest | null;
  if (!body) return badRequest("Invalid quote payload.");

  const { fromChain, toChain, fromToken, toToken, fromAmount, fromAddress, slippage } = body;
  if (!fromChain || !toChain || !fromToken || !toToken || !fromAmount || !fromAddress) {
    return badRequest("Missing required LI.FI quote parameters.");
  }
  if (!isAddress(fromToken) || !isAddress(toToken) || !isAddress(fromAddress)) {
    return badRequest("Invalid token or wallet address.");
  }
  if (!/^\d+$/.test(fromAmount)) {
    return badRequest("fromAmount must be base-unit integer string.");
  }

  const fromChainMeta = getChainById(fromChain);
  const toChainMeta = getChainById(toChain);
  if (!fromChainMeta || !toChainMeta) {
    return NextResponse.json({ error: "Route currently unavailable." }, { status: 422 });
  }

  const fromTokenMeta = getTokenByAddress(fromChain, fromToken);
  const toTokenMeta = getTokenByAddress(toChain, toToken);
  if (!fromTokenMeta || !toTokenMeta) {
    return NextResponse.json({ error: "Route currently unavailable." }, { status: 422 });
  }

  if (fromChain === toChain && fromTokenMeta.symbol === toTokenMeta.symbol) {
    return NextResponse.json({ error: "Route currently unavailable." }, { status: 422 });
  }

  if (fromChain !== toChain && fromTokenMeta.symbol !== toTokenMeta.symbol) {
    return NextResponse.json({ error: "Route currently unavailable." }, { status: 422 });
  }

  const cacheKey = [fromChain, toChain, fromToken.toLowerCase(), toToken.toLowerCase(), fromAmount, fromAddress.toLowerCase(), String(slippage ?? 0.5)].join(":");
  const cached = QUOTE_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const url = new URL("https://li.quest/v1/quote");
  url.searchParams.set("fromChain", String(fromChain));
  url.searchParams.set("toChain", String(toChain));
  url.searchParams.set("fromToken", fromToken);
  url.searchParams.set("toToken", toToken);
  url.searchParams.set("fromAmount", fromAmount);
  url.searchParams.set("fromAddress", fromAddress);
  url.searchParams.set("slippage", String(slippage ?? 0.5));

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(process.env.LIFI_API_KEY ? { "x-lifi-api-key": process.env.LIFI_API_KEY } : {})
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Live quote unavailable." }, { status: 502 });
    }

    const payload = (await response.json()) as LifiQuoteResponse;
    const normalized = {
      estimate: {
        toAmount: payload.toAmount ?? null,
        toAmountMin: payload.estimate?.toAmountMin ?? null,
        provider: payload.toolDetails?.name ?? payload.tool ?? "LI.FI",
        gasEstimateUsd: payload.estimate?.gasCosts?.[0]?.amountUSD ?? null,
        feeEstimateUsd: payload.estimate?.feeCosts?.[0]?.amountUSD ?? null,
        transactionRequest: payload.transactionRequest ?? null
      }
    };
    QUOTE_CACHE.set(cacheKey, { data: normalized, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json({ error: "Live quote unavailable." }, { status: 502 });
  }
}
