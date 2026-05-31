"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { analyticsData } from "./data";

function ChartShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-full w-full animate-pulse rounded-lg bg-white/[0.04]" />;
  }

  return children;
}

const tooltipStyle = {
  background: "#111827",
  border: "1px solid rgba(31,41,55,.95)",
  borderRadius: 8,
  color: "#f8fafc"
};

export function VolumeAreaChart() {
  return (
    <ChartShell>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={analyticsData}>
          <defs>
            <linearGradient id="volumeGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="volume" stroke="#3B82F6" strokeWidth={3} fill="url(#volumeGradient)" />
          <Line type="monotone" dataKey="agents" stroke="#60A5FA" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function TransactionLineChart() {
  return (
    <ChartShell>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={analyticsData}>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="transactions" stroke="#3B82F6" strokeWidth={3} dot={{ fill: "#3B82F6" }} />
          <Line type="monotone" dataKey="agents" stroke="#60A5FA" strokeWidth={3} dot={{ fill: "#60A5FA" }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function FeesBarChart() {
  return (
    <ChartShell>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={analyticsData}>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="fees" fill="#3B82F6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
