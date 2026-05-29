"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, ExternalLink, Loader2, Send, X } from "lucide-react";
import { isAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useArcNetwork } from "@/hooks/useArcNetwork";
import { useTransactions } from "@/hooks/useTransactions";
import { useUSDC, type USDCSendPreview } from "@/hooks/useUSDC";
import { erc20UsdcAbi, USDC_CONTRACT_ADDRESS } from "@/lib/contracts/usdc";
import { explorerTxUrl, formatGasEstimate, formatUSDC, shortAddress } from "@/lib/utils/format";
import { ARC_EXPLORER_URL, arcNetwork } from "@/lib/web3/chains";

type SendState = "idle" | "previewing" | "ready" | "sending" | "confirming" | "success" | "error";
type Toast = { type: "success" | "error" | "info"; text: string } | null;

export default function SendPage() {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<USDCSendPreview | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const { isConnected, address } = useAccount();
  const { chainId, isArc, isSwitching, switchToArc } = useArcNetwork();
  const { previewSendUSDC, sendUSDC } = useUSDC();
  const { transaction, trackTransaction, resetTransaction } = useTransactions();
  const { recordActivity } = useActivityRecorder();

  const { data: usdcBalance, isLoading: isBalanceLoading, isError: isBalanceError, refetch: refetchUsdcBalance } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: erc20UsdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && isArc && address)
    }
  });

  const validRecipient = isAddress(recipient);
  const validAmount = Number.isFinite(Number(amount)) && Number(amount) > 0;

  const balanceLabel = useMemo(() => {
    if (!isConnected) return "Connect wallet";
    if (!isArc) return "Switch to Arc";
    if (isBalanceLoading) return "Loading...";
    if (isBalanceError || usdcBalance === undefined) return "No balance data";
    return formatUSDC(usdcBalance);
  }, [isArc, isBalanceError, isBalanceLoading, isConnected, usdcBalance]);

  const txHash = transaction.hash;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function resetPreview() {
    setPreview(null);
    resetTransaction();
    if (state !== "sending" && state !== "confirming") {
      setState("idle");
      setMessage("");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    resetTransaction();

    if (!isConnected) {
      const reason = "Connect a wallet before preparing a USDC transfer.";
      setState("error");
      setMessage(reason);
      setToast({ type: "error", text: reason });
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
      const reason = "Enter a valid recipient address and USDC amount.";
      setState("error");
      setMessage(reason);
      setToast({ type: "error", text: reason });
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
      setMessage("Transaction preview is ready for wallet confirmation.");
      setToast({ type: "info", text: "Transaction preview ready." });
      setModalOpen(true);
      return;
    }

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

  async function confirmPreparedTransaction() {
    if (!preview?.valid) return;

    try {
      setState("sending");
      setMessage("Open your wallet and confirm the USDC transfer.");
      setToast({ type: "info", text: "Confirm the transaction in your wallet." });

      const submittedHash = await sendUSDC(preview.recipient, amount);
      setModalOpen(false);
      setState("confirming");
      setMessage("Transaction submitted. Waiting for Arc confirmation...");

      const receipt = await trackTransaction(submittedHash);
      if (receipt?.status !== "success") {
        throw new Error("Arc returned a failed transaction receipt.");
      }

      setState("success");
      setMessage("USDC transfer confirmed on Arc Testnet.");
      setToast({ type: "success", text: "USDC transfer confirmed on Arc Testnet." });
      window.localStorage.setItem(
        "velora:lastTransaction",
        JSON.stringify({
          hash: submittedHash,
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
        txHash: submittedHash
      });
      void refetchUsdcBalance();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "USDC transaction failed.";
      setModalOpen(false);
      setState("error");
      setMessage(reason);
      setToast({ type: "error", text: reason });
      recordActivity({
        actionType: "usdc_send_failed",
        title: "USDC send failed",
        description: reason,
        feature: "send",
        token: "USDC",
        amount,
        network: "Arc Testnet",
        status: "failed",
        txHash
      });
    }
  }

  const currentStatus = transaction.status === "idle" ? state : transaction.status;

  return (
    <AppShell title="Payments" eyebrow="Arc Testnet USDC payment composer">
      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Panel title="Transfer details" eyebrow="Real Arc Testnet transfer">
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm text-slate-300">
              Recipient address
              <input
                value={recipient}
                onChange={(event) => {
                  setRecipient(event.target.value);
                  resetPreview();
                }}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-mint/60"
                placeholder="0x..."
              />
              <span className={validRecipient ? "mt-2 block text-xs text-mint" : "mt-2 block text-xs text-red-300"}>
                {validRecipient ? "Valid EVM address" : "Enter a valid EVM address"}
              </span>
            </label>
            <label className="block text-sm text-slate-300">
              Amount
              <input
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  resetPreview();
                }}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-mint/60"
                inputMode="decimal"
                placeholder="0.00"
              />
              <span className={validAmount ? "mt-2 block text-xs text-mint" : "mt-2 block text-xs text-red-300"}>
                {validAmount ? "Amount ready for USDC decimals" : "Amount must be greater than zero"}
              </span>
            </label>

            <div className="rounded-lg border border-mint/20 bg-mint/10 p-4 text-sm">
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Wallet balance</span>
                <span className={isConnected && isArc ? "text-mint" : "text-slate-300"}>{balanceLabel}</span>
              </div>
              <div className="mt-2 flex justify-between text-slate-300">
                <span>Wallet</span>
                <span className={isConnected ? "text-mint" : "text-red-300"}>{isConnected ? shortAddress(address) : "Disconnected"}</span>
              </div>
              <div className="mt-2 flex justify-between text-slate-300">
                <span>Network</span>
                <span className={isArc ? "text-mint" : "text-cyan"}>{isConnected ? (isArc ? "Arc Testnet" : `Chain ${chainId}`) : "Pending wallet"}</span>
              </div>
              <div className="mt-2 flex justify-between text-slate-300">
                <span>Estimated gas</span>
                <span>{preview?.valid ? formatGasEstimate(preview.gas) : "Preview required"}</span>
              </div>
              <div className="mt-2 flex justify-between text-slate-300">
                <span>Status</span>
                <span className="capitalize text-white">{currentStatus}</span>
              </div>
            </div>

            {!isArc && isConnected ? (
              <button
                type="button"
                onClick={() => switchToArc()}
                disabled={isSwitching}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-5 py-3 font-bold text-cyan transition hover:border-mint/40 hover:text-mint disabled:opacity-60"
              >
                {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Switch to Arc Testnet
              </button>
            ) : null}

            <button
              disabled={state === "previewing" || state === "sending" || state === "confirming"}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mint to-cyan px-5 py-3 font-bold text-[#031018] shadow-neon transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
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
          {txHash ? (
            <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Transaction hash</p>
              <p className="mt-2 break-all">{txHash}</p>
              <a className="mt-3 inline-flex items-center gap-2 text-cyan hover:text-mint" href={explorerTxUrl(ARC_EXPLORER_URL, txHash)} target="_blank" rel="noreferrer">
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
          <Panel title="Transaction summary" eyebrow="Arc confirmation preview">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Connected wallet", address ? shortAddress(address) : "Not connected"],
                ["Recipient", recipient ? shortAddress(recipient) : "Not set"],
                ["Amount", amount ? `${amount} USDC` : "Not set"],
                ["Network", isConnected ? (isArc ? "Arc Testnet" : `Chain ${chainId}`) : "No wallet network"],
                ["USDC contract", shortAddress(USDC_CONTRACT_ADDRESS)],
                ["Estimated gas", preview?.valid ? formatGasEstimate(preview.gas) : "Preview required"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-2 break-words text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Transaction status" eyebrow="Arc Testnet tracking">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">Current status</p>
                  <p className="mt-2 text-lg font-bold capitalize text-white">{currentStatus}</p>
                </div>
                {state === "previewing" || state === "sending" || state === "confirming" || transaction.status === "pending" ? <Loader2 className="h-5 w-5 animate-spin text-cyan" /> : <Check className="h-5 w-5 text-mint" />}
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-300">
                <div className="flex justify-between gap-4">
                  <span>Balance source</span>
                  <span className="text-right text-white">Arc ERC-20 USDC</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Live balance</span>
                  <span className="text-right text-white">{balanceLabel}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Explorer</span>
                  {txHash ? (
                    <a className="text-right text-cyan hover:text-mint" href={explorerTxUrl(ARC_EXPLORER_URL, txHash)} target="_blank" rel="noreferrer">
                      Open transaction
                    </a>
                  ) : (
                    <span className="text-right text-white">Available after submit</span>
                  )}
                </div>
              </div>
              {transaction.error ? <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{transaction.error}</p> : null}
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
                  <h2 className="mt-1 text-xl font-bold text-white">Confirm Payment</h2>
                </div>
                <button onClick={() => setModalOpen(false)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white" aria-label="Close confirmation">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 space-y-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm">
                <div className="flex justify-between gap-4 text-slate-300">
                  <span>From</span>
                  <span className="break-all text-right text-white">{address ?? "Not connected"}</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-300">
                  <span>To</span>
                  <span className="break-all text-right text-white">{recipient}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Amount</span>
                  <span className="text-white">{amount} USDC</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Network</span>
                  <span>{arcNetwork.name}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimated gas</span>
                  <span>{preview?.valid ? formatGasEstimate(preview.gas) : "Not available"}</span>
                </div>
              </div>
              {preview && !preview.valid ? <div className="mt-4 rounded-lg border border-cyan/30 bg-cyan/10 p-4 text-sm leading-6 text-cyan">{preview.reason}</div> : null}
              <button
                onClick={confirmPreparedTransaction}
                disabled={state === "sending" || state === "confirming" || !preview?.valid}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mint to-cyan px-5 py-3 font-bold text-[#031018] shadow-neon disabled:cursor-not-allowed disabled:opacity-60"
              >
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
