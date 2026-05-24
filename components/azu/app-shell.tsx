"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Menu, Wallet, X } from "lucide-react";
import { ReactNode, useState } from "react";
import { useAccount } from "wagmi";
import { NetworkBadge } from "@/components/web3/NetworkBadge";
import { DisconnectHint, WalletConnectButton } from "@/components/web3/WalletConnectButton";
import { Logo } from "./brand";
import { navItems } from "./data";
import { cx } from "./utils";

export function AmbientBackground() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 grid-fade opacity-70" />
      <div className="pointer-events-none fixed inset-0">
        {Array.from({ length: 22 }).map((_, index) => (
          <span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-cyan/70"
            style={{
              left: `${(index * 41) % 100}%`,
              top: `${(index * 29) % 100}%`,
              animation: `pulseGlow ${2.4 + (index % 5)}s ease-in-out infinite`
            }}
          />
        ))}
      </div>
    </>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#06101d]/78 px-5 py-6 backdrop-blur-2xl lg:block">
      <Logo />
      <nav className="mt-10 space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition",
                active ? "border border-mint/30 bg-mint/10 text-white shadow-neon" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="glass mt-10 rounded-lg p-4">
        <p className="text-sm font-semibold text-mint">Arc Policy Guard</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">Spend limits, transaction approvals, and agent permissions are staged for wallet integration.</p>
      </div>
      <div className="glass mt-4 rounded-lg p-4">
        <div className="flex items-center gap-2 text-cyan">
          <Wallet className="h-4 w-4" />
          <span className="text-sm font-semibold">Wallet Status</span>
        </div>
        <p className="mt-3 break-all text-sm leading-6 text-slate-400">
          {isConnecting || isReconnecting ? "Connecting wallet..." : isConnected && address ? address : "No wallet connected"}
        </p>
        {isConnected ? <div className="mt-3"><DisconnectHint /></div> : null}
      </div>
    </aside>
  );
}

export function AppShell({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <main className="min-h-screen overflow-hidden">
      <AmbientBackground />
      <section className="relative mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="glass flex min-h-[calc(100vh-2.5rem)] overflow-hidden rounded-lg">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6 lg:px-7">
              <div className="flex items-center gap-4">
                <button className="rounded-lg border border-white/10 p-2 text-white lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-sm text-slate-400">{eyebrow ?? "AI-native stablecoin operating system on Arc"}</p>
                  <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <NetworkBadge />
                <button className="rounded-lg border border-white/10 p-3 text-slate-300 hover:text-white" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </button>
                <WalletConnectButton />
              </div>
            </header>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="p-4 sm:p-6 lg:p-7"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} className="h-full w-80 max-w-[88vw] border-r border-white/10 bg-[#06101d] p-5">
              <div className="flex items-center justify-between">
                <Logo />
                <button className="rounded-lg border border-white/10 p-2 text-slate-300" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-8 space-y-2">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-200 hover:bg-white/[0.06]">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
