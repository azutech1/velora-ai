"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RadioTower, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CROSS_CHAIN_NETWORKS, type BridgeNetwork } from "@/lib/swap/networks";
import { NetworkLogo } from "@/components/token/NetworkLogo";

function NetworkIcon({ network }: { network: BridgeNetwork }) {
  return <NetworkLogo id={network.iconId} size={40} />;
}

export function NetworkPill({ network }: { network: BridgeNetwork }) {
  return (
    <span className="flex items-center gap-3">
      <NetworkIcon network={network} />
      <span>
        <span className="block font-bold text-white">{network.name}</span>
        <span className="block text-xs text-slate-400">Chain ID {network.chainId}</span>
      </span>
    </span>
  );
}

export function NetworkSelector({ label, network, onSelect }: { label: string; network: BridgeNetwork; onSelect: (network: BridgeNetwork) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => CROSS_CHAIN_NETWORKS.filter((item) => `${item.name} ${item.chainId}`.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-cyan/40">
        <NetworkPill network={network} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 20, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }} className="glass max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-lg">
              <div className="flex items-center justify-between border-b border-white/10 p-5">
                <div>
                  <p className="text-sm text-slate-400">{label}</p>
                  <h2 className="text-xl font-bold text-white">Select network</h2>
                </div>
                <button className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white" onClick={() => setOpen(false)} aria-label="Close network selector">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5">
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan/60" placeholder="Search network" />
                </label>
                <div className="mt-5 space-y-2">
                  {filtered.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelect(item);
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-mint/30 hover:bg-mint/10"
                    >
                      <NetworkPill network={item} />
                      <span className={item.status === "supported" ? "rounded-full bg-mint/10 px-3 py-1 text-xs text-mint" : "rounded-full bg-cyan/10 px-3 py-1 text-xs text-cyan"}>
                        {item.status}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <RadioTower className="h-5 w-5 text-cyan" />
                  <p className="mt-3 text-sm leading-6 text-slate-400">RPC and explorer values are placeholders for non-Arc testnets until real bridge infrastructure is configured.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
