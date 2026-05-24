"use client";

import { useMemo } from "react";
import { AI_AUTOMATION_INTENTS, AI_AUTOMATION_STATUS } from "@/lib/ai/config";

export function useAI() {
  return useMemo(
    () => ({
      status: AI_AUTOMATION_STATUS,
      intents: AI_AUTOMATION_INTENTS,
      isEnabled: AI_AUTOMATION_STATUS.enabled
    }),
    []
  );
}
