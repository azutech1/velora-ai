"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { ActivityInput, ActivityRecord } from "@/lib/activity/types";
import { clearActivities, exportActivitiesToCsv, getFlattenedActivities, saveActivity } from "@/lib/activity/storage";

export function useActivityRecorder() {
  const { address } = useAccount();
  const [activities, setActivities] = useState<ActivityRecord[]>([]);

  const refresh = useCallback(() => {
    setActivities(getFlattenedActivities());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("velora:activity-updated", refresh);
    return () => window.removeEventListener("velora:activity-updated", refresh);
  }, [refresh]);

  const recordActivity = useCallback(
    (input: ActivityInput) =>
      saveActivity({
        ...input,
        walletAddress: input.walletAddress ?? address ?? null
      }),
    [address]
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
      exportCsv: exportActivitiesToCsv
    }),
    [activities, clearDemoActivity, recordActivity]
  );
}
