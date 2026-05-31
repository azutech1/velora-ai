"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronRight, Clock3, Loader2, ReceiptText, RotateCcw, X } from "lucide-react";
import { useAccount } from "wagmi";
import { Panel } from "@/components/azu/ui";
import { cx } from "@/components/azu/utils";
import { PaymentSafetyControls } from "@/components/agent-payments/PaymentSafetyControls";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useAgentPaymentApprovals } from "@/hooks/useAgentPaymentApprovals";
import type { AgentPaymentRecord, AgentPaymentStatus } from "@/lib/agent-payments/types";
import { APP_CHAINS } from "@/lib/config/chains";
import { explorerTxUrl, shortAddress } from "@/lib/utils/format";

function statusStyles(status: AgentPaymentStatus) {
  if (status === "completed") return "border-mint/30 bg-mint/10 text-mint";
  if (status === "failed" || status === "rejected") return "border-red-400/30 bg-red-500/10 text-red-200";
  if (status === "executing") return "border-cyan/30 bg-cyan/10 text-cyan";
  return "border-white/10 bg-white/[0.06] text-slate-300";
}

function isEvmTransactionHash(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{64}$/.test(value));
}

function getExplorerUrl(payment: AgentPaymentRecord) {
  if (!isEvmTransactionHash(payment.txHash)) return null;
  const chain = APP_CHAINS.find((item) => item.name === payment.network) ?? APP_CHAINS[0];
  return explorerTxUrl(chain.explorer, payment.txHash as string);
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
      <ReceiptText className="mx-auto h-8 w-8 text-cyan" />
      <p className="mt-4 text-sm text-slate-400">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan" />
      <p className="mt-4 text-sm text-slate-400">Loading agent payment approvals...</p>
    </div>
  );
}

function PendingApprovalsTable({
  rows,
  executingPaymentId,
  onApprove,
  onReject
}: {
  rows: AgentPaymentRecord[];
  executingPaymentId: string | null;
  onApprove: (paymentId: string) => void;
  onReject: (paymentId: string, reason: string) => void;
}) {
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  if (!rows.length) return <EmptyState message="No pending agent payment approvals." />;

  return (
    <div className="space-y-4">
      <div className="scrollbar-soft overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-y-3 text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="px-4 font-medium">Payment ID</th>
              <th className="px-4 font-medium">Agent Name</th>
              <th className="px-4 font-medium">Service Name</th>
              <th className="px-4 font-medium">Type</th>
              <th className="px-4 font-medium">Amount</th>
              <th className="px-4 font-medium">Destination</th>
              <th className="px-4 font-medium">Timestamp</th>
              <th className="px-4 font-medium">Status</th>
              <th className="px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((payment) => {
              const executing = executingPaymentId === payment.paymentId;
              return (
                <tr key={payment.paymentId} className="bg-white/[0.04] text-slate-300">
                  <td className="rounded-l-lg px-4 py-4 font-mono text-xs text-cyan">{payment.paymentId}</td>
                  <td className="px-4 py-4 text-white">{payment.agentName}</td>
                  <td className="px-4 py-4">{payment.serviceName}</td>
                  <td className="px-4 py-4 capitalize">{payment.paymentType}</td>
                  <td className="px-4 py-4 font-semibold text-white">{payment.amount} USDC</td>
                  <td className="max-w-[180px] truncate px-4 py-4" title={payment.destination}>{shortAddress(payment.destination)}</td>
                  <td className="px-4 py-4">{new Date(payment.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className={cx("rounded-full border px-2.5 py-1 text-xs font-semibold capitalize", statusStyles(payment.status))}>{payment.status}</span>
                  </td>
                  <td className="rounded-r-lg px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onApprove(payment.paymentId)}
                        disabled={executing}
                        className="inline-flex items-center gap-2 rounded-lg border border-mint/30 px-3 py-2 text-xs font-semibold text-mint transition hover:bg-mint/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setRejectingPaymentId(payment.paymentId);
                          setReason("");
                        }}
                        disabled={executing}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rejectingPaymentId ? (
        <div className="rounded-lg border border-red-400/20 bg-red-500/[0.06] p-4">
          <p className="text-sm font-semibold text-white">Reject payment</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Rejection reason"
              className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-red-300/60"
            />
            <button
              onClick={() => {
                onReject(rejectingPaymentId, reason);
                setRejectingPaymentId(null);
                setReason("");
              }}
              className="rounded-lg bg-red-300 px-4 py-3 text-sm font-bold text-[#24070a]"
            >
              Confirm Reject
            </button>
            <button onClick={() => setRejectingPaymentId(null)} className="rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RecentPaymentsTable({ rows, executingPaymentId, onRetry }: { rows: AgentPaymentRecord[]; executingPaymentId: string | null; onRetry: (paymentId: string) => void }) {
  if (!rows.length) return <EmptyState message="No agent payments yet." />;

  return (
    <div className="scrollbar-soft overflow-x-auto">
      <table className="w-full min-w-[980px] border-separate border-spacing-y-3 text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="px-4 font-medium">Agent Name</th>
            <th className="px-4 font-medium">Service</th>
            <th className="px-4 font-medium">Type</th>
            <th className="px-4 font-medium">Amount</th>
            <th className="px-4 font-medium">Status</th>
            <th className="px-4 font-medium">Timestamp</th>
            <th className="px-4 font-medium">Transaction</th>
            <th className="px-4 font-medium">Logs</th>
            <th className="px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((payment) => {
            const explorerUrl = getExplorerUrl(payment);
            const executing = executingPaymentId === payment.paymentId;
            const latestLog = payment.logs[payment.logs.length - 1];
            return (
              <tr key={payment.paymentId} className="bg-white/[0.04] text-slate-300">
                <td className="rounded-l-lg px-4 py-4 text-white">{payment.agentName}</td>
                <td className="px-4 py-4">{payment.serviceName}</td>
                <td className="px-4 py-4 capitalize">{payment.paymentType}</td>
                <td className="px-4 py-4 font-semibold text-white">{payment.amount} USDC</td>
                <td className="px-4 py-4">
                  <span className={cx("rounded-full border px-2.5 py-1 text-xs font-semibold capitalize", statusStyles(payment.status))}>{payment.status}</span>
                </td>
                <td className="px-4 py-4">{new Date(payment.completedAt ?? payment.approvalTime ?? payment.timestamp).toLocaleString()}</td>
                <td className="px-4 py-4">
                  {explorerUrl ? (
                    <a className="inline-flex items-center gap-1 text-cyan hover:text-cyan" href={explorerUrl} target="_blank" rel="noreferrer">
                      {shortAddress(payment.txHash)} <ChevronRight className="h-3.5 w-3.5" />
                    </a>
                  ) : payment.transferId ? (
                    <span className="font-mono text-xs text-slate-400">{shortAddress(payment.transferId)}</span>
                  ) : (
                    <span className="text-slate-500">Not available</span>
                  )}
                </td>
                <td className="max-w-[260px] px-4 py-4">
                  <details>
                    <summary className="cursor-pointer text-cyan">{latestLog?.message ?? "No logs"}</summary>
                    <div className="mt-3 space-y-2">
                      {payment.logs.map((log) => (
                        <div key={log.id} className="rounded-lg bg-black/20 p-3 text-xs text-slate-400">
                          <p className="font-semibold capitalize text-slate-200">{log.level}</p>
                          <p className="mt-1">{log.message}</p>
                          {log.details ? <p className="mt-1 break-words text-slate-500">{log.details}</p> : null}
                          <p className="mt-1 text-slate-600">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                </td>
                <td className="rounded-r-lg px-4 py-4">
                  {payment.status === "failed" ? (
                    <button
                      onClick={() => onRetry(payment.paymentId)}
                      disabled={executing}
                      className="inline-flex items-center gap-2 rounded-lg border border-cyan/30 px-3 py-2 text-xs font-semibold text-cyan transition hover:bg-cyan/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      Retry
                    </button>
                  ) : (
                    <span className="text-slate-500">--</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AgentPaymentApprovals() {
  const { address, isConnected } = useAccount();
  const { isAdmin } = useAdminMode();
  const { pendingApprovals, recentPayments, loading, error, executingPaymentId, approvePayment, rejectPayment, retryPayment } = useAgentPaymentApprovals();
  const visiblePendingApprovals = useMemo(() => {
    if (!isConnected || !address) return [];
    if (isAdmin) return pendingApprovals;
    const wallet = address.toLowerCase();
    return pendingApprovals.filter((payment) => payment.walletAddress?.toLowerCase() === wallet);
  }, [address, isAdmin, isConnected, pendingApprovals]);
  const visibleRecentPayments = useMemo(() => {
    if (!isConnected || !address) return [];
    if (isAdmin) return recentPayments;
    const wallet = address.toLowerCase();
    return recentPayments.filter((payment) => payment.walletAddress?.toLowerCase() === wallet);
  }, [address, isAdmin, isConnected, recentPayments]);
  const activeExecutions = useMemo(() => visibleRecentPayments.filter((payment) => payment.status === "executing").length, [visibleRecentPayments]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-400/20 bg-red-500/[0.06] p-4 text-sm text-red-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <Panel title="Pending Approvals" eyebrow="Manual approval is required before every payment">
        <PendingApprovalsTable rows={visiblePendingApprovals} executingPaymentId={executingPaymentId} onApprove={(paymentId) => void approvePayment(paymentId)} onReject={rejectPayment} />
      </Panel>

      {isAdmin ? (
        <Panel title="Execution Monitor" eyebrow={`${activeExecutions} active executions`}>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <Clock3 className="h-5 w-5 text-cyan" />
            <p className="mt-3 text-sm text-slate-400">Lifecycle</p>
            <p className="mt-1 font-semibold text-white">Pending {">"} Approved {">"} Executing {">"} Completed or Failed</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <ReceiptText className="h-5 w-5 text-mint" />
            <p className="mt-3 text-sm text-slate-400">Balance check</p>
            <p className="mt-1 font-semibold text-white">Gateway balance is verified before execution.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <RotateCcw className="h-5 w-5 text-cyan" />
            <p className="mt-3 text-sm text-slate-400">Retries</p>
            <p className="mt-1 font-semibold text-white">Failed payments can be retried after reviewing logs.</p>
          </div>
        </div>
        </Panel>
      ) : null}

      {isAdmin ? <PaymentSafetyControls payments={visibleRecentPayments} /> : null}

      <Panel title="Recent Agent Payments" eyebrow="Approved payment lifecycle and transaction records">
        <RecentPaymentsTable rows={visibleRecentPayments} executingPaymentId={executingPaymentId} onRetry={(paymentId) => void retryPayment(paymentId)} />
      </Panel>
    </div>
  );
}
