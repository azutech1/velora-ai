"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { ActivityInput, ActivityRecord } from "@/lib/activity/types";
import { clearActivities, exportActivitiesToCsv, getFlattenedActivities, saveActivity } from "@/lib/activity/storage";
import { listActivitiesFromDatabase, saveActivityToDatabase } from "@/lib/supabase/helpers";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { useUser } from "./useUser";

export function useActivityRecorder() {
  const { address } = useAccount();
  const { isAuthenticated, walletAddress } = useUser();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => {
    setActivities(getFlattenedActivities());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("velora:activity-updated", refresh);
    return () => window.removeEventListener("velora:activity-updated", refresh);
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated || !walletAddress || !hasSupabaseConfig()) return;
    let cancelled = false;
    setSyncing(true);
    listActivitiesFromDatabase(walletAddress)
      .then((records) => {
        if (!cancelled && records) setActivities(records);
      })
      .catch(() => refresh())
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refresh, walletAddress]);

  const recordActivity = useCallback(
    (input: ActivityInput) => {
      const localRecord = saveActivity({
        ...input,
        walletAddress: input.walletAddress ?? address ?? null
      });

      const databaseWallet = input.walletAddress ?? walletAddress ?? address ?? null;
      if (isAuthenticated && databaseWallet && hasSupabaseConfig()) {
        void saveActivityToDatabase(input, databaseWallet).catch((error) => {
          console.warn("[Velora Activity] Database sync failed; local activity retained.", error);
        });
      }

      return localRecord;
    },
    [address, isAuthenticated, walletAddress]
  );

  const clearDemoActivity = useCallback(
    (walletAddress?: string | null) => {
      clearActivities(walletAddress);
      refresh();
    },
    [refresh]
  );

  return useMemo(
    () => ({
      activities,
      recordActivity,
      clearDemoActivity,
      exportCsv: exportActivitiesToCsv,
      syncing,
      storageMode: isAuthenticated && hasSupabaseConfig() ? "database" : "local"
    }),
    [activities, clearDemoActivity, isAuthenticated, recordActivity, syncing]
  );
}
