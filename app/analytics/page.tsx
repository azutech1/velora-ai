"use client";

import { Activity, CircleDollarSign, TrendingUp, Zap } from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { FeesBarChart, TransactionLineChart, VolumeAreaChart } from "@/components/azu/charts";
import { MetricCard, Panel } from "@/components/azu/ui";

export default function AnalyticsPage() {
  return (
    <AppShell title="Analytics">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Weekly volume" value="$643k" detail="+28.4%" icon={CircleDollarSign} />
          <MetricCard title="Avg finality" value="1.8s" detail="Arc median" icon={Zap} />
          <MetricCard title="Success rate" value="99.3%" detail="Confirmed payments" icon={TrendingUp} />
          <MetricCard title="API events" value="412" detail="Connected services" icon={Activity} />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Volume overview" eyebrow="USDC settlement flow">
            <div className="h-80">
              <VolumeAreaChart />
            </div>
          </Panel>
          <Panel title="Fee analytics" eyebrow="Arc routing estimates">
            <div className="h-80">
              <FeesBarChart />
            </div>
          </Panel>
        </div>
        <Panel title="Transaction and agent activity">
          <div className="h-80">
            <TransactionLineChart />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
