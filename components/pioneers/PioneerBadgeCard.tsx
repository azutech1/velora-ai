"use client";

import { motion } from "framer-motion";
import { cx } from "@/components/azu/utils";
import type { PioneerBadge, PioneerBadgeIcon, PioneerBadgeTier } from "@/lib/pioneers/system";

const tierStyles: Record<PioneerBadgeTier, { frame: string; text: string; accent: string; glow: string; gradient: [string, string, string] }> = {
  Pioneer: {
    frame: "border-slate-300/30 bg-slate-300/10",
    text: "text-slate-200",
    accent: "#CBD5E1",
    glow: "shadow-[0_0_28px_rgba(203,213,225,0.16)]",
    gradient: ["#111827", "#64748B", "#E2E8F0"]
  },
  Operator: {
    frame: "border-cyan/30 bg-cyan/10",
    text: "text-cyan",
    accent: "#3B82F6",
    glow: "shadow-[0_0_32px_rgba(59,130,246,0.22)]",
    gradient: ["#0B1220", "#1D4ED8", "#38BDF8"]
  },
  Builder: {
    frame: "border-yellow-400/35 bg-yellow-400/10",
    text: "text-yellow-200",
    accent: "#F59E0B",
    glow: "shadow-[0_0_34px_rgba(245,158,11,0.2)]",
    gradient: ["#111827", "#B45309", "#FDE68A"]
  },
  Architect: {
    frame: "border-slate-100/35 bg-slate-100/10",
    text: "text-slate-100",
    accent: "#E5E7EB",
    glow: "shadow-[0_0_34px_rgba(226,232,240,0.18)]",
    gradient: ["#1E293B", "#94A3B8", "#F8FAFC"]
  },
  "Network Elite": {
    frame: "border-blue-300/40 bg-blue-400/10",
    text: "text-blue-200",
    accent: "#60A5FA",
    glow: "shadow-[0_0_38px_rgba(96,165,250,0.28)]",
    gradient: ["#0B1220", "#2563EB", "#A5F3FC"]
  },
  Genesis: {
    frame: "border-amber-300/45 bg-black/30",
    text: "text-amber-200",
    accent: "#FBBF24",
    glow: "shadow-[0_0_42px_rgba(251,191,36,0.28)]",
    gradient: ["#030712", "#111827", "#FBBF24"]
  }
};

function iconPath(icon: PioneerBadgeIcon) {
  const paths: Record<PioneerBadgeIcon, string> = {
    compass: "M40 18l9 22-9 22-9-22 9-22zm0 14l-3 8 3 8 3-8-3-8z",
    rocket: "M47 16c-10 3-18 11-22 23l-7 2 8 8 2 13 8-7c12-4 20-12 23-22 2-6 2-12 0-17-5-2-10-2-12 0zm-3 15a5 5 0 1010 0 5 5 0 00-10 0z",
    swap: "M24 30h25l-7-7 4-4 14 14-14 14-4-4 7-7H24v-6zm32 20H31l7 7-4 4-14-14 14-14 4 4-7 7h25v6z",
    bridge: "M18 51c4-14 12-22 22-22s18 8 22 22h-8c-3-9-8-14-14-14s-11 5-14 14h-8zm2 8h40v6H20v-6z",
    agent: "M25 31h30v22H25V31zm6-10h18v6H31v-6zm-3 16v10h24V37H28zm-7 2h-5v8h5v-8zm43 0h-5v8h5v-8z",
    automation: "M40 20l5 7 8-1 2 8 7 4-4 7 1 8-8 2-4 7-7-4-8 1-2-8-7-4 4-7-1-8 8-2 4-7zm0 13a7 7 0 100 14 7 7 0 000-14z",
    whale: "M18 44c5-12 17-16 30-13 8 2 13 7 14 14l8-6v14l-8-4c-2 8-10 13-22 13-12 0-20-6-22-18zm12-1a3 3 0 106 0 3 3 0 00-6 0z",
    shield: "M40 16l21 8v16c0 13-8 22-21 27-13-5-21-14-21-27V24l21-8zm0 9l-13 5v11c0 8 4 14 13 18 9-4 13-10 13-18V30l-13-5z",
    builder: "M22 54h36v8H22v-8zm4-28h12v24H26V26zm16-8h12v32H42V18z",
    architect: "M40 15l25 14v6H15v-6l25-14zm-18 25h6v18h-6V40zm15 0h6v18h-6V40zm15 0h6v18h-6V40z",
    strategist: "M24 22h32v8H24v-8zm0 14h22v8H24v-8zm0 14h32v8H24v-8zm35-14l6 6-6 6-6-6 6-6z",
    diamond: "M40 14l24 18-24 34-24-34 24-18zm0 10l-11 8 11 17 11-17-11-8z",
    genesis: "M40 13l7 18h19L51 43l6 20-17-12-17 12 6-20-15-12h19l7-18z"
  };
  return paths[icon];
}

export function PioneerBadgeCard({ badge, compact = false }: { badge: PioneerBadge; compact?: boolean }) {
  const style = tierStyles[badge.tier];
  const progress = badge.completionPercentage;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cx(
        "group rounded-lg border p-4 transition",
        badge.earned ? `${style.frame} ${style.glow}` : "border-white/10 bg-white/[0.04]",
        badge.tier === "Genesis" && badge.earned && "animate-pulse"
      )}
    >
      <div className="flex items-start gap-4">
        <svg viewBox="0 0 96 112" className={cx("h-20 w-16 shrink-0 transition group-hover:scale-105", !badge.earned && "grayscale opacity-45")} role="img" aria-label={`${badge.name} badge`}>
          <defs>
            <linearGradient id={`velora-badge-${badge.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={style.gradient[0]} />
              <stop offset="55%" stopColor={style.gradient[1]} />
              <stop offset="100%" stopColor={style.gradient[2]} />
            </linearGradient>
            <linearGradient id={`velora-metal-${badge.id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
            </linearGradient>
          </defs>
          <path d="M48 4 86 24v42c0 18-15 32-38 42C25 98 10 84 10 66V24L48 4z" fill={`url(#velora-badge-${badge.id})`} stroke={style.accent} strokeWidth="3" />
          <path d="M22 30 48 17l26 13v33c0 13-10 23-26 31-16-8-26-18-26-31V30z" fill="rgba(255,255,255,0.08)" stroke={`url(#velora-metal-${badge.id})`} />
          <path d={iconPath(badge.icon)} fill={badge.earned ? style.accent : "#64748B"} />
          <path d="M26 78h44v8H26z" fill="rgba(255,255,255,0.16)" />
        </svg>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-white">{badge.name}</p>
            <span className={cx("rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]", badge.earned ? `${style.frame} ${style.text}` : "border-white/10 text-slate-500")}>{badge.tier}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">{badge.detail}</p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className={badge.earned ? "font-semibold text-mint" : badge.status === "In Progress" ? "font-semibold text-cyan" : "font-semibold text-slate-500"}>{badge.status}</span>
              <span className="text-slate-500">{progress}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-black/30">
              <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: badge.earned ? style.accent : "#334155" }} />
            </div>
            {!compact ? (
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p>Current Progress: {badge.currentProgress}</p>
                <p>Next Requirement: {badge.nextRequirement}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
