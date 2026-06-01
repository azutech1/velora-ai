"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { type FaucetClaim, type FaucetToken } from "@/lib/faucet/tokens";
import { TokenLogo } from "@/components/token/TokenLogo";

function formatCooldown(ms: number) {
  if (ms <= 0) return "Ready";
  const minutes = Math.ceil(ms / 60000);
  return `${minutes}m remaining`;
}

export function FaucetCard({
  token,
  eligibility,
  loading,
  onRequest
}: {
  token: FaucetToken;
  eligibility: { eligible: boolean; reason: string; remaining: number; cooldownRemainingMs: number };
  loading: boolean;
  onRequest: (token: FaucetToken) => Promise<FaucetClaim>;
}) {
  const { isConnected } = useAccount();
  const [selectedAmount, setSelectedAmount] = useState(token.faucetAmount);
  const status = useMemo(() => (eligibility.eligible ? "Ready" : eligibility.reason), [eligibility.eligible, eligibility.reason]);

  return (
    <motion.article whileHover={{ y: -5 }} className="glass rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <TokenLogo symbol={token.symbol} size={48} />
          <div>
            <h3 className="text-lg font-bold text-white">{token.symbol}</h3>
            <p className="text-sm text-slate-400">{token.name}</p>
          </div>
        </div>
        <span className={eligibility.eligible ? "rounded-full bg-mint/10 px-3 py-1 text-xs text-mint" : "rounded-full bg-cyan/10 px-3 py-1 text-xs text-cyan"}>{status}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-slate-500">{token.symbol}</p>
          <p className="mt-1 flex items-center gap-1.5 font-semibold text-white">
            {isConnected ? <TokenLogo symbol={token.symbol} size={16} /> : null}
            {isConnected ? "Balance unavailable" : "Connect wallet to view balances"}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-slate-500">Daily remaining</p>
          <p className="mt-1 font-semibold text-white">{eligibility.remaining}/{token.dailyLimit}</p>
        </div>
      </div>

      <label className="mt-4 block text-sm text-slate-300">
        Request amount
        <select value={selectedAmount} onChange={(event) => setSelectedAmount(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan/60">
          <option>{token.faucetAmount}</option>
        </select>
      </label>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">
        <div className="flex justify-between text-slate-300"><span>Cooldown</span><span>{formatCooldown(eligibility.cooldownRemainingMs)}</span></div>
        <div className="mt-2 flex justify-between text-slate-300"><span>Default amount</span><span>{token.faucetAmount}</span></div>
      </div>

      <button onClick={() => onRequest(token)} disabled={!eligibility.eligible || loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan px-5 py-3 font-bold text-white shadow-neon transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-55">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Request {token.symbol}
      </button>
    </motion.article>
  );
}
