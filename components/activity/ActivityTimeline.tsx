"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Info, Search } from "lucide-react";
import { ActivityRecord, ActivityStatus } from "@/lib/activity/types";
import { shortAddress } from "@/lib/utils/format";
import { cx } from "@/components/azu/utils";

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
        <motion.article
          key={record.id}
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
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-white/[0.05] px-3 py-1 capitalize">{record.feature}</span>
                  <span className="rounded-full bg-white/[0.05] px-3 py-1">{record.walletAddress === "guest" ? "Guest" : shortAddress(record.walletAddress)}</span>
                  {record.token ? <span className="rounded-full bg-white/[0.05] px-3 py-1">{record.token}</span> : null}
                  {record.amount ? <span className="rounded-full bg-white/[0.05] px-3 py-1">{record.amount}</span> : null}
                  {record.network ? <span className="rounded-full bg-white/[0.05] px-3 py-1">{record.network}</span> : null}
                  {record.txHash ? <span className="rounded-full bg-white/[0.05] px-3 py-1">{shortAddress(record.txHash)}</span> : null}
                </div>
              </div>
            </div>
            <time className="text-xs text-slate-500">{new Date(record.timestamp).toLocaleString()}</time>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
