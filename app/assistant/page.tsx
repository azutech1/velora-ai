"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bot, CheckCircle2, Coins, Route, Send, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { AppShell } from "@/components/azu/app-shell";
import { Panel } from "@/components/azu/ui";
import { cx } from "@/components/azu/utils";

type AssistantAction = "send" | "swap" | "bridge" | "balance" | "rewards" | "unknown";

type ParsedCommand = {
  actionType: AssistantAction;
  amount?: string;
  token?: string;
  destinationAddress?: string;
  sourceChain?: string;
  destinationChain?: string;
  receiveToken?: string;
  status: string;
  confidence: "high" | "medium" | "low";
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  parsed?: ParsedCommand;
};

const examples = [
  "Send 10 USDC to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "Swap 20 USDC to EURC",
  "Bridge 50 USDC from Arc to Base",
  "Show my wallet balance",
  "Show my XP balance"
];

const tokenPattern = /\b(USDC|EURC|USDT|ETH|WETH|WBTC|BTC)\b/i;
const amountTokenPattern = /(\d+(?:\.\d+)?)\s*(USDC|EURC|USDT|ETH|WETH|WBTC|BTC)/i;
const addressPattern = /(0x[a-fA-F0-9]{40})/;
const chainAliases: Record<string, string> = {
  arc: "Arc Testnet",
  "arc testnet": "Arc Testnet",
  base: "Base Sepolia",
  "base sepolia": "Base Sepolia",
  ethereum: "Ethereum Sepolia",
  eth: "Ethereum Sepolia",
  sepolia: "Ethereum Sepolia",
  arbitrum: "Arbitrum Sepolia",
  "arbitrum sepolia": "Arbitrum Sepolia",
  optimism: "Optimism Sepolia",
  "optimism sepolia": "Optimism Sepolia"
};

function normalizeChain(value?: string) {
  if (!value) return undefined;
  const cleaned = value.trim().toLowerCase();
  return chainAliases[cleaned] ?? value.trim();
}

function findChainAfter(command: string, keyword: "from" | "to") {
  const match = command.match(new RegExp(`\\b${keyword}\\s+([a-zA-Z ]+?)(?=\\s+(?:to|from|for|with|$)|$)`, "i"));
  return normalizeChain(match?.[1]);
}

function parseCommand(input: string): ParsedCommand {
  const command = input.trim();
  const lower = command.toLowerCase();
  const amountToken = command.match(amountTokenPattern);
  const token = amountToken?.[2]?.toUpperCase() ?? command.match(tokenPattern)?.[1]?.toUpperCase();
  const amount = amountToken?.[1];
  const destinationAddress = command.match(addressPattern)?.[1];

  if (/\b(send|pay|transfer)\b/i.test(command)) {
    return {
      actionType: "send",
      amount,
      token,
      destinationAddress,
      status: "Ready for confirmation",
      confidence: amount && token && destinationAddress ? "high" : "medium"
    };
  }

  if (/\b(swap|exchange|convert)\b/i.test(command)) {
    const receiveToken = command.match(/\b(?:to|for)\s+(USDC|EURC|USDT|ETH|WETH|WBTC|BTC)\b/i)?.[1]?.toUpperCase();
    return {
      actionType: "swap",
      amount,
      token,
      receiveToken,
      status: "Ready for confirmation",
      confidence: amount && token && receiveToken ? "high" : "medium"
    };
  }

  if (/\b(bridge|move cross-chain|cross chain)\b/i.test(command)) {
    return {
      actionType: "bridge",
      amount,
      token,
      sourceChain: findChainAfter(command, "from"),
      destinationChain: findChainAfter(command, "to"),
      status: "Ready for confirmation",
      confidence: amount && token && findChainAfter(command, "from") && findChainAfter(command, "to") ? "high" : "medium"
    };
  }

  if (/\b(balance|balances|wallet)\b/i.test(command)) {
    return {
      actionType: "balance",
      token,
      status: "Ready for confirmation",
      confidence: "high"
    };
  }

  if (/\b(xp|reward|rewards|level|streak)\b/i.test(command)) {
    return {
      actionType: "rewards",
      status: "Ready for confirmation",
      confidence: "high"
    };
  }

  return {
    actionType: lower ? "unknown" : "unknown",
    status: "Needs more detail",
    confidence: "low"
  };
}

function actionLabel(action: AssistantAction) {
  switch (action) {
    case "send":
      return "Send";
    case "swap":
      return "Swap";
    case "bridge":
      return "Bridge";
    case "balance":
      return "Wallet Balance";
    case "rewards":
      return "Rewards";
    default:
      return "Unknown";
  }
}

function ActionIcon({ action }: { action: AssistantAction }) {
  const Icon = action === "send" ? Send : action === "swap" ? Coins : action === "bridge" ? Route : action === "balance" ? Wallet : action === "rewards" ? Sparkles : Bot;
  return (
    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-[0_14px_35px_rgba(249,115,22,0.28)]">
      <Icon className="h-5 w-5" />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 light:border-black light:bg-white">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-base font-black text-white light:text-slate-950">{value ?? "Not provided"}</p>
    </div>
  );
}

function ConfirmationCard({ parsed }: { parsed: ParsedCommand }) {
  const action = actionLabel(parsed.actionType);
  const isUnknown = parsed.actionType === "unknown";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 light:border-emerald-600/25 light:bg-emerald-50">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ActionIcon action={parsed.actionType} />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300 light:text-emerald-700">Confirmation Preview</p>
            <h3 className="mt-1 text-xl font-black text-white light:text-slate-950">{isUnknown ? "Command needs more detail" : `${action} Preview`}</h3>
          </div>
        </div>
        <span className={cx("rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em]", parsed.confidence === "high" ? "bg-mint/15 text-mint" : parsed.confidence === "medium" ? "bg-orange-500/15 text-orange-200 light:text-orange-700" : "bg-red-500/15 text-red-200 light:text-red-700")}>
          {parsed.confidence} confidence
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <DetailRow label="Action" value={action} />
        <DetailRow label="Amount" value={parsed.amount && parsed.token ? `${parsed.amount} ${parsed.token}` : parsed.token} />
        {parsed.actionType === "send" ? <DetailRow label="Destination Address" value={parsed.destinationAddress} /> : null}
        {parsed.actionType === "swap" ? <DetailRow label="Receive" value={parsed.receiveToken} /> : null}
        {parsed.actionType === "bridge" ? (
          <>
            <DetailRow label="From" value={parsed.sourceChain} />
            <DetailRow label="To" value={parsed.destinationChain} />
          </>
        ) : null}
        <DetailRow label="Status" value={parsed.status} />
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-orange-400/25 bg-orange-500/10 p-4 text-sm font-semibold leading-6 text-orange-100 light:border-orange-500/40 light:bg-orange-50 light:text-orange-800">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <span>Velora AI will never move funds without wallet confirmation. This Phase 1 assistant only parses commands and prepares a preview.</span>
      </div>
    </motion.div>
  );
}

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Tell me what you want to do with your wallet, swaps, bridges, balances, or XP. I will parse it and show a safe confirmation preview."
    }
  ]);

  const latestPreview = useMemo(() => [...messages].reverse().find((message) => message.parsed)?.parsed, [messages]);

  function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const command = input.trim();
    if (!command) return;
    const parsed = parseCommand(command);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: command },
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: parsed.actionType === "unknown" ? "I need a little more detail before preparing a preview." : `I found a ${actionLabel(parsed.actionType).toLowerCase()} request and prepared a confirmation preview.`,
        parsed
      }
    ]);
    setInput("");
  }

  return (
    <AppShell title="AI Assistant" eyebrow="Phase 1 command preview">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.26)] light:border-black light:bg-white light:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-orange-500/20 blur-3xl light:bg-orange-200/80" />
            <div className="absolute bottom-0 left-10 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl light:bg-emerald-100" />
            <div className="relative">
              <span className="inline-flex rounded-full border border-orange-400/35 bg-orange-500/15 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-orange-300 light:border-orange-500/35 light:bg-orange-50 light:text-orange-700">
                Phase 1
              </span>
              <h2 className="mt-5 text-3xl font-black text-white light:text-slate-950">Chat with Velora AI</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 light:text-slate-700">
                Type a natural language command. Velora will identify the action, token, amount, address, and chains, then show a confirmation card before anything can happen.
              </p>
            </div>
          </section>

          <Panel title="Assistant chat" eyebrow="Natural language command parser">
            <div className="space-y-4">
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <div key={message.id} className={cx("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cx("max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6", message.role === "user" ? "bg-gradient-to-r from-orange-500 to-red-500 font-semibold text-white" : "border border-white/10 bg-white/[0.04] text-slate-200 light:border-black light:bg-white light:text-slate-800")}>
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={submitCommand} className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Swap 20 USDC to EURC"
                  className="min-h-12 flex-1 rounded-xl border border-white/10 bg-[#080d18] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400/60 light:border-black light:bg-white light:text-slate-950"
                />
                <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 text-sm font-black text-white shadow-[0_14px_35px_rgba(249,115,22,0.28)] transition hover:scale-[1.01]">
                  Parse Command <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          {latestPreview ? <ConfirmationCard parsed={latestPreview} /> : null}

          <Panel title="Try these commands" eyebrow="Examples">
            <div className="grid gap-3">
              {examples.map((example) => (
                <button
                  key={example}
                  onClick={() => setInput(example)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left text-sm font-semibold text-slate-200 transition hover:border-orange-400/40 hover:bg-orange-500/10 light:border-black light:bg-white light:text-slate-800"
                >
                  <span>{example}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-orange-300 light:text-orange-700" />
                </button>
              ))}
            </div>
          </Panel>

          <div className="rounded-2xl border border-mint/20 bg-mint/10 p-5 light:border-emerald-600/25 light:bg-emerald-50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-mint light:text-emerald-700" />
              <p className="font-black text-white light:text-slate-950">Safe by design</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300 light:text-slate-700">
              This assistant does not execute transactions, request signatures, open wallets, or move funds. It only parses intent and displays a preview.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
