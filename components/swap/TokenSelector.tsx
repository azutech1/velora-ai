"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SWAP_TOKENS, type SwapToken, type SwapTokenCategory } from "@/lib/swap/tokens";
import { cx } from "@/components/azu/utils";
import { TokenLogo } from "@/components/token/TokenLogo";

const filters: Array<"all" | SwapTokenCategory> = ["all", "stablecoin", "wrapped asset", "native ecosystem token"];

function TokenIcon({ token }: { token: SwapToken }) {
  return <TokenLogo symbol={token.symbol} size={40} />;
}

export function TokenPill({ token }: { token: SwapToken }) {
  return (
    <span className="flex items-center gap-2">
      <TokenIcon token={token} />
      <span>
        <span className="block font-bold text-white">{token.symbol}</span>
        <span className="block text-xs text-slate-400">{token.name}</span>
      </span>
    </span>
  );
}

export function TokenSelector({ token, onSelect, label }: { token: SwapToken; onSelect: (token: SwapToken) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | SwapTokenCategory>("all");

  const filtered = useMemo(
    () =>
      SWAP_TOKENS.filter((item) => {
        const matchesFilter = filter === "all" || item.category === filter;
        const matchesQuery = `${item.symbol} ${item.name}`.toLowerCase().includes(query.toLowerCase());
        return matchesFilter && matchesQuery;
      }),
    [filter, query]
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-cyan/40">
        <TokenPill token={token} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 20, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }} className="glass max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-lg">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div>
                  <p className="text-sm text-slate-400">{label}</p>
                  <h2 className="text-xl font-bold text-white">Select token</h2>
                </div>
                <button className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white" onClick={() => setOpen(false)} aria-label="Close token selector">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5">
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan/60" placeholder="Search symbol or token name" />
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                  {filters.map((item) => (
                    <button key={item} onClick={() => setFilter(item)} className={cx("rounded-full border px-3 py-2 text-xs capitalize transition", filter === item ? "border-mint/40 bg-mint/10 text-mint" : "border-white/10 text-slate-400 hover:text-white")}>
                      {item}
                    </button>
                  ))}
                </div>
                <div className="scrollbar-soft mt-5 max-h-[48vh] space-y-2 overflow-y-auto pr-1">
                  {filtered.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => {
                        onSelect(item);
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-mint/30 hover:bg-mint/10"
                    >
                      <TokenPill token={item} />
                      <span className="text-right text-xs text-slate-400">
                        <span className="block capitalize">{item.category}</span>
                        <span className="mt-1 inline-flex rounded-full border border-mint/20 bg-mint/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-mint">Verified</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
