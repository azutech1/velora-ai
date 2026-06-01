"use client";

import type { AchievementProgress } from "@/lib/pioneers/system";

export function AchievementProgressCard({ item }: { item: AchievementProgress }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{item.title}</p>
          <p className="mt-2 text-lg font-black text-white">{item.currentBadge}</p>
        </div>
        <span className="rounded-full border border-cyan/25 bg-cyan/10 px-3 py-1 text-xs font-bold text-cyan">{item.progress}%</span>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-slate-500">Current Progress</p>
          <p className="font-semibold text-white">{item.currentProgress}</p>
        </div>
        <div>
          <p className="text-slate-500">Next Badge</p>
          <p className="font-semibold text-white">{item.nextBadge}</p>
        </div>
        <div>
          <p className="text-slate-500">Requirement</p>
          <p className="font-semibold text-white">{item.requirement}</p>
        </div>
        <div>
          <p className="text-slate-500">Remaining</p>
          <p className="font-semibold text-white">{item.remaining}</p>
        </div>
      </div>
      <div className="mt-4 h-2.5 rounded-full bg-black/30">
        <div className="h-full rounded-full bg-cyan" style={{ width: `${item.progress}%` }} />
      </div>
    </div>
  );
}
