export type StablecoinSymbol = "USDC" | "EURC" | "USDT";

export type StablecoinPrice = {
  symbol: StablecoinSymbol;
  price: number;
  change24h: number;
};

export type StablecoinPriceSnapshot = {
  prices: Record<StablecoinSymbol, StablecoinPrice>;
  source: "live" | "fallback";
  stale: boolean;
  fetchedAt: number;
};

const FALLBACK_PRICES: Record<StablecoinSymbol, StablecoinPrice> = {
  USDC: { symbol: "USDC", price: 1, change24h: 0 },
  USDT: { symbol: "USDT", price: 1, change24h: 0 },
  EURC: { symbol: "EURC", price: 1.1, change24h: 0.12 }
};

type CoinGeckoSimple = {
  "usd-coin"?: { usd?: number; usd_24h_change?: number };
  tether?: { usd?: number; usd_24h_change?: number };
  "euro-coin"?: { usd?: number; usd_24h_change?: number };
};

function toPrice(
  symbol: StablecoinSymbol,
  livePrice: number | undefined,
  liveChange: number | undefined
): StablecoinPrice {
  const fallback = FALLBACK_PRICES[symbol];
  return {
    symbol,
    price: Number.isFinite(livePrice) && livePrice && livePrice > 0 ? livePrice : fallback.price,
    change24h: Number.isFinite(liveChange) && liveChange ? liveChange : fallback.change24h
  };
}

export function getFallbackStablecoinPrices(): StablecoinPriceSnapshot {
  return {
    prices: FALLBACK_PRICES,
    source: "fallback",
    stale: true,
    fetchedAt: Date.now()
  };
}

export async function fetchStablecoinPrices(signal?: AbortSignal): Promise<StablecoinPriceSnapshot> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin,tether,euro-coin&vs_currencies=usd&include_24hr_change=true",
      {
        method: "GET",
        cache: "no-store",
        signal
      }
    );
    if (!response.ok) {
      return getFallbackStablecoinPrices();
    }

    const payload = (await response.json()) as CoinGeckoSimple;
    const prices: Record<StablecoinSymbol, StablecoinPrice> = {
      USDC: toPrice("USDC", payload["usd-coin"]?.usd, payload["usd-coin"]?.usd_24h_change),
      USDT: toPrice("USDT", payload.tether?.usd, payload.tether?.usd_24h_change),
      EURC: toPrice("EURC", payload["euro-coin"]?.usd, payload["euro-coin"]?.usd_24h_change)
    };

    const live = Boolean(payload["usd-coin"]?.usd || payload.tether?.usd || payload["euro-coin"]?.usd);
    return {
      prices,
      source: live ? "live" : "fallback",
      stale: !live,
      fetchedAt: Date.now()
    };
  } catch {
    return getFallbackStablecoinPrices();
  }
}
