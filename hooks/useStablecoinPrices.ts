"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchStablecoinPrices, getFallbackStablecoinPrices, type StablecoinPriceSnapshot } from "@/lib/prices/stablecoinPrices";

export function useStablecoinPrices(refreshMs = 60_000) {
  const [snapshot, setSnapshot] = useState<StablecoinPriceSnapshot>(() => getFallbackStablecoinPrices());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const next = await fetchStablecoinPrices();
    setSnapshot(next);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, refreshMs);
    return () => window.clearInterval(timer);
  }, [refresh, refreshMs]);

  return useMemo(
    () => ({
      ...snapshot,
      loading,
      refreshing,
      refresh
    }),
    [loading, refreshing, refresh, snapshot]
  );
}
