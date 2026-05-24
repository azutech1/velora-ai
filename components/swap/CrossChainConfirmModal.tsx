"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import { type BridgeFlowState } from "@/hooks/useCrossChainSwap";
import { type BridgeQuote } from "@/lib/swap/bridge";
import { type BridgeNetwork } from "@/lib/swap/networks";

export function CrossChainConfirmModal({
  open,
  onClose,
  onConfirm,
  state,
  fromNetwork,
  toNetwork,
  amount,
  quote
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  state: BridgeFlowState;
  fromNetwork: BridgeNetwork;
  toNetwork: BridgeNetwork;
  amount: string;
  quote: BridgeQuote;
}) {
  const busy = state === "approving" || state === "bridging" || state === "confirming";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ scale: 0.94, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 18 }} className="glass w-full max-w-lg rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Cross-chain USDC review</p>
                <h2 className="mt-1 text-xl font-bold text-white">Confirm Bridge Demo</h2>
              </div>
              <button onClick={onClose} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white" aria-label="Close bridge confirmation">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 space-y-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm">
              <div className="flex justify-between gap-4 text-slate-300"><span>From</span><span className="text-right text-white">{fromNetwork.name}</span></div>
              <div className="flex justify-between gap-4 text-slate-300"><span>To</span><span className="text-right text-white">{toNetwork.name}</span></div>
              <div className="flex justify-between text-slate-300"><span>Amount</span><span className="text-white">{amount} USDC</span></div>
              <div className="flex justify-between text-slate-300"><span>Receive</span><span className="text-white">{quote.estimatedReceive.toFixed(4)} USDC</span></div>
              <div className="flex justify-between text-slate-300"><span>Bridge fee</span><span>{quote.bridgeFee.toFixed(4)} USDC</span></div>
            </div>
            <div className="mt-4 rounded-lg border border-cyan/30 bg-cyan/10 p-4 text-sm leading-6 text-cyan">
              Demo Mode: real bridge not connected yet. No cross-chain transaction will be executed.
            </div>
            <button onClick={onConfirm} disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mint to-cyan px-5 py-3 font-bold text-[#031018] shadow-neon disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {busy ? state : "Confirm Bridge Demo"}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
