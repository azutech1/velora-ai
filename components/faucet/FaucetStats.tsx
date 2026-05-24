import { Droplets, TimerReset, WalletCards } from "lucide-react";
import { FAUCET_TOKENS } from "@/lib/faucet/tokens";

export function FaucetStats({ dailyRemainingClaims, lastClaim }: { dailyRemainingClaims: number; lastClaim?: string }) {
  const stats = [
    { label: "Available tokens", value: String(FAUCET_TOKENS.length), detail: "Arc testnet assets", icon: Droplets },
    { label: "Daily remaining", value: String(dailyRemainingClaims), detail: "Across all faucet assets", icon: WalletCards },
    { label: "Last claim", value: lastClaim ?? "None", detail: "Stored locally", icon: TimerReset }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="glass rounded-lg p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-2 text-xs text-mint">{stat.detail}</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-cyan/20 bg-cyan/10">
              <stat.icon className="h-5 w-5 text-cyan" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
