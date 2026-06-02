"use client";

type TradingMode = "live" | "preparing" | "live-unavailable";

export function TradingModeBadge({ mode }: { mode: TradingMode }) {
  const text =
    mode === "live"
      ? "Executable live route ready. Swap will open wallet confirmation."
      : mode === "live-unavailable"
        ? "Live execution is not available for this route."
        : "Preparing route. Enter an amount to load an executable quote.";

  const className =
    mode === "live"
      ? "border-mint/30 bg-mint/10 text-mint"
      : mode === "live-unavailable"
        ? "border-amber-300/40 bg-amber-400/10 text-amber-200"
        : "border-cyan/20 bg-cyan/10 text-cyan";

  return (
    <div className="mb-4">
      <p className={`rounded-lg border p-3 text-sm ${className}`}>{text}</p>
      <p className="mt-2 text-xs text-slate-400">Preview estimates are informational. Swapping becomes available when the current pair and amount can be confirmed in your wallet.</p>
    </div>
  );
}
