"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { isAdminWallet } from "@/lib/config/admin";

export function useAdminMode() {
  const { address, isConnected } = useAccount();

  return useMemo(
    () => ({
      isAdmin: Boolean(isConnected && isAdminWallet(address)),
      adminLabel: isConnected && isAdminWallet(address) ? "Platform Admin" : null
    }),
    [address, isConnected]
  );
}
