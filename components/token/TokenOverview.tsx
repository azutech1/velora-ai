import { Coins, Copy, ShieldCheck } from "lucide-react";
import { AVL_TOKEN } from "@/lib/tokens/avl";

export function TokenOverview() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
      <section className="glass rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Native ecosystem utility token</p>
            <h2 className="mt-2 text-3xl font-black text-white">{AVL_TOKEN.name}</h2>
            <p className="mt-2 text-xl font-semibold text-mint">{AVL_TOKEN.symbol}</p>
          </div>
          <div className="grid h-16 w-16 place-items-center rounded-full border border-mint/30 bg-mint/10 shadow-neon">
            <Coins className="h-8 w-8 text-mint" />
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-300">{AVL_TOKEN.purpose}</p>
        <div className="mt-6 rounded-lg border border-cyan/20 bg-cyan/10 p-4 text-sm leading-6 text-cyan">
          <ShieldCheck className="mb-2 h-5 w-5" />
          {AVL_TOKEN.safety}
        </div>
      </section>

      <section className="glass rounded-lg p-6">
        <h3 className="text-xl font-bold text-white">Token details</h3>
        <div className="mt-5 space-y-4">
          {[
            ["Network", AVL_TOKEN.network],
            ["Total supply", AVL_TOKEN.totalSupply],
            ["Rewards status", "Coming Soon"],
            ["Decimals", String(AVL_TOKEN.decimals)]
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <span className="text-sm text-slate-400">{label}</span>
              <span className="text-right text-sm font-semibold text-white">{value}</span>
            </div>
          ))}
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-400">Contract status</span>
              <Copy className="h-4 w-4 text-cyan" />
            </div>
            <p className="mt-3 break-all text-sm font-semibold text-white">{AVL_TOKEN.contractAddress}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
