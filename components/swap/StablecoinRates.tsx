import { getSwapToken } from "@/lib/swap/tokens";

const rows = [
  ["USDC", "EURC"],
  ["EURC", "USDC"],
  ["USDC", "USDT"],
  ["USDT", "USDC"]
];

export function StablecoinRates() {
  return (
    <div className="space-y-3">
      {rows.map(([from, to]) => {
        const rate = getSwapToken(from).mockPrice / getSwapToken(to).mockPrice;
        return (
          <div key={`${from}-${to}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <span className="text-sm font-semibold text-white">{from}/{to}</span>
            <span className="text-sm text-mint">1 {from} ≈ {rate.toFixed(4)} {to}</span>
          </div>
        );
      })}
      <p className="text-xs leading-5 text-slate-500">Demo pricing only. Rates are mock values until a real Arc liquidity source is connected.</p>
    </div>
  );
}
