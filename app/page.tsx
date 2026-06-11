"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, ChevronRight, Sparkles } from "lucide-react";
import { AmbientBackground } from "@/components/azu/app-shell";
import { HeroOrbit, Logo } from "@/components/azu/brand";
import { featureCards } from "@/components/azu/data";
import { SiteFooter } from "@/components/azu/footer";
import { WalletConnectButton } from "@/components/web3/WalletConnectButton";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <AmbientBackground />
      <section className="relative px-5 pb-16 pt-6 sm:px-8 lg:px-10">
        <header className="mx-auto flex max-w-7xl items-center justify-between">
          <Logo />
          <div className="hidden items-center gap-3 md:flex">
            <WalletConnectButton compact />
            <Link href="/dashboard" className="rounded-lg bg-cyan px-4 py-2 text-sm font-bold text-white shadow-neon transition hover:scale-[1.02]">
              Launch App
            </Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/10 px-4 py-2 text-sm text-cyan shadow-neon">
              <Sparkles className="h-4 w-4" /> Velora AI Public Beta
            </div>
            <h1 className="neon-text mt-7 max-w-4xl text-5xl font-black leading-[1.02] sm:text-6xl lg:text-7xl">Velora AI</h1>
            <p className="mt-5 max-w-2xl text-2xl font-semibold text-white sm:text-3xl">Experience AI-powered stablecoin actions on Arc.</p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Talk to your wallet, use natural language, and manage stablecoin actions with Velora AI during public beta.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-cyan px-5 py-3 font-bold text-white shadow-neon transition hover:scale-[1.02]">
                Launch App <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard?assistant=open" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 font-bold text-white shadow-[0_16px_42px_rgba(249,115,22,0.26)] transition hover:scale-[1.02]">
                Try AI Assistant <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-5 py-3 font-bold text-white transition hover:border-cyan/40">
                Explore AI Features <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
          <HeroOrbit />
        </div>

        <section className="mx-auto mb-10 max-w-7xl overflow-hidden rounded-2xl border border-orange/25 bg-gradient-to-br from-orange/15 via-white/[0.04] to-red-500/10 p-6 shadow-[0_24px_80px_rgba(249,115,22,0.14)]">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-200">Powered by Velora AI</p>
                <h2 className="mt-2 text-3xl font-black text-white">✨ Powered by Velora AI Assistant</h2>
                <p className="mt-3 text-base font-semibold text-slate-200">Talk to your wallet.</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Use natural language to:</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {["Send funds", "Swap stablecoins", "Bridge assets", "Check rewards", "Explore Arc ecosystem tools"].map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-white">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-cyan px-5 py-3 font-bold text-white shadow-neon transition hover:scale-[1.02]">
                  Launch App <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard?assistant=open" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 font-bold text-white shadow-[0_16px_42px_rgba(249,115,22,0.26)] transition hover:scale-[1.02]">
                  Try AI Assistant <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div id="features" className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature) => (
            <motion.div key={feature.title} whileHover={{ y: -5 }} className="glass rounded-lg p-5">
              <feature.icon className="h-6 w-6 text-cyan" />
              <h2 className="mt-4 text-lg font-bold text-white">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
