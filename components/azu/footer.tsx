"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BookOpen, Bug, FileText, Globe2, MessageCircle, Radio, Send, Shield, Twitter } from "lucide-react";
import { Logo } from "./brand";

const productLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Payments", href: "/send" },
  { label: "Bridge & Swap", href: "/trade" },
  { label: "Activity", href: "/activity" },
  { label: "AI Automation", href: "/automation" },
  { label: "AI Agents", href: "/agents" },
  { label: "Agent Payments", href: "/agent-payments" },
  { label: "Profile", href: "/profile" }
];

const developerLinks = [
  { label: "Documentation", href: "/docs" },
  { label: "API Reference", href: "/docs#api-reference" },
  { label: "Integration Guide", href: "/docs#integration-guide" },
  { label: "Status Page", href: "/docs#status" },
  { label: "Report Bug", href: "/docs#support" }
];

const communityLinks = [
  { label: "X / Twitter", href: "https://x.com/UseVeloraAI" },
  { label: "Discord", href: "/docs#community" },
  { label: "Telegram", href: "/docs#community" },
  { label: "Blog", href: "/docs#announcements" },
  { label: "Announcements", href: "/docs#announcements" },
  { label: "Support", href: "/docs#support" }
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" }
];

const socialLinks = [
  { label: "X / Twitter", href: "https://x.com/UseVeloraAI", icon: Twitter },
  { label: "Website", href: "https://www.veloraai.xyz", icon: Globe2 },
  { label: "Discord", href: "/docs#community", icon: MessageCircle },
  { label: "Telegram", href: "/docs#community", icon: Send }
];

function SmartLink({ href, className, children, label }: { href: string; className?: string; children: ReactNode; label?: string }) {
  const external = href.startsWith("http");
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className} aria-label={label}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={label}>
      {children}
    </Link>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white">{title}</h2>
      <nav className="mt-4 grid gap-3">
        {links.map((link) => (
          <SmartLink key={`${title}-${link.label}`} href={link.href} className="text-sm text-slate-400 transition duration-200 hover:translate-x-1 hover:text-mint">
            {link.label}
          </SmartLink>
        ))}
      </nav>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-[#050b16]/82 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/50 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr_0.85fr_0.8fr]">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }}>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">AI-native stablecoin operating system on Arc.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {socialLinks.map((link) => (
                <SmartLink
                  key={link.label}
                  href={link.href}
                  label={link.label}
                  className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition duration-200 hover:-translate-y-0.5 hover:border-mint/40 hover:bg-mint/10 hover:text-mint hover:shadow-neon"
                >
                  <link.icon className="h-4 w-4" />
                </SmartLink>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/10 px-3 py-1.5 text-xs font-semibold text-mint">
                <Shield className="h-3.5 w-3.5" /> Testnet Alpha
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1.5 text-xs font-semibold text-cyan">
                <Radio className="h-3.5 w-3.5" /> Arc Testnet
              </span>
            </div>
          </motion.div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Developers" links={developerLinks} />
          <FooterColumn title="Community" links={communityLinks} />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 Velora AI. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="inline-flex items-center gap-1.5 transition hover:text-cyan">
                {link.label === "Privacy Policy" ? <Shield className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                {link.label}
              </Link>
            ))}
            <Link href="/docs#support" className="inline-flex items-center gap-1.5 transition hover:text-cyan">
              <Bug className="h-3.5 w-3.5" />
              Report Bug
            </Link>
            <Link href="/docs" className="inline-flex items-center gap-1.5 transition hover:text-cyan">
              <BookOpen className="h-3.5 w-3.5" />
              Docs
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
