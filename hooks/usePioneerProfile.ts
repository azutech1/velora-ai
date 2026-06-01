"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import type { ActivityRecord } from "@/lib/activity/types";
import { calculatePioneerSummary, nextCheckinPoints } from "@/lib/pioneers/system";

type PioneerStore = {
  currentStreak: number;
  bestStreak: number;
  lastCheckinDate: string | null;
};

const defaultStore: PioneerStore = {
  currentStreak: 0,
  bestStreak: 0,
  lastCheckinDate: null
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function storageKey(address?: string) {
  return `velora:pioneers:${address?.toLowerCase() ?? "guest"}`;
}

export function usePioneerProfile(records: ActivityRecord[]) {
  const { address, isConnected } = useAccount();
  const [store, setStore] = useState<PioneerStore>(defaultStore);

  useEffect(() => {
    if (!isConnected || !address) {
      setStore(defaultStore);
      return;
    }
    const raw = window.localStorage.getItem(storageKey(address));
    setStore(raw ? ({ ...defaultStore, ...JSON.parse(raw) } as PioneerStore) : defaultStore);
  }, [address, isConnected]);

  const canCheckIn = Boolean(isConnected && address && store.lastCheckinDate !== todayKey());
  const nextPoints = nextCheckinPoints(store.currentStreak);

  function claimCheckin() {
    if (!address || !canCheckIn) return null;
    const continued = store.lastCheckinDate === yesterdayKey();
    const currentStreak = continued ? store.currentStreak + 1 : 1;
    const nextStore = {
      currentStreak,
      bestStreak: Math.max(store.bestStreak, currentStreak),
      lastCheckinDate: todayKey()
    };
    window.localStorage.setItem(storageKey(address), JSON.stringify(nextStore));
    setStore(nextStore);
    return { points: nextPoints, currentStreak };
  }

  const summary = useMemo(() => calculatePioneerSummary(records, store), [records, store]);

  return {
    ...store,
    canCheckIn,
    nextPoints,
    claimCheckin,
    summary
  };
}
