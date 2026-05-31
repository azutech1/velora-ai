import { ArrowRight, CheckCircle2 } from "lucide-react";
import { type BridgeQuote } from "@/lib/swap/bridge";
import { type BridgeNetwork } from "@/lib/swap/networks";

export function BridgeRoutePreview({ fromNetwork, toNetwork, quote }: { fromNetwork: BridgeNetwork; toNetwork: BridgeNetwork; quote: BridgeQuote }) {
  return (
    <section className="glass rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Route preview</p>
          <h2 className="text-xl font-bold text-white">{fromNetwork.name} USDC -&gt; {toNetwork.name} USDC</h2>
        </div>
        <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">Demo route</span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-500">Source chain</p>
          <p className="mt-2 font-semibold text-white">{fromNetwork.name}</p>
        </div>
        <div className="grid place-items-center text-cyan">
          <ArrowRight className="h-5 w-5" />
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs text-slate-500">Destination chain</p>
          <p className="mt-2 font-semibold text-white">{toNetwork.name}</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-mint/20 bg-mint/10 p-4">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mint" />
          <div>
            <p className="font-semibold text-white">Bridge route</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{quote.route}</p>
            <p className="mt-2 text-sm text-cyan">Estimated time: {quote.estimatedTime}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs text-slate-500">Transaction hash placeholder</p>
        <p className="mt-2 text-sm font-semibold text-white">Execution requires a live route with wallet transaction data.</p>
      </div>
    </section>
  );
}
