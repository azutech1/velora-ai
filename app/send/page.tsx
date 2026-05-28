"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, ExternalLink, Loader2, Send, X } from "lucide-react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { FeesBarChart } from "@/components/azu/charts";
import { Panel } from "@/components/azu/ui";
import { useArcNetwork } from "@/hooks/useArcNetwork";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useUSDC, type USDCSendPreview } from "@/hooks/useUSDC";
import { ARC_EXPLORER_URL, arcNetwork } from "@/lib/web3/chains";
import { explorerTxUrl, formatGasEstimate } from "@/lib/utils/format";

type SendState = "idle" | "previewing" | "ready" | "sending" | "confirming" | "success" | "error";
type Toast = { type: "success" | "error" | "info"; text: string } | null;

export default function SendPage() {
  const [amount, setAmount] = useState("1250");
  const [recipient, setRecipient] = useState("0x0000000000000000000000000000000000000001");
  const [state, setState] = useState<SendState>("idle");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<USDCSendPreview | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const { isConnected, address } = useAccount();
  const { chainId, isArc, isSwitching, switchToArc } = useArcNetwork();
  const { previewSendUSDC, sendUSDC, hash, error, isConfirming, isConfirmed } = useUSDC();
  const { recordActivity } = useActivityRecorder();
  const fee = useMemo(() => Math.max(Number(amount || 0) * 0.000018, 0.0038).toFixed(4), [amount]);
  const validRecipient = isAddress(recipient);
  const validAmount = Number.isFinite(Number(amount)) && Number(amount) > 0;

  useEffect(() => {
    if (!isConfirming || state !== "sending") return;
    setState("confirming");
    setMessage("Transaction submitted. Waiting for Arc confirmation...");
  }, [isConfirming, state]);

  useEffect(() => {
    if (!isConfirmed || !hash) return;
    setState("success");
    setMessage("USDC transfer confirmed on Arc Testnet.");
    setToast({ type: "success", text: "USDC transfer confirmed on Arc Testnet." });
    const count = Number(window.localStorage.getItem("velora:transactionCount") ?? "0") + 1;
    window.localStorage.setItem("velora:transactionCount", String(count));
    window.localStorage.setItem(
      "velora:lastTransaction",
      JSON.stringify({
        hash,
        amount,
        recipient,
        createdAt: new Date().toISOString()
      })
    );
    recordActivity({
      actionType: "usdc_send_completed",
      title: "USDC send completed",
      description: `${amount} USDC transfer confirmed on Arc Testnet.`,
      feature: "send",
      token: "USDC",
      amount,
      network: "Arc Testnet",
      status: "success",
      txHash: hash
    });
  }, [amount, hash, isConfirmed, recipient, recordActivity]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!error) return;
    setState("error");
    setMessage(error);
    setToast({ type: "error", text: error });
    recordActivity({
      actionType: "usdc_send_failed",
      title: "USDC send failed",
      description: error,
      feature: "send",
      token: "USDC",
      amount,
      network: "Arc Testnet",
      status: "failed"
    });
  }, [amount, error, recordActivity]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isConnected) {
      setState("error");
      setMessage("Connect a wallet before preparing a USDC transfer.");
      setToast({ type: "error", text: "Connect a wallet before preparing a transfer." });
      recordActivity({
        actionType: "usdc_send_failed",
        title: "USDC send blocked",
        description: "A USDC send was attempted without a connected wallet.",
        feature: "send",
        token: "USDC",
        amount,
        network: "Arc Testnet",
        status: "failed"
      });
      return;
    }

    if (!validRecipient || !validAmount) {
      setState("error");
      setMessage("Enter a valid recipient address and USDC amount.");
      setToast({ type: "error", text: "Enter a valid recipient and amount." });
      recordActivity({
        actionType: "usdc_send_failed",
        title: "USDC send validation failed",
        description: "The recipient address or amount was invalid.",
        feature: "send",
        token: "USDC",
        amount,
        network: "Arc Testnet",
        status: "failed"
      });
      return;
    }

    recordActivity({
      actionType: "usdc_send_started",
      title: "USDC send started",
      description: `Preparing ${amount} USDC transfer on Arc Testnet.`,
      feature: "send",
      token: "USDC",
      amount,
      network: "Arc Testnet",
      status: "pending"
    });
    setState("previewing");
    setMessage("Estimating gas on Arc Testnet...");
    const prepared = await previewSendUSDC(recipient, amount);
    setPreview(prepared);
    if (prepared.valid) {
      setState("ready");
      setMessage("Transaction preview is ready for confirmation.");
      setToast({ type: "info", text: "Transaction preview ready." });
      setModalOpen(true);
    } else {
      setState("error");
      setMessage(prepared.reason);
      setToast({ type: "error", text: prepared.reason });
      recordActivity({
        actionType: "usdc_send_failed",
        title: "USDC send preview failed",
        description: prepared.reason,
        feature: "send",
        token: "USDC",
        amount,
        network: "Arc Testnet",
        status: "failed"
      });
    }
  }

  async function confirmPreparedTransaction() {
    if (!preview?.valid) return;
    try {
      setState("sending");
      setMessage("Open your wallet and confirm the USDC transfer.");
      setToast({ type: "info", text: "Confirm the transaction in your wallet." });
      await sendUSDC(preview.recipient, amount);
      setModalOpen(false);
    } catch {
      setModalOpen(false);
    }
  }

  return (
    <AppShell title="Payments" eyebrow="Arc Network USDC payment composer">
      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Panel title="Transfer details" eyebrow="Arc Network payment composer">
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm text-slate-300">
              Recipient address
              <input value={recipient} onChange={(event) => setRecipient(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-mint/60" placeholder="0x..." />
              <span className={validRecipient ? "mt-2 block text-xs text-mint" : "mt-2 block text-xs text-red-300"}>
                {validRecipient ? "Valid EVM address" : "Enter a valid EVM address"}
              </span>
            </label>
            <label className="block text-sm text-slate-300">
              Amount
              <input value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-mint/60" inputMode="decimal" />
              <span className={validAmount ? "mt-2 block text-xs text-mint" : "mt-2 block text-xs text-red-300"}>
                {validAmount ? "Amount ready for USDC decimals" : "Amount must be greater than zero"}
              </span>
            </label>
            <label className="block text-sm text-slate-300">
              Network
              <select className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan/60">
                <option>Arc Network</option>
                <option>Arc Testnet</option>
              </select>
            </label>

            <div className="rounded-lg border border-mint/20 bg-mint/10 p-4 text-sm">
              <div className="flex justify-between text-slate-300"><span>Fee preview</span><span>${fee}</span></div>
              <div className="mt-2 flex justify-between text-slate-300"><span>Wallet</span><span className={isConnected ? "text-mint" : "text-red-300"}>{isConnected ? "Connected" : "Disconnected"}</span></div>
              <div className="mt-2 flex justify-between text-slate-300"><span>Network</span><span className={isArc ? "text-mint" : "text-cyan"}>{isConnected ? (isArc ? "Arc selected" : "Switch to Arc") : "Pending wallet"}</span></div>
              <div className="mt-2 flex justify-between text-slate-300"><span>Gas estimate</span><span>{preview?.valid ? formatGasEstimate(preview.gas) : "Preview required"}</span></div>
            </div>

            {!isArc && isConnected ? (
              <button type="button" onClick={() => switchToArc()} disabled={isSwitching} className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-5 py-3 font-bold text-cyan transition hover:border-mint/40 hover:text-mint disabled:opacity-60">
                {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Switch to Arc Testnet
              </button>
            ) : null}

            <button disabled={state === "previewing" || state === "sending" || state === "confirming"} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mint to-cyan px-5 py-3 font-bold text-[#031018] shadow-neon transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
              {state === "previewing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Preview Transaction
            </button>
          </form>

          {state === "success" ? (
            <div className="mt-5 rounded-lg border border-mint/30 bg-mint/10 p-4 text-sm text-mint">
              <Check className="mb-2 h-5 w-5" />
              {message}
            </div>
          ) : null}
          {hash ? (
            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Transaction hash</p>
              <p className="mt-2 break-all">{hash}</p>
              <a className="mt-3 inline-flex items-center gap-2 text-cyan hover:text-mint" href={explorerTxUrl(ARC_EXPLORER_URL, hash)} target="_blank" rel="noreferrer">
                View on ArcScan <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ) : null}
          {state === "error" ? (
            <div className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              <AlertTriangle className="mb-2 h-5 w-5" />
              {message}
            </div>
          ) : null}
          {state === "ready" || state === "previewing" || state === "sending" || state === "confirming" ? (
            <div className="mt-5 rounded-lg border border-cyan/30 bg-cyan/10 p-4 text-sm text-cyan">
              {state === "previewing" || state === "sending" || state === "confirming" ? <Loader2 className="mb-2 h-5 w-5 animate-spin" /> : <Check className="mb-2 h-5 w-5" />}
              {message}
            </div>
          ) : null}
        </Panel>

        <div className="space-y-6">
          <Panel title="Transaction summary" eyebrow="Policy simulation">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Connected wallet", address ?? "Not connected"],
                ["Recipient", recipient || "Not set"],
                ["Amount", `${amount || "0"} USDC`],
                ["Network", isConnected ? (isArc ? "Arc Testnet" : `Chain ${chainId}`) : "No wallet network"],
                ["Total debit", `${(Number(amount || 0) + Number(fee)).toFixed(4)} USDC`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-2 break-words text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Fee trend" eyebrow="Mock Arc fee telemetry">
            <div className="h-64">
              <FeesBarChart />
            </div>
          </Panel>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen ? (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.94, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 18 }} className="glass w-full max-w-lg rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">USDC transfer preview</p>
                  <h2 className="mt-1 text-xl font-bold text-white">Confirm Send</h2>
                </div>
                <button onClick={() => setModalOpen(false)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white" aria-label="Close confirmation">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 space-y-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm">
                <div className="flex justify-between gap-4 text-slate-300"><span>From</span><span className="break-all text-right text-white">{address ?? "Not connected"}</span></div>
                <div className="flex justify-between gap-4 text-slate-300"><span>To</span><span className="break-all text-right text-white">{recipient}</span></div>
                <div className="flex justify-between text-slate-300"><span>Amount</span><span className="text-white">{amount} USDC</span></div>
                <div className="flex justify-between text-slate-300"><span>Network</span><span>{arcNetwork.name}</span></div>
                <div className="flex justify-between text-slate-300"><span>Estimated gas</span><span>{preview?.valid ? formatGasEstimate(preview.gas) : "Not available"}</span></div>
              </div>
              {preview && !preview.valid ? (
                <div className="mt-4 rounded-lg border border-cyan/30 bg-cyan/10 p-4 text-sm leading-6 text-cyan">{preview.reason}</div>
              ) : null}
              <button onClick={confirmPreparedTransaction} disabled={state === "sending" || state === "confirming" || !preview?.valid} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mint to-cyan px-5 py-3 font-bold text-[#031018] shadow-neon disabled:cursor-not-allowed disabled:opacity-60">
                {state === "sending" || state === "confirming" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Confirm Transaction
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border border-white/10 bg-[#07111f]/95 p-4 shadow-neon backdrop-blur-xl">
            <div className="flex gap-3">
              {toast.type === "error" ? <AlertTriangle className="h-5 w-5 text-red-300" /> : toast.type === "success" ? <Check className="h-5 w-5 text-mint" /> : <Loader2 className="h-5 w-5 animate-spin text-cyan" />}
              <p className="text-sm leading-6 text-slate-200">{toast.text}</p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AppShell>
  );
}
