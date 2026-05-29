import { Bot, CircleDollarSign, KeyRound, Zap } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border border-mint/35 bg-cyan/10 shadow-neon">
        <span className="absolute h-16 w-16 rounded-full border border-cyan/20" />
        <span className="absolute h-10 w-10 animate-[orbit_6s_linear_infinite] rounded-full border-t border-mint/70" />
        <span className="text-sm font-black text-white">VAI</span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-white">Velora AI</p>
        <p className="truncate text-xs text-cyan/80">AI stablecoin OS</p>
      </div>
    </div>
  );
}

export function HeroOrbit() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[470px] animate-[float_5s_ease-in-out_infinite]">
      <div className="absolute inset-8 rounded-full border border-cyan/20 bg-cyan/5 blur-sm" />
      <div className="absolute inset-14 rounded-full border border-mint/30 bg-[radial-gradient(circle,rgba(0,245,196,0.20),transparent_62%)] shadow-neon" />
      <div className="absolute inset-24 rounded-full border border-white/10 bg-black/30 backdrop-blur-xl" />
      <div className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-mint/40 bg-[#06111e] shadow-cyan sm:h-32 sm:w-32">
        <CircleDollarSign className="h-12 w-12 text-mint sm:h-14 sm:w-14" />
      </div>
      {[0, 1, 2].map((ring) => (
        <div
          key={ring}
          className="absolute inset-0 rounded-full border border-dashed border-cyan/20"
          style={{ inset: `${ring * 38}px`, animation: `orbit ${12 + ring * 5}s linear infinite` }}
        >
          <span
            className="absolute grid h-11 w-11 place-items-center rounded-full border border-mint/40 bg-[#07111f]/90 shadow-neon"
            style={{ left: `${24 + ring * 18}%`, top: "-1.375rem" }}
          >
            {ring === 0 ? <Bot className="h-5 w-5 text-cyan" /> : ring === 1 ? <Zap className="h-5 w-5 text-mint" /> : <KeyRound className="h-5 w-5 text-cyan" />}
          </span>
        </div>
      ))}
      <div className="absolute bottom-8 left-4 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xl sm:left-8">
        <p className="text-xs text-slate-400">Status</p>
        <p className="text-xl font-bold text-white">Testnet Alpha</p>
      </div>
      <div className="absolute right-2 top-12 rounded-lg border border-mint/20 bg-white/[0.06] px-4 py-3 backdrop-blur-xl sm:right-4">
        <p className="text-xs text-slate-400">Network</p>
        <p className="text-xl font-bold text-mint">Arc Testnet</p>
      </div>
      <div className="absolute right-6 bottom-16 rounded-lg border border-cyan/20 bg-white/[0.06] px-4 py-3 backdrop-blur-xl sm:right-10">
        <p className="text-xs text-slate-400">Metrics</p>
        <p className="text-xl font-bold text-cyan">Coming Soon</p>
      </div>
    </div>
  );
}
