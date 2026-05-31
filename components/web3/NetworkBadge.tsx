"use client";

import { Loader2, WifiOff } from "lucide-react";
import { useArcNetwork } from "@/hooks/useArcNetwork";

function ArcLogo() {
  return (
    <span
      aria-hidden="true"
      className="h-6 w-6 shrink-0 rounded-full border border-mint/30 bg-[#06111d] bg-cover bg-center shadow-[0_0_14px_rgba(0,245,196,0.22)]"
      style={{ backgroundImage: "url('/networks/arc-official.jpg')" }}
    />
  );
}

export function NetworkBadge() {
  const { isConnected, isArc, isSwitching, expectedChain, switchToArc } = useArcNetwork();

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-400 transition hover:border-white/20 hover:bg-white/[0.06] sm:text-sm">
        <WifiOff className="h-4 w-4" /> Wallet disconnected
      </div>
    );
  }

  if (!isArc) {
    return (
      <button onClick={() => switchToArc()} disabled={isSwitching} className="flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs font-semibold text-cyan transition hover:-translate-y-0.5 hover:border-mint/40 hover:bg-mint/10 hover:text-mint disabled:translate-y-0 disabled:opacity-60 sm:text-sm">
        {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArcLogo />}
        Switch to Arc
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-mint/20 bg-mint/10 px-3 py-2 text-xs font-semibold text-mint transition hover:-translate-y-0.5 hover:border-mint/40 hover:bg-mint/[0.14] hover:shadow-[0_0_18px_rgba(0,245,196,0.16)] sm:text-sm">
      <ArcLogo />
      <span className="whitespace-nowrap">{expectedChain.name}</span>
    </div>
  );
}
