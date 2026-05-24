"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { transactions } from "@/components/azu/data";
import { Panel, TransactionsTable } from "@/components/azu/ui";
import { cx } from "@/components/azu/utils";

const tabs = ["All", "Send", "Receive"];

export default function TransactionsPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("All");
  const filtered = useMemo(
    () =>
      transactions.filter((tx) => {
        const matchesTab = tab === "All" || tx.type === tab;
        const matchesQuery = `${tx.counterparty} ${tx.type} ${tx.status} ${tx.id}`.toLowerCase().includes(query.toLowerCase());
        return matchesTab && matchesQuery;
      }),
    [query, tab]
  );

  return (
    <AppShell title="Transactions">
      <Panel title="Transaction history" eyebrow="Search, filter, audit, and open Arc explorer records">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-lg border border-white/10 bg-black/20 p-1">
            {tabs.map((item) => (
              <button key={item} onClick={() => setTab(item)} className={cx("rounded-md px-4 py-2 text-sm transition", tab === item ? "bg-mint text-[#031018]" : "text-slate-300 hover:text-white")}>
                {item}
              </button>
            ))}
          </div>
          <label className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm outline-none focus:border-cyan/60" placeholder="Search transactions" />
          </label>
        </div>
        <TransactionsTable rows={filtered} />
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>Page 1 of 8</span>
          <div className="flex gap-2">
            <button className="rounded-lg border border-white/10 px-3 py-2">Prev</button>
            <button className="rounded-lg border border-mint/30 bg-mint/10 px-3 py-2 text-mint">Next</button>
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}
