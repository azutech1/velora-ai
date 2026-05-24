"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arcNetwork } from "./chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Velora AI",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "AZU_VELORA_DEMO_PROJECT_ID",
  chains: [arcNetwork],
  ssr: true
});
