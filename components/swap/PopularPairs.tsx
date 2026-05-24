"use client";

import { QUICK_SWAP_PAIRS, getSwapToken } from "@/lib/swap/tokens";

export function PopularPairs({ onPairSelect }: { onPairSelect: (from: string, to: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {QUICK_SWAP_PAIRS.map(([from, to]) => (
        <button key={`${from}-${to}`} onClick={() => onPairSelect(from, to)} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left transition hover:-translate-y-1 hover:border-mint/30 hover:bg-mint/10">
          <p className="font-bold text-white">{from} -&gt; {to}</p>
          <p className="mt-2 text-xs text-slate-400">{getSwapToken(from).name} into {getSwapToken(to).name}</p>
        </button>
      ))}
    </div>
  );
}
