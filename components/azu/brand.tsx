import Image from "next/image";
import { Bot, KeyRound, Zap } from "lucide-react";
import { cx } from "./utils";

export function LogoMark({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cx("velora-mark relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-cyan/35 bg-black/30 shadow-neon", className)}
      style={{ width: size, height: size }}
    >
      <Image src="/brand/velora-mark-dark.png" alt="Velora Protocol logo" width={size} height={size} className="velora-logo-dark h-full w-full object-contain" priority={size >= 64} />
      <Image src="/brand/velora-mark-light.png" alt="Velora Protocol logo" width={size} height={size} className="velora-logo-light hidden h-full w-full object-contain" priority={size >= 64} />
    </span>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={46} />
      <div className="min-w-0">
        <p className="truncate text-lg font-black uppercase tracking-[0.08em] text-white">VELORA</p>
        <p className="truncate text-xs text-cyan/85">AI Stablecoin OS</p>
      </div>
    </div>
  );
}

export function HeroOrbit() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[470px] animate-[float_5s_ease-in-out_infinite]">
      <div className="absolute inset-8 rounded-full border border-cyan/20 bg-cyan/5 blur-sm" />
      <div className="absolute inset-14 rounded-full border border-cyan/30 bg-[radial-gradient(circle,rgba(249,115,22,0.18),transparent_62%)] shadow-neon" />
      <div className="absolute inset-24 rounded-full border border-white/10 bg-black/30 backdrop-blur-xl" />
      <div className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan/40 bg-[#05070D] shadow-cyan sm:h-32 sm:w-32">
        <LogoMark size={82} className="rounded-full border-cyan/50 bg-transparent shadow-none sm:h-24 sm:w-24" />
      </div>
      {[0, 1, 2].map((ring) => (
        <div
          key={ring}
          className="absolute inset-0 rounded-full border border-dashed border-cyan/20"
          style={{ inset: `${ring * 38}px`, animation: `orbit ${12 + ring * 5}s linear infinite` }}
        >
          <span
            className="absolute grid h-11 w-11 place-items-center rounded-full border border-cyan/35 bg-[#10141D]/95 shadow-neon"
            style={{ left: `${24 + ring * 18}%`, top: "-1.375rem" }}
          >
            {ring === 0 ? <Bot className="h-5 w-5 text-cyan" /> : ring === 1 ? <Zap className="h-5 w-5 text-cyan" /> : <KeyRound className="h-5 w-5 text-cyan" />}
          </span>
        </div>
      ))}
      <div className="absolute bottom-8 left-4 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xl sm:left-8">
        <p className="text-xs text-slate-400">Status</p>
        <p className="text-xl font-bold text-white">Public Beta</p>
      </div>
      <div className="absolute right-2 top-12 rounded-lg border border-cyan/20 bg-white/[0.06] px-4 py-3 backdrop-blur-xl sm:right-4">
        <p className="text-xs text-slate-400">Network</p>
        <p className="text-xl font-bold text-cyan">Arc Testnet</p>
      </div>
      <div className="absolute right-6 bottom-16 rounded-lg border border-cyan/20 bg-white/[0.06] px-4 py-3 backdrop-blur-xl sm:right-10">
        <p className="text-xs text-slate-400">Metrics</p>
        <p className="text-xl font-bold text-cyan">Coming Soon</p>
      </div>
    </div>
  );
}
