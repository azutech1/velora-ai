"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/azu/app-shell";
import { FaucetCard } from "@/components/faucet/FaucetCard";
import { FaucetEligibility } from "@/components/faucet/FaucetEligibility";
import { FaucetHistory } from "@/components/faucet/FaucetHistory";
import { FaucetStats } from "@/components/faucet/FaucetStats";
import { TokenLogo } from "@/components/token/TokenLogo";
import { useFaucet } from "@/hooks/useFaucet";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { CIRCLE_FAUCET_URL, FAUCET_SAFETY_TEXT, FAUCET_TOKENS, type FaucetClaim } from "@/lib/faucet/tokens";
import { ARC_EXPLORER_URL } from "@/lib/web3/chains";
import { explorerTxUrl, shortAddress } from "@/lib/utils/format";

type Toast = { type: "success" | "error"; text: string } | null;

export default function FaucetPage() {
  const { claims, loadingSymbol, isConnected, isArc, dailyRemainingClaims, getEligibility, requestToken } = useFaucet();
  const { recordActivity } = useActivityRecorder();
  const [successClaim, setSuccessClaim] = useState<FaucetClaim | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleRequest(token: (typeof FAUCET_TOKENS)[number]) {
    try {
      const claim = await requestToken(token);
      setSuccessClaim(claim);
      setToast({ type: "success", text: `${claim.amount} requested in Demo Mode.` });
      recordActivity({
        actionType: token.symbol === "AVL" ? "avl_testnet_claim" : "faucet_claim",
        title: `${token.symbol} faucet claim`,
        description: `${claim.amount} requested from the Velora AI demo faucet.`,
        feature: "faucet",
        token: token.symbol,
        amount: claim.amount,
        network: "Arc Testnet",
        status: "success",
        txHash: claim.hash
      });
      return claim;
    } catch (error) {
      setToast({ type: "error", text: error instanceof Error ? error.message : "Faucet request failed." });
      recordActivity({
        actionType: token.symbol === "AVL" ? "avl_testnet_claim" : "faucet_claim",
        title: `${token.symbol} faucet claim failed`,
        description: error instanceof Error ? error.message : "Faucet request failed.",
        feature: "faucet",
        token: token.symbol,
        amount: token.faucetAmount,
        network: "Arc Testnet",
        status: "failed"
      });
      throw error;
    }
  }

  return (
    <AppShell title="Faucet" eyebrow="Arc testnet token requests">
      <div className="space-y-6">
        <FaucetEligibility isConnected={isConnected} isArc={isArc} />
        <section className="glass rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Official external faucet</p>
              <h2 className="text-xl font-bold text-white">Circle Testnet Faucet</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Use Circle&apos;s public faucet directly for supported testnet assets when available. This opens Circle in a new tab and does not run through Velora AI.</p>
            </div>
            <a href={CIRCLE_FAUCET_URL} target="_blank" rel="noreferrer" className="rounded-lg border border-mint/30 bg-mint/10 px-4 py-3 text-sm font-bold text-mint transition hover:bg-mint hover:text-[#031018]">
              Open Circle Faucet
            </a>
          </div>
        </section>
        <FaucetStats dailyRemainingClaims={dailyRemainingClaims} lastClaim={claims[0]?.symbol} />

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Token request cards</p>
              <h2 className="text-xl font-bold text-white">Request testnet assets</h2>
            </div>
            <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">Demo Mode</span>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {FAUCET_TOKENS.map((token) => (
              <FaucetCard key={token.symbol} token={token} eligibility={getEligibility(token)} loading={loadingSymbol === token.symbol} onRequest={handleRequest} />
            ))}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <FaucetHistory claims={claims} />
          <section className="glass rounded-lg p-5">
            <h2 className="text-xl font-bold text-white">Token balance preview</h2>
            <div className="mt-5 space-y-3">
              {FAUCET_TOKENS.map((token) => (
                <div key={token.symbol} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center gap-3">
                    <TokenLogo symbol={token.symbol} size={36} />
                    <div>
                      <p className="font-semibold text-white">{token.symbol}</p>
                      <p className="text-xs text-slate-400">{token.name}</p>
                    </div>
                  </div>
                  <p className="text-sm text-mint">{token.mockBalance}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-lg border border-cyan/20 bg-cyan/10 p-4 text-sm leading-6 text-cyan">{FAUCET_SAFETY_TEXT}</p>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {successClaim ? (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 20, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }} className="glass w-full max-w-md rounded-lg p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Demo faucet success</p>
                  <h2 className="mt-1 text-xl font-bold text-white">{successClaim.amount}</h2>
                </div>
                <button onClick={() => setSuccessClaim(null)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white" aria-label="Close success modal">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 rounded-lg border border-mint/20 bg-mint/10 p-4 text-sm text-mint">
                <Check className="mb-2 h-5 w-5" />
                Mock claim created. This does not call a real faucet API.
              </div>
              <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-slate-500">Mock transaction hash</p>
                <p className="mt-2 break-all text-sm font-semibold text-white">{successClaim.hash}</p>
                <a className="mt-3 inline-flex text-sm text-cyan hover:text-mint" href={explorerTxUrl(ARC_EXPLORER_URL, successClaim.hash)} target="_blank" rel="noreferrer">
                  Explorer placeholder: {shortAddress(successClaim.hash)}
                </a>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border border-white/10 bg-[#07111f]/95 p-4 shadow-neon backdrop-blur-xl">
            <div className="flex gap-3">
              {toast.type === "success" ? <Check className="h-5 w-5 text-mint" /> : <AlertTriangle className="h-5 w-5 text-red-300" />}
              <p className="text-sm leading-6 text-slate-200">{toast.text}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AppShell>
  );
}
