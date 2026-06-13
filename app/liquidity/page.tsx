"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BadgeCheck, Coins, Info, Lock, ShieldCheck, Wallet, X } from "lucide-react";
import { useAccount, useChainId } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { OpenAssistantButton } from "@/components/assistant/OpenAssistantButton";
import { TokenLogo } from "@/components/token/TokenLogo";
import { cx } from "@/components/azu/utils";
import { usePortfolioBalances } from "@/hooks/usePortfolioBalances";
import { type ActiveTokenSymbol } from "@/lib/config/tokens";
import {
  estimatePairedAmount,
  getLiquidityPool,
  LIQUIDITY_CONTRACT_NOTICE,
  LIQUIDITY_POOL_DISCLAIMER,
  LIQUIDITY_POOLS,
  LIQUIDITY_REWARD_TASKS,
  type LiquidityPool
} from "@/lib/liquidity/pools";
import { shortAddress } from "@/lib/utils/format";

const ARC_TESTNET_CHAIN_ID = 5042002;

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3 light:border-black light:bg-white">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 light:text-slate-600">{label}</p>
      <p className="mt-2 text-sm font-black text-white light:text-slate-950">{value}</p>
    </div>
  );
}

function PoolLogos({ pool }: { pool: LiquidityPool }) {
  return (
    <div className="flex items-center">
      <div className="relative z-10 rounded-full border border-white/20 bg-slate-950 p-1 light:border-black light:bg-white">
        <TokenLogo symbol={pool.tokenA} size={34} />
      </div>
      <div className="-ml-3 rounded-full border border-white/20 bg-slate-950 p-1 light:border-black light:bg-white">
        <TokenLogo symbol={pool.tokenB} size={34} />
      </div>
    </div>
  );
}

function BetaBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2.5 py-1 text-xs font-black text-emerald-300 light:text-emerald-700">
      <BadgeCheck className="h-3.5 w-3.5" /> Testnet Beta
    </span>
  );
}

function PoolCard({
  pool,
  selected,
  onAdd,
  onRemove
}: {
  pool: LiquidityPool;
  selected: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-[0_22px_70px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 light:bg-white",
        selected
          ? "border-orange-400/45 from-orange-500/12 via-white/[0.05] to-emerald-400/8 light:border-black light:from-orange-50 light:via-white light:to-emerald-50"
          : "border-white/10 from-white/[0.06] via-white/[0.035] to-orange-400/[0.035] light:border-black light:from-white light:via-orange-50/45 light:to-amber-50/50"
      )}
    >
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-orange-400/12 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <PoolLogos pool={pool} />
          <h3 className="mt-5 text-xl font-black text-white light:text-slate-950">{pool.pair}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400 light:text-slate-700">Stablecoin liquidity preview on Arc Testnet.</p>
        </div>
        <BetaBadge />
      </div>
      <div className="relative mt-5 grid gap-3">
        <StatLine label="Total testnet liquidity" value={pool.totalLiquidityLabel} />
        <StatLine label="User liquidity" value={pool.userLiquidityLabel} />
        <StatLine label="Pool share" value={pool.poolShareLabel} />
      </div>
      <div className="relative mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={onAdd} className="rounded-lg bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 px-4 py-2.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(249,115,22,0.28)] transition hover:scale-[1.01]">
          Add Liquidity
        </button>
        <button type="button" onClick={onRemove} className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-black text-slate-200 transition hover:border-orange-400/40 hover:text-white light:border-black light:bg-white light:text-slate-800">
          Remove Liquidity
        </button>
      </div>
    </div>
  );
}

export default function LiquidityPoolsPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const portfolio = usePortfolioBalances();
  const [selectedPoolId, setSelectedPoolId] = useState(LIQUIDITY_POOLS[0].id);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"add" | "remove">("add");

  const selectedPool = getLiquidityPool(selectedPoolId);
  const pairedAmount = estimatePairedAmount(amount);
  const isArc = chainId === ARC_TESTNET_CHAIN_ID;

  const tokenBalanceMap = useMemo(() => {
    const map = new Map<ActiveTokenSymbol, number>();
    portfolio.positions.forEach((position) => map.set(position.token.symbol, position.balance));
    return map;
  }, [portfolio.positions]);

  const tokenABalance = tokenBalanceMap.get(selectedPool.tokenA) ?? 0;
  const tokenBBalance = tokenBalanceMap.get(selectedPool.tokenB) ?? 0;
  const numericAmount = Number(amount);
  const amountValid = Number.isFinite(numericAmount) && numericAmount > 0;
  const hasEnoughBalance = amountValid && tokenABalance >= numericAmount && tokenBBalance >= numericAmount;

  const previewState = useMemo(() => {
    if (!isConnected) return { tone: "warning", title: "Connect wallet first", detail: "Connect your wallet to preview testnet liquidity actions." };
    if (!isArc) return { tone: "warning", title: "Switch to Arc Testnet", detail: "Liquidity Pools are limited to Arc Testnet during beta." };
    if (!amountValid) return { tone: "neutral", title: "Enter an amount", detail: "Enter one token amount to estimate the paired stablecoin amount." };
    if (!hasEnoughBalance) return { tone: "warning", title: "Insufficient testnet balance", detail: `You need enough ${selectedPool.tokenA} and ${selectedPool.tokenB} to add this previewed position.` };
    return { tone: "ready", title: "Preview ready", detail: LIQUIDITY_CONTRACT_NOTICE };
  }, [amountValid, hasEnoughBalance, isArc, isConnected, selectedPool.tokenA, selectedPool.tokenB]);

  return (
    <AppShell title="Liquidity Pools" eyebrow="Arc Testnet stablecoin liquidity">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-2xl border border-orange/25 bg-gradient-to-br from-orange/15 via-white/[0.04] to-emerald-400/10 p-6 shadow-[0_24px_80px_rgba(249,115,22,0.12)] light:border-black light:bg-orange-50 light:from-orange-50 light:via-white light:to-emerald-50">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange/20 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-[0_16px_42px_rgba(249,115,22,0.28)]">
                  <Coins className="h-6 w-6" />
                </div>
                <BetaBadge />
              </div>
              <h2 className="mt-5 text-3xl font-black text-white light:text-slate-950">Testnet liquidity for Velora stablecoin pairs</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300 light:text-slate-700">{LIQUIDITY_POOL_DISCLAIMER}</p>
            </div>
            <OpenAssistantButton>Ask Velora AI</OpenAssistantButton>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          {LIQUIDITY_POOLS.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              selected={pool.id === selectedPool.id}
              onAdd={() => {
                setSelectedPoolId(pool.id);
                setMode("add");
              }}
              onRemove={() => {
                setSelectedPoolId(pool.id);
                setMode("remove");
              }}
            />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 light:border-black light:bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-200 light:text-orange-700">{mode === "add" ? "Add Liquidity" : "Remove Liquidity"}</p>
                <h3 className="mt-1 text-2xl font-black text-white light:text-slate-950">{selectedPool.pair}</h3>
              </div>
              <div className="flex rounded-xl border border-white/10 bg-black/20 p-1 light:border-black light:bg-slate-100">
                {(["add", "remove"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={cx(
                      "rounded-lg px-4 py-2 text-sm font-black capitalize transition",
                      mode === item ? "bg-gradient-to-r from-orange-500 to-red-500 text-white" : "text-slate-400 hover:text-white light:text-slate-700 light:hover:text-slate-950"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-300 light:text-slate-700">Select pair</span>
                <select value={selectedPoolId} onChange={(event) => setSelectedPoolId(event.target.value as typeof selectedPoolId)} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none focus:border-orange-400 light:border-black light:bg-white light:text-slate-950">
                  {LIQUIDITY_POOLS.map((pool) => (
                    <option key={pool.id} value={pool.id}>{pool.pair}</option>
                  ))}
                </select>
              </label>

              {mode === "add" ? (
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-300 light:text-slate-700">Token amount</span>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 light:border-black light:bg-slate-50">
                    <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder={`0.00 ${selectedPool.tokenA}`} className="w-full bg-transparent text-2xl font-black text-white outline-none placeholder:text-slate-600 light:text-slate-950" />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-400 light:text-slate-600">
                      <span>Balance: {tokenABalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedPool.tokenA}</span>
                      <span>Estimated pair: {pairedAmount || "0"} {selectedPool.tokenB}</span>
                    </div>
                  </div>
                </label>
              ) : (
                <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-5 light:border-black light:bg-amber-50">
                  <Lock className="h-6 w-6 text-amber-200 light:text-amber-700" />
                  <h4 className="mt-3 font-black text-white light:text-slate-950">No verified pool position yet</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">Remove liquidity will become available after pool contracts are integrated and a verified wallet position exists.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-white/[0.06] via-white/[0.035] to-orange-400/[0.04] p-5 light:border-black light:bg-white light:from-white light:via-orange-50/45 light:to-amber-50/50">
            <div className="flex items-start gap-3">
              {previewState.tone === "ready" ? <ShieldCheck className="h-6 w-6 text-emerald-300 light:text-emerald-700" /> : previewState.tone === "warning" ? <AlertTriangle className="h-6 w-6 text-amber-200 light:text-amber-700" /> : <Info className="h-6 w-6 text-orange-300 light:text-orange-700" />}
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 light:text-slate-600">Safe Preview</p>
                <h3 className="mt-1 text-xl font-black text-white light:text-slate-950">{previewState.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300 light:text-slate-700">{previewState.detail}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <StatLine label="Pair" value={selectedPool.pair} />
              <StatLine label="Token A amount" value={amountValid ? `${numericAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${selectedPool.tokenA}` : `-- ${selectedPool.tokenA}`} />
              <StatLine label="Token B amount" value={pairedAmount ? `${pairedAmount} ${selectedPool.tokenB}` : `-- ${selectedPool.tokenB}`} />
              <StatLine label="Estimated pool share" value="Available after pool contract integration" />
              <StatLine label="Network" value="Arc Testnet" />
              <StatLine label="Wallet" value={address ? shortAddress(address) : "Not connected"} />
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300 light:border-black light:bg-slate-50 light:text-slate-700">
              {LIQUIDITY_POOL_DISCLAIMER}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-white/[0.06] px-4 py-2.5 text-sm font-black text-slate-500 light:bg-slate-200">
                Confirm {mode === "add" ? "Add" : "Remove"} Liquidity <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setAmount("")} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-black text-slate-300 transition hover:border-orange-400/40 hover:text-white light:border-black light:text-slate-700">
                Cancel <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 light:border-black light:bg-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-300 light:text-emerald-700">Future XP tasks</p>
              <h3 className="mt-1 text-2xl font-black text-white light:text-slate-950">Liquidity rewards will require verified transactions</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 light:text-slate-700">These tasks are visible for beta planning only. XP will not be credited until a real liquidity transaction is confirmed on-chain.</p>
            </div>
            <Wallet className="h-7 w-7 text-orange-300 light:text-orange-700" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {LIQUIDITY_REWARD_TASKS.map((task) => (
              <div key={task.id} className="rounded-xl border border-white/10 bg-black/20 p-4 light:border-black light:bg-slate-50">
                <p className="font-black text-white light:text-slate-950">{task.title}</p>
                <p className="mt-2 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 px-3 py-1.5 text-center text-xs font-black text-white">+{task.reward.toLocaleString()} XP</p>
                <p className="mt-3 text-xs font-bold text-amber-200 light:text-amber-700">Pending verified liquidity contract</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
