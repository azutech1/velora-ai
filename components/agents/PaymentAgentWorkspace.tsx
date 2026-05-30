"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, CreditCard, ExternalLink, Loader2, Plus, Repeat, Send, WalletCards } from "lucide-react";
import { isAddress } from "viem";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { saveAgentPaymentRequest } from "@/lib/agent-payments/storage";
import type { AgentPaymentRecord, AgentPaymentType } from "@/lib/agent-payments/types";
import { shortAddress } from "@/lib/utils/format";

const paymentTypes: Array<{ value: AgentPaymentType; label: string; icon: typeof Send }> = [
  { value: "one-time", label: "One-time payment", icon: Send },
  { value: "recurring", label: "Recurring payment", icon: Repeat },
  { value: "scheduled", label: "Scheduled payment", icon: CalendarClock }
];

type PaymentFormState = {
  recipientName: string;
  walletAddress: string;
  amount: string;
  paymentType: AgentPaymentType;
  description: string;
  scheduleDate: string;
};

const initialForm: PaymentFormState = {
  recipientName: "",
  walletAddress: "",
  amount: "",
  paymentType: "one-time",
  description: "",
  scheduleDate: ""
};

function validateForm(form: PaymentFormState) {
  if (!form.recipientName.trim()) return "Recipient name is required.";
  if (!isAddress(form.walletAddress)) return "Enter a valid EVM wallet address.";
  if (!form.amount || Number(form.amount) <= 0) return "Amount must be greater than 0 USDC.";
  if (!form.description.trim()) return "Description is required.";
  if (form.paymentType === "scheduled" && !form.scheduleDate) return "Schedule date is required for scheduled payments.";
  return null;
}

export function PaymentAgentWorkspace() {
  const { recordActivity } = useActivityRecorder();
  const [form, setForm] = useState<PaymentFormState>(initialForm);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<AgentPaymentRecord | null>(null);

  const selectedType = useMemo(() => paymentTypes.find((type) => type.value === form.paymentType) ?? paymentTypes[0], [form.paymentType]);

  function updateForm<K extends keyof PaymentFormState>(key: K, value: PaymentFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function createRequest() {
    setError(null);
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setCreating(true);
    try {
      const request = saveAgentPaymentRequest({
        agentName: "Payment Agent",
        serviceName: form.recipientName.trim(),
        recipientName: form.recipientName.trim(),
        amount: form.amount.trim(),
        token: "USDC",
        destination: form.walletAddress.trim(),
        network: "Arc Testnet",
        rail: "Circle Gateway",
        executionMode: "gateway-transfer",
        paymentType: form.paymentType,
        description: form.description.trim(),
        scheduleDate: form.paymentType === "scheduled" ? form.scheduleDate : undefined
      });

      recordActivity({
        actionType: "approval_requested",
        title: "Payment Agent request created",
        description: `${request.paymentType} USDC payment request created for ${request.recipientName ?? request.serviceName}.`,
        feature: "agent_payments",
        token: request.token,
        amount: request.amount,
        network: request.network,
        status: "pending",
        metadata: {
          paymentId: request.paymentId,
          paymentType: request.paymentType,
          recipientName: request.recipientName ?? null,
          destination: request.destination,
          scheduleDate: request.scheduleDate ?? null
        }
      });

      setCreatedRequest(request);
      setForm(initialForm);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-cyan/20 bg-cyan/[0.06] p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-semibold text-white">
              <WalletCards className="h-4 w-4 text-cyan" />
              Payment Agent workspace
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Create USDC payment requests for approval. Requests enter Agent Payments first, then the existing Circle Gateway execution layer runs only after approval.
            </p>
          </div>
          <Link href="/agent-payments" className="inline-flex items-center gap-2 rounded-lg border border-cyan/30 px-3 py-2 text-xs font-semibold text-cyan hover:bg-cyan/10">
            View approvals <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-white">Create Payment Request</p>
            <p className="mt-1 text-sm text-slate-400">Every request stays pending until the user approves it.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/10 px-3 py-1 text-xs font-semibold text-mint">
            <CreditCard className="h-3.5 w-3.5" /> USDC only
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {paymentTypes.map((type) => {
            const Icon = type.icon;
            const active = form.paymentType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => updateForm("paymentType", type.value)}
                className={`rounded-lg border p-4 text-left transition ${active ? "border-mint/40 bg-mint/10 text-white" : "border-white/10 bg-black/20 text-slate-300 hover:border-cyan/30"}`}
              >
                <Icon className={active ? "h-5 w-5 text-mint" : "h-5 w-5 text-cyan"} />
                <p className="mt-3 text-sm font-semibold">{type.label}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="text-slate-400">Recipient Name</span>
            <input value={form.recipientName} onChange={(event) => updateForm("recipientName", event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-mint/60" />
          </label>
          <label className="text-sm">
            <span className="text-slate-400">Wallet Address</span>
            <input value={form.walletAddress} onChange={(event) => updateForm("walletAddress", event.target.value)} placeholder="0x..." className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-mint/60" />
          </label>
          <label className="text-sm">
            <span className="text-slate-400">Amount (USDC)</span>
            <input value={form.amount} onChange={(event) => updateForm("amount", event.target.value)} inputMode="decimal" placeholder="0.00" className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-mint/60" />
          </label>
          <label className="text-sm">
            <span className="text-slate-400">Payment Type</span>
            <input value={selectedType.label} readOnly className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-slate-300 outline-none" />
          </label>
          {form.paymentType === "scheduled" ? (
            <label className="text-sm md:col-span-2">
              <span className="text-slate-400">Schedule Date</span>
              <input value={form.scheduleDate} onChange={(event) => updateForm("scheduleDate", event.target.value)} type="datetime-local" className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-mint/60" />
            </label>
          ) : null}
          <label className="text-sm md:col-span-2">
            <span className="text-slate-400">Description</span>
            <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-mint/60" />
          </label>
        </div>

        {error ? <p className="mt-4 rounded-lg border border-red-400/20 bg-red-500/[0.06] p-3 text-sm text-red-100">{error}</p> : null}

        {createdRequest ? (
          <div className="mt-4 rounded-lg border border-mint/20 bg-mint/[0.06] p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-white">
              <CheckCircle2 className="h-4 w-4 text-mint" />
              Payment request created
            </p>
            <p className="mt-2 text-slate-400">
              Payment ID <span className="font-mono text-cyan">{createdRequest.paymentId}</span> is pending approval for {createdRequest.amount} USDC to {shortAddress(createdRequest.destination)}.
            </p>
          </div>
        ) : null}

        <button onClick={createRequest} disabled={creating} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-5 py-3 text-sm font-bold text-[#031018] shadow-neon disabled:cursor-not-allowed disabled:opacity-60">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create Payment Request
        </button>
      </div>
    </div>
  );
}
