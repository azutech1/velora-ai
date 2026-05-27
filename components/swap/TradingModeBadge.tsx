"use client";

type TradingMode = "live" | "demo" | "live-unavailable";

export function TradingModeBadge({ mode }: { mode: TradingMode }) {
  const text =
    mode === "live"
      ? "Live Quote Mode — powered by configured router."
      : mode === "live-unavailable"
        ? "Live quote unavailable — showing estimated quote."
        : "Demo Quote Mode — estimated pricing for testnet preview.";

  const className =
    mode === "live"
      ? "border-mint/30 bg-mint/10 text-mint"
      : mode === "live-unavailable"
        ? "border-amber-300/40 bg-amber-400/10 text-amber-200"
        : "border-cyan/20 bg-cyan/10 text-cyan";

  return (
    <div className="mb-4">
      <p className={`rounded-lg border p-3 text-sm ${className}`}>{text}</p>
      <p className="mt-2 text-xs text-slate-400">Real execution requires a configured swap/bridge router.</p>
    </div>
  );
}
