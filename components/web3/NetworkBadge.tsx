"use client";

import { Loader2, RadioTower, WifiOff } from "lucide-react";
import { useArcNetwork } from "@/hooks/useArcNetwork";

export function NetworkBadge() {
  const { isConnected, isArc, isSwitching, expectedChain, switchToArc } = useArcNetwork();

  if (!isConnected) {
    return (
      <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-400 sm:flex">
        <WifiOff className="h-4 w-4" /> Wallet disconnected
      </div>
    );
  }

  if (!isArc) {
    return (
      <button onClick={() => switchToArc()} disabled={isSwitching} className="hidden items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan transition hover:border-mint/40 hover:text-mint disabled:opacity-60 sm:flex">
        {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RadioTower className="h-4 w-4" />}
        Switch to Arc
      </button>
    );
  }

  return (
    <div className="hidden items-center gap-2 rounded-lg border border-mint/20 bg-mint/10 px-4 py-2 text-sm text-mint sm:flex">
      <RadioTower className="h-4 w-4" />
      {expectedChain.name}
    </div>
  );
}
