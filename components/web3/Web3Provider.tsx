"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { WalletTransactionTracker } from "@/components/web3/WalletTransactionTracker";
import { wagmiConfig } from "@/lib/web3/wagmi";
import { AuthProvider } from "@/providers/AuthProvider";

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#3B82F6",
            accentColorForeground: "#F8FAFC",
            borderRadius: "small",
            fontStack: "system"
          })}
        >
          <AuthProvider>
            <WalletTransactionTracker />
            {children}
          </AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
