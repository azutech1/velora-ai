"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Loader2, RefreshCw, WalletCards } from "lucide-react";
import { Panel } from "@/components/azu/ui";
import { shortAddress } from "@/lib/utils/format";

type GatewayBalances = {
  address: string;
  chain: string;
  wallet: {
    balance: string;
    formatted: string;
  };
  gateway: {
    total: string;
    available: string;
    withdrawing: string;
    withdrawable: string;
    formattedTotal: string;
    formattedAvailable: string;
    formattedWithdrawing: string;
    formattedWithdrawable: string;
  };
};

type GatewayAction = "deposit" | "withdraw";

type GatewayActionResult = {
  approvalTxHash?: string;
  depositTxHash?: string;
  mintTxHash?: string;
  formattedAmount?: string;
};

function metricLabel(value?: string) {
  return value ? `${value} USDC` : "--";
}

export function GatewayFunding() {
  const [balances, setBalances] = useState<GatewayBalances | null>(null);
  const [amount, setAmount] = useState("1");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<GatewayAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GatewayActionResult | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/agent-payments/gateway", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { balances?: GatewayBalances; error?: string } | null;
      if (!response.ok || !payload?.balances) throw new Error(payload?.error ?? "Unable to load Gateway balances.");
      setBalances(payload.balances);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load Gateway balances.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function runAction(action: GatewayAction) {
    setError(null);
    setResult(null);
    setSubmitting(action);
    try {
      const response = await fetch("/api/agent-payments/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount })
      });
      const payload = (await response.json().catch(() => null)) as { balances?: GatewayBalances; result?: GatewayActionResult; error?: string } | null;
      if (!response.ok || !payload?.balances) throw new Error(payload?.error ?? `Gateway ${action} failed.`);
      setBalances(payload.balances);
      setResult(payload.result ?? null);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Gateway ${action} failed.`);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Panel
      title="Gateway Funding"
      eyebrow="Move wallet USDC into Circle Gateway before execution"
      action={
        <button onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-cyan/30 px-3 py-2 text-xs font-semibold text-cyan hover:bg-cyan/10 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <WalletCards className="h-5 w-5 text-cyan" />
            <p className="mt-3 text-sm text-slate-400">Execution wallet</p>
            <p className="mt-1 break-all text-sm font-semibold text-white">{balances ? shortAddress(balances.address) : loading ? "Loading..." : "--"}</p>
            <p className="mt-2 text-xs text-slate-500">{balances?.chain ?? "Arc Testnet"}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">Wallet USDC</p>
            <p className="mt-2 text-2xl font-bold text-white">{loading ? "--" : metricLabel(balances?.wallet.formatted)}</p>
            <p className="mt-2 text-xs text-slate-500">Available for Gateway deposit</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">Gateway Available</p>
            <p className="mt-2 text-2xl font-bold text-mint">{loading ? "--" : metricLabel(balances?.gateway.formattedAvailable)}</p>
            <p className="mt-2 text-xs text-slate-500">Used by approved payments</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">Gateway Withdrawable</p>
            <p className="mt-2 text-2xl font-bold text-white">{loading ? "--" : metricLabel(balances?.gateway.formattedWithdrawable)}</p>
            <p className="mt-2 text-xs text-slate-500">Can return to wallet</p>
          </div>
        </div>

        <div className="rounded-lg border border-cyan/20 bg-cyan/[0.05] p-4">
          <p className="text-sm font-semibold text-white">Fund Gateway balance</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Deposit moves USDC from the execution wallet into Circle Gateway. Agent Payments spend from Gateway balance after user approval.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-mint/60"
              placeholder="Amount in USDC"
            />
            <button
              onClick={() => void runAction("deposit")}
              disabled={Boolean(submitting) || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-mint px-4 py-3 text-sm font-bold text-[#031018] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting === "deposit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
              Deposit
            </button>
            <button
              onClick={() => void runAction("withdraw")}
              disabled={Boolean(submitting) || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan/30 px-4 py-3 text-sm font-semibold text-cyan hover:bg-cyan/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting === "withdraw" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpFromLine className="h-4 w-4" />}
              Withdraw
            </button>
          </div>
        </div>

        {result ? (
          <div className="rounded-lg border border-mint/20 bg-mint/[0.06] p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Gateway action submitted</p>
            {result.formattedAmount ? <p className="mt-2">Amount: {result.formattedAmount} USDC</p> : null}
            {result.approvalTxHash ? <p className="mt-1 break-all text-slate-400">Approval tx: {result.approvalTxHash}</p> : null}
            {result.depositTxHash ? <p className="mt-1 break-all text-slate-400">Deposit tx: {result.depositTxHash}</p> : null}
            {result.mintTxHash ? <p className="mt-1 break-all text-slate-400">Withdraw tx: {result.mintTxHash}</p> : null}
          </div>
        ) : null}

        {error ? <div className="rounded-lg border border-red-400/20 bg-red-500/[0.06] p-4 text-sm text-red-100">{error}</div> : null}
      </div>
    </Panel>
  );
}
