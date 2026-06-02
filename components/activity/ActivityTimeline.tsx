"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock3, Info, Search } from "lucide-react";
import type { ActivityRecord, ActivityStatus } from "@/lib/activity/types";
import { APP_CHAINS } from "@/lib/config/chains";
import { explorerTxUrl, shortAddress } from "@/lib/utils/format";
import { cx } from "@/components/azu/utils";
import { NetworkLogo } from "@/components/token/NetworkLogo";
import { TokenLogo } from "@/components/token/TokenLogo";

function statusStyle(status: ActivityStatus) {
  if (status === "success") return "border-mint/30 bg-mint/10 text-mint";
  if (status === "failed") return "border-red-400/30 bg-red-500/10 text-red-200";
  if (status === "pending") return "border-cyan/30 bg-cyan/10 text-cyan";
  return "border-white/10 bg-white/[0.06] text-slate-300";
}

function StatusIcon({ status }: { status: ActivityStatus }) {
  if (status === "success") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "failed") return <AlertTriangle className="h-4 w-4" />;
  if (status === "pending") return <Clock3 className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

function metadataText(record: ActivityRecord, key: string) {
  const value = record.metadata?.[key];
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function isEvmTransactionHash(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{64}$/.test(value));
}

function getExplorerUrl(record: ActivityRecord) {
  if (!isEvmTransactionHash(record.txHash)) return null;
  const chain = APP_CHAINS.find((item) => item.name === record.network) ?? APP_CHAINS[0];
  return explorerTxUrl(chain.explorer, record.txHash as string);
}

function transactionFallbackLabel(record: ActivityRecord) {
  if (record.status === "pending") return "Transaction pending";
  if (record.actionType === "swap_completed") return "Hash unavailable";
  return "";
}

function TradeDetails({ record }: { record: ActivityRecord }) {
  const tradeType = metadataText(record, "tradeType");
  if (tradeType !== "swap" && tradeType !== "bridge") return null;

  const fromToken = tradeType === "swap" ? metadataText(record, "fromToken") : metadataText(record, "token");
  const toToken = tradeType === "swap" ? metadataText(record, "toToken") : metadataText(record, "token");
  const fromAmount = metadataText(record, "fromAmount") || record.amount || "";
  const estimatedReceive = metadataText(record, "toAmount") || metadataText(record, "receiveAmount") || metadataText(record, "estimatedReceiveAmount");
  const fromChain = metadataText(record, "fromChain");
  const toChain = metadataText(record, "toChain");
  const fromChainIconId = metadataText(record, "fromChainIconId");
  const toChainIconId = metadataText(record, "toChainIconId");
  const routeProvider = metadataText(record, "routeProvider");
  const quoteMode = metadataText(record, "quoteMode");
  const trackingStatus = metadataText(record, "trackingStatus");
  const bridgeFee = metadataText(record, "bridgeFee");
  const eta = metadataText(record, "eta");

  return (
    <div className="mt-3 rounded-lg border border-cyan/15 bg-cyan/[0.04] p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-white">
        <span className="flex items-center gap-2 font-semibold">
          {fromToken ? <TokenLogo symbol={fromToken} size={24} /> : null}
          {fromAmount || "--"} {fromToken}
        </span>
        <ArrowRight className="h-4 w-4 text-cyan" />
        <span className="flex items-center gap-2 font-semibold">
          {toToken ? <TokenLogo symbol={toToken} size={24} /> : null}
          {estimatedReceive || "--"} {toToken}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        {fromChain ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1">
            {fromChainIconId ? <NetworkLogo id={fromChainIconId} size={18} /> : null}
            {fromChain}
          </span>
        ) : null}
        {toChain ? (
          <>
            <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1">
              {toChainIconId ? <NetworkLogo id={toChainIconId} size={18} /> : null}
              {toChain}
            </span>
          </>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
        {routeProvider ? <span className="rounded-full bg-white/[0.05] px-3 py-1">Route: {routeProvider}</span> : null}
        {quoteMode ? <span className="rounded-full bg-white/[0.05] px-3 py-1 capitalize">Mode: {quoteMode}</span> : null}
        {trackingStatus ? <span className="rounded-full bg-white/[0.05] px-3 py-1 capitalize">State: {labelize(trackingStatus)}</span> : null}
        {bridgeFee ? <span className="rounded-full bg-white/[0.05] px-3 py-1">Fee: {bridgeFee}</span> : null}
        {eta ? <span className="rounded-full bg-white/[0.05] px-3 py-1">ETA: {eta}</span> : null}
      </div>
    </div>
  );
}

function PaymentDetails({ record }: { record: ActivityRecord }) {
  if (record.feature !== "send" && record.feature !== "agent_payments") return null;
  const token = metadataText(record, "token") || record.token || "";
  const amount = metadataText(record, "amount") || record.amount || "";
  const counterparty = metadataText(record, "counterparty") || metadataText(record, "recipient") || metadataText(record, "destination") || metadataText(record, "serviceName");

  return (
    <div className="mt-3 rounded-lg border border-cyan/15 bg-cyan/[0.04] p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-white">
        {token ? <TokenLogo symbol={token} size={24} /> : null}
        <span className="font-semibold">{amount || "--"} {token}</span>
        {counterparty ? (
          <>
            <ArrowRight className="h-4 w-4 text-cyan" />
            <span className="font-semibold">{counterparty.startsWith("0x") ? shortAddress(counterparty) : counterparty}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function TransactionDetails({ record, explorerUrl }: { record: ActivityRecord; explorerUrl: string | null }) {
  const approvalTxHash = metadataText(record, "approvalTxHash");
  const mainTxHash = metadataText(record, "mainTxHash") || (record.txHash && record.txHash !== "N/A" ? record.txHash : "");
  const routeProvider = metadataText(record, "routeProvider");

  if (!approvalTxHash && !mainTxHash && !routeProvider) return null;

  return (
    <details className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">
      <summary className="cursor-pointer font-semibold text-slate-300">Transaction details</summary>
      <div className="mt-3 space-y-2">
        {mainTxHash ? (
          <p>
            <span className="text-slate-500">Main tx:</span>{" "}
            {explorerUrl ? (
              <a href={explorerUrl} target="_blank" rel="noreferrer" className="text-cyan hover:text-cyan">
                {shortAddress(mainTxHash)}
              </a>
            ) : (
              <span>{shortAddress(mainTxHash)}</span>
            )}
          </p>
        ) : null}
        {approvalTxHash ? (
          <p>
            <span className="text-slate-500">Approval tx:</span> {shortAddress(approvalTxHash)}
          </p>
        ) : null}
        {routeProvider ? (
          <p>
            <span className="text-slate-500">Route:</span> {routeProvider}
          </p>
        ) : null}
      </div>
    </details>
  );
}

export function ActivityTimeline({ records, emptyText = "No activity recorded yet." }: { records: ActivityRecord[]; emptyText?: string }) {
  if (!records.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
        <Search className="mx-auto h-8 w-8 text-cyan" />
        <p className="mt-4 text-sm text-slate-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record, index) => (
        <ActivityRow key={record.id} record={record} index={index} />
      ))}
    </div>
  );
}

function ActivityRow({ record, index }: { record: ActivityRecord; index: number }) {
  const explorerUrl = getExplorerUrl(record);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.02, 0.12) }}
      className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-cyan/20 bg-cyan/10 text-cyan">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-white">{record.title}</h3>
              <span className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", statusStyle(record.status))}>
                <StatusIcon status={record.status} />
                {record.status}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{record.description}</p>
            <TradeDetails record={record} />
            <PaymentDetails record={record} />
            <TransactionDetails record={record} explorerUrl={explorerUrl} />
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-white/[0.05] px-3 py-1 capitalize">{record.feature}</span>
              <span className="rounded-full bg-white/[0.05] px-3 py-1">{record.walletAddress === "guest" ? "Guest" : shortAddress(record.walletAddress)}</span>
              {record.token ? <span className="rounded-full bg-white/[0.05] px-3 py-1">{record.token}</span> : null}
              {record.amount ? <span className="rounded-full bg-white/[0.05] px-3 py-1">{record.amount}</span> : null}
              {record.network ? <span className="rounded-full bg-white/[0.05] px-3 py-1">{record.network}</span> : null}
              {record.txHash && record.txHash !== "N/A" ? (
                explorerUrl ? (
                  <a className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 font-semibold text-cyan hover:text-cyan" href={explorerUrl} target="_blank" rel="noreferrer">
                    View Transaction
                  </a>
                ) : (
                  <span className="rounded-full bg-white/[0.05] px-3 py-1">Tx: {shortAddress(record.txHash)}</span>
                )
              ) : transactionFallbackLabel(record) ? (
                <span className="rounded-full bg-white/[0.05] px-3 py-1">{transactionFallbackLabel(record)}</span>
              ) : null}
            </div>
          </div>
        </div>
        <time className="text-xs text-slate-500">{new Date(record.timestamp).toLocaleString()}</time>
      </div>
    </motion.article>
  );
}
