"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
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
              <Sparkles className="h-4 w-4" /> AI-native stablecoin operating system on Arc
            </div>
            <h1 className="neon-text mt-7 max-w-4xl text-5xl font-black leading-[1.02] sm:text-6xl lg:text-7xl">Velora AI</h1>
            <p className="mt-5 max-w-2xl text-2xl font-semibold text-white sm:text-3xl">AI-native stablecoin operating system on Arc.</p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Velora AI empowers users and AI agents to automate, manage, and scale intelligent stablecoin finance across Arc and connected ecosystems.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-cyan px-5 py-3 font-bold text-white shadow-neon transition hover:scale-[1.02]">
                Launch App <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-5 py-3 font-bold text-white transition hover:border-cyan/40">
                Explore AI Features <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
          <HeroOrbit />
        </div>

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
