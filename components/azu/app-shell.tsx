"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Sun, Wallet, X } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { NetworkBadge } from "@/components/web3/NetworkBadge";
import { DisconnectHint, WalletConnectButton } from "@/components/web3/WalletConnectButton";
import { useAdminMode } from "@/hooks/useAdminMode";
import { Logo, LogoMark } from "./brand";
import { navItems } from "./data";
import { SiteFooter } from "./footer";
import { cx } from "./utils";

export function AmbientBackground() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 grid-fade opacity-70" />
      <div className="pointer-events-none fixed inset-0">
        {Array.from({ length: 22 }).map((_, index) => (
          <span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-cyan/45"
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

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("velora-theme") === "light" ? "light" : "dark";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("light", storedTheme === "light");
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("velora-theme", nextTheme);
    document.documentElement.classList.toggle("light", nextTheme === "light");
  }

  return (
    <button type="button" onClick={toggleTheme} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-slate-300 transition hover:border-cyan/35 hover:bg-cyan/10 hover:text-white" aria-label="Toggle theme">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { isAdmin } = useAdminMode();
  const visibleNavItems = navItems.filter((item) => !["/activity", "/admin"].includes(item.href) || isAdmin);
  const primaryNavItems = visibleNavItems.filter((item) => !item.secondary);
  const secondaryNavItems = visibleNavItems.filter((item) => item.secondary);

  return (
    <aside className="hidden w-72 shrink-0 border-r border-line bg-[#05070D]/88 px-5 py-6 backdrop-blur-2xl lg:block">
      <Logo />
      <nav className="mt-9 space-y-1.5">
        {primaryNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition",
                active ? "border border-cyan/35 bg-cyan/10 text-white shadow-neon" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {secondaryNavItems.length ? (
          <div className="mt-5 border-t border-white/10 pt-4">
            {secondaryNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.18em] transition",
                    active ? "border border-cyan/30 bg-cyan/10 text-white" : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </nav>
      <div className="glass mt-10 rounded-lg p-4">
        <p className="text-sm font-semibold text-cyan">Arc Policy Guard</p>
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
  const { isAdmin, adminLabel } = useAdminMode();
  const visibleNavItems = navItems.filter((item) => !["/activity", "/admin"].includes(item.href) || isAdmin);
  const primaryNavItems = visibleNavItems.filter((item) => !item.secondary);
  const secondaryNavItems = visibleNavItems.filter((item) => item.secondary);

  return (
    <main className="min-h-screen overflow-hidden">
      <AmbientBackground />
      <section className="relative mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="glass flex min-h-[calc(100vh-2.5rem)] overflow-hidden rounded-xl">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6 lg:px-7">
              <div className="flex items-center gap-4">
                <button className="rounded-lg border border-white/10 p-2 text-white lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </button>
                <LogoMark size={42} className="hidden sm:grid" />
                <div>
                  <p className="text-sm text-slate-400">{eyebrow ?? "AI-native stablecoin operating system on Arc"}</p>
                  <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <NetworkBadge />
                <ThemeToggle />
                {adminLabel ? <span className="rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs font-bold text-cyan">{adminLabel}</span> : null}
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
            <SiteFooter />
          </div>
        </div>
      </section>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} className="flex h-full w-80 max-w-[88vw] flex-col border-r border-line bg-[#05070D] p-5">
              <div className="flex items-center justify-between">
                <Logo />
                <button className="rounded-lg border border-white/10 p-2 text-slate-300" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-8 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
                {primaryNavItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cx(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition",
                        active ? "border border-cyan/35 bg-cyan/10 text-white" : "text-slate-200 hover:bg-white/[0.06]"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
                {secondaryNavItems.length ? (
                  <div className="mt-5 border-t border-white/10 pt-4">
                    {secondaryNavItems.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cx(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition",
                            active ? "border border-cyan/30 bg-cyan/10 text-white" : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
