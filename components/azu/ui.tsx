"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, LucideIcon } from "lucide-react";
import { transactions } from "./data";
import { cx } from "./utils";

export function MetricCard({ title, value, detail, icon: Icon, badge }: { title: string; value: string; detail: string; icon: LucideIcon; badge?: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="glass rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-slate-400">{title}</p>
            {badge ? <span className="rounded-full border border-mint/20 bg-mint/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-mint">{badge}</span> : null}
          </div>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          <p className="mt-2 text-xs text-mint">{detail}</p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-cyan/20 bg-cyan/10">
          <Icon className="h-5 w-5 text-cyan" />
        </div>
      </div>
    </motion.div>
  );
}

export function Panel({ title, eyebrow, children, action }: { title: string; eyebrow?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="glass rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow ? <p className="text-sm text-slate-400">{eyebrow}</p> : null}
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Confirmed" || status === "Active"
      ? "bg-mint/10 text-mint"
      : status === "Failed"
        ? "bg-red-500/10 text-red-300"
        : "bg-cyan/10 text-cyan";

  return <span className={cx("rounded-full px-3 py-1 text-xs font-medium", styles)}>{status}</span>;
}

export function TransactionsTable({ rows = transactions }: { rows?: typeof transactions }) {
  return (
    <div className="scrollbar-soft overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-y-3 text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="px-4 font-medium">Type</th>
            <th className="px-4 font-medium">Counterparty</th>
            <th className="px-4 font-medium">Amount</th>
            <th className="px-4 font-medium">Status</th>
            <th className="px-4 font-medium">Time</th>
            <th className="px-4 font-medium">Explorer</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => (
            <tr key={tx.id} className="bg-white/[0.04] text-slate-300">
              <td className="rounded-l-lg px-4 py-4">
                <span className="flex items-center gap-2">
                  {tx.type === "Receive" ? <ArrowDownLeft className="h-4 w-4 text-mint" /> : <ArrowUpRight className="h-4 w-4 text-cyan" />}
                  {tx.type}
                </span>
              </td>
              <td className="px-4 py-4 text-white">{tx.counterparty}</td>
              <td className={cx("px-4 py-4 font-semibold", tx.amount.startsWith("+") ? "text-mint" : "text-white")}>{tx.amount} USDC</td>
              <td className="px-4 py-4"><StatusBadge status={tx.status} /></td>
              <td className="px-4 py-4">{tx.time}</td>
              <td className="rounded-r-lg px-4 py-4">
                <a className="inline-flex items-center gap-1 text-cyan hover:text-mint" href="#" aria-label={`Open ${tx.id} in explorer`}>
                  {tx.explorer} <ChevronRight className="h-3 w-3" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
