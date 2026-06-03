"use client";

import { ArrowRight, BadgeCheck, Blocks, Crown, Flag, Layers, LockKeyhole, Rocket, ShieldCheck, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";

const utilityCards = [
  { title: "Ecosystem Rewards", detail: "Designed for future ecosystem participation programs.", icon: Sparkles },
  { title: "Community Participation", detail: "Support recognition for users who help the network grow.", icon: Users },
  { title: "Velora Pioneers Recognition", detail: "Connect reputation, badges, streaks, and meaningful activity.", icon: BadgeCheck },
  { title: "Premium Features", detail: "Planned support for advanced product capabilities.", icon: Crown },
  { title: "Governance Initiatives", detail: "Future community input paths may be introduced over time.", icon: Flag },
  { title: "Partner Ecosystem Benefits", detail: "Create room for integrations across the Velora ecosystem.", icon: Blocks },
  { title: "Future Campaigns", detail: "Support product-led ecosystem initiatives as Velora matures.", icon: Rocket },
  { title: "Platform Incentives", detail: "Align useful platform activity with long-term ecosystem growth.", icon: Layers }
];

const tokenStatus = [
  ["Token Status", "In Development"],
  ["Launch Timeline", "To Be Announced"],
  ["Tokenomics", "Coming Soon"],
  ["Supply Details", "To Be Announced"],
  ["Distribution Details", "To Be Announced"]
];

export default function TokenPage() {
  return (
    <AppShell title="Velora Token" eyebrow="Ecosystem utility">
      <div className="space-y-6">
        <Panel
          title="Velora Token"
          eyebrow="Future ecosystem utility"
          action={<span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs font-bold text-cyan">In Development</span>}
        >
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="grid h-16 w-16 place-items-center rounded-lg border border-cyan/25 bg-cyan/10">
                <ShieldCheck className="h-8 w-8 text-cyan" />
              </div>
              <h2 className="mt-5 text-3xl font-black text-white">The future utility token of the Velora ecosystem.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                Token details will be revealed as the ecosystem evolves.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current status</p>
              <div className="mt-4 space-y-3">
                {tokenStatus.slice(0, 3).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-3">
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-right text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="What is Velora Token?" eyebrow="About">
          <div className="max-w-4xl space-y-4 text-sm leading-7 text-slate-300">
            <p>
              The Velora Token is being designed to power the next generation of the Velora ecosystem.
            </p>
            <p>
              Velora is building a stablecoin-focused platform where users can swap assets, bridge across networks, interact with AI-powered tools, and build their reputation through meaningful on-chain activity.
            </p>
            <p>
              The Velora Token is intended to align platform growth with community participation.
            </p>
          </div>
        </Panel>

        <Panel title="Why Velora Token?" eyebrow="Purpose">
          <div className="rounded-lg border border-cyan/20 bg-cyan/10 p-5">
            <p className="max-w-4xl text-sm leading-7 text-cyan">
              Velora Token is designed to support ecosystem participation, community growth, future platform features, and long-term network development. The focus is on creating utility first and speculation second.
            </p>
          </div>
        </Panel>

        <Panel title="Planned Utility" eyebrow="Utility roadmap">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {utilityCards.map((item) => (
              <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan/20 bg-cyan/10">
                  <item.icon className="h-5 w-5 text-cyan" />
                </div>
                <h3 className="mt-4 font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-400">
            Additional utility details will be shared as development progresses.
          </p>
        </Panel>

        <Panel title="Velora Pioneers" eyebrow="Early ecosystem participation">
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4 text-sm leading-7 text-slate-300">
              <p>Early users help shape the future of Velora.</p>
              <p>
                Platform activity, engagement, badges, streaks, and participation contribute to user reputation within the ecosystem.
              </p>
              <p>Early participation may be considered in future ecosystem initiatives.</p>
            </div>
            <Link href="/pioneers" className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan px-5 py-3 text-sm font-bold text-white transition hover:scale-[1.01]">
              Open Velora Pioneers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Panel>

        <Panel title="Building for the Long Term" eyebrow="Ecosystem vision">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <p className="max-w-4xl text-sm leading-7 text-slate-300">
              Velora is focused on building real products, useful infrastructure, and a strong community before introducing major ecosystem expansions. Sustainable growth comes from utility, participation, and innovation.
            </p>
          </div>
        </Panel>

        <Panel title="Token Status" eyebrow="Transparent development state">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {tokenStatus.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-3 text-lg font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Join Early" eyebrow="The journey is just beginning">
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-3 text-sm leading-7 text-slate-300">
              <p>Become part of the Velora ecosystem today.</p>
              <p>Use the platform. Build your reputation. Earn badges. Participate in the community.</p>
              <p>The journey is just beginning.</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-5">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 text-cyan" />
                <p className="text-sm leading-6 text-slate-400">
                  Supply, distribution, launch timing, and tokenomics remain intentionally undisclosed until finalized.
                </p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
