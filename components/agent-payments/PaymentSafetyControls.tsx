"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { isAddress } from "viem";
import { Panel } from "@/components/azu/ui";
import { useAgentPaymentPolicy } from "@/hooks/useAgentPaymentPolicy";
import type { AgentPaymentRecord } from "@/lib/agent-payments/types";
import { getAgentPaymentSpendUsage } from "@/lib/agent-payments/policy";
import { shortAddress } from "@/lib/utils/format";

export function PaymentSafetyControls({ payments }: { payments: AgentPaymentRecord[] }) {
  const { policy, recipients, updatePolicy, addRecipient, removeRecipient } = useAgentPaymentPolicy();
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const usage = useMemo(() => getAgentPaymentSpendUsage(payments), [payments]);

  function handleAddRecipient() {
    setError(null);
    if (!recipientName.trim()) {
      setError("Recipient name is required.");
      return;
    }
    if (!isAddress(recipientAddress)) {
      setError("Enter a valid EVM wallet address.");
      return;
    }
    addRecipient(recipientName, recipientAddress);
    setRecipientName("");
    setRecipientAddress("");
  }

  return (
    <Panel title="Payment Safety" eyebrow="Spend limits and recipient controls">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm">
            <span className="text-slate-400">Per-payment limit</span>
            <input
              value={policy.perPaymentLimit}
              onChange={(event) => updatePolicy({ ...policy, perPaymentLimit: event.target.value })}
              inputMode="decimal"
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan/60"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-400">Daily spend limit</span>
            <input
              value={policy.dailySpendLimit}
              onChange={(event) => updatePolicy({ ...policy, dailySpendLimit: event.target.value })}
              inputMode="decimal"
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan/60"
            />
          </label>
          <label className="text-sm">
            <span className="text-slate-400">Monthly spend limit</span>
            <input
              value={policy.monthlySpendLimit}
              onChange={(event) => updatePolicy({ ...policy, monthlySpendLimit: event.target.value })}
              inputMode="decimal"
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan/60"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">Daily usage</p>
            <p className="mt-2 text-2xl font-bold text-white">{usage.daily.toFixed(2)} USDC</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">Monthly usage</p>
            <p className="mt-2 text-2xl font-bold text-white">{usage.monthly.toFixed(2)} USDC</p>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
            <span>
              <span className="flex items-center gap-2 font-semibold text-white"><ShieldCheck className="h-4 w-4 text-mint" /> Require allowlist</span>
              <span className="mt-2 block text-slate-400">Block approvals to unknown recipients.</span>
            </span>
            <input
              type="checkbox"
              checked={policy.requireAllowlist}
              onChange={(event) => updatePolicy({ ...policy, requireAllowlist: event.target.checked })}
              className="h-5 w-5 accent-[#10f5c5]"
            />
          </label>
        </div>

        <div className="rounded-lg border border-cyan/20 bg-cyan/[0.05] p-4">
          <p className="font-semibold text-white">Recipient allowlist</p>
          <div className="mt-4 grid gap-3 md:grid-cols-[0.8fr_1fr_auto]">
            <input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} placeholder="Recipient name" className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan/60" />
            <input value={recipientAddress} onChange={(event) => setRecipientAddress(event.target.value)} placeholder="0x wallet address" className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan/60" />
            <button onClick={handleAddRecipient} className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan px-4 py-3 text-sm font-bold text-white">
              <UserPlus className="h-4 w-4" /> Add
            </button>
          </div>
          {error ? <p className="mt-3 rounded-lg border border-red-400/20 bg-red-500/[0.06] p-3 text-sm text-red-100">{error}</p> : null}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recipients.length ? (
              recipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">
                  <div>
                    <p className="font-semibold text-white">{recipient.name}</p>
                    <p className="mt-1 text-slate-400">{shortAddress(recipient.address)}</p>
                  </div>
                  <button onClick={() => removeRecipient(recipient.id)} className="rounded-lg border border-red-400/30 p-2 text-red-200 hover:bg-red-400/10" aria-label={`Remove ${recipient.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-400 md:col-span-2">No recipients are allowlisted yet.</div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
