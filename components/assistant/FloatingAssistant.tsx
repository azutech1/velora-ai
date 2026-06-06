"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bot, CheckCircle2, Coins, Mic, MessageCircle, Route, Send, ShieldCheck, Sparkles, Wallet, X } from "lucide-react";
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
  "Bridge 50 USDC to Base",
  "Show my wallet balance",
  "Show my XP",
  "Show my recent transactions"
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
      status: "Waiting for confirmation",
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
      status: "Waiting for confirmation",
      confidence: amount && token && receiveToken ? "high" : "medium"
    };
  }

  if (/\b(bridge|move cross-chain|cross chain)\b/i.test(command)) {
    return {
      actionType: "bridge",
      amount,
      token,
      sourceChain: findChainAfter(command, "from") ?? "Current network",
      destinationChain: findChainAfter(command, "to"),
      status: "Waiting for confirmation",
      confidence: amount && token && findChainAfter(command, "to") ? "high" : "medium"
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
    actionType: "unknown",
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
    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-[0_14px_35px_rgba(249,115,22,0.28)]">
      <Icon className="h-5 w-5" />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 light:border-black light:bg-white">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1.5 break-words text-sm font-black text-white light:text-slate-950">{value ?? "Not provided"}</p>
    </div>
  );
}

function ConfirmationPreview({ parsed }: { parsed: ParsedCommand }) {
  const action = actionLabel(parsed.actionType);
  const isUnknown = parsed.actionType === "unknown";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 light:border-emerald-600/25 light:bg-emerald-50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ActionIcon action={parsed.actionType} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300 light:text-emerald-700">I understood your request</p>
            <h3 className="mt-1 text-base font-black text-white light:text-slate-950">{isUnknown ? "More details needed" : `${action} Preview`}</h3>
          </div>
        </div>
        <span className={cx("rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]", parsed.confidence === "high" ? "bg-mint/15 text-mint" : parsed.confidence === "medium" ? "bg-orange-500/15 text-orange-200 light:text-orange-700" : "bg-red-500/15 text-red-200 light:text-red-700")}>
          {parsed.confidence}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <DetailRow label="Action" value={action} />
        <DetailRow label="Amount" value={parsed.amount && parsed.token ? `${parsed.amount} ${parsed.token}` : parsed.token} />
        {parsed.actionType === "send" ? <DetailRow label="Destination" value={parsed.destinationAddress} /> : null}
        {parsed.actionType === "swap" ? <DetailRow label="Receive" value={parsed.receiveToken} /> : null}
        {parsed.actionType === "bridge" ? (
          <>
            <DetailRow label="From" value={parsed.sourceChain} />
            <DetailRow label="To" value={parsed.destinationChain} />
          </>
        ) : null}
        <DetailRow label="Status" value={parsed.status} />
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-orange-400/25 bg-orange-500/10 p-3 text-xs font-semibold leading-5 text-orange-100 light:border-orange-500/40 light:bg-orange-50 light:text-orange-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Velora AI will never move funds without wallet confirmation. This phase only parses commands and prepares a preview.</span>
      </div>
    </motion.div>
  );
}

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "I am online. Type a wallet, swap, bridge, balance, or XP command and I will prepare a safe preview."
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
        content: parsed.actionType === "unknown" ? "I need a little more detail before preparing a preview." : "I understood your request.",
        parsed
      }
    ]);
    setInput("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-3 rounded-2xl border border-orange-400/30 bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-black text-white shadow-[0_18px_55px_rgba(249,115,22,0.35)] transition hover:scale-[1.02] light:border-orange-500/40"
        aria-label="Open Velora AI assistant"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Velora AI</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.aside
              initial={{ opacity: 0, x: 420, y: 24 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 420, y: 24 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="absolute bottom-4 right-4 top-4 flex w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#070b13]/95 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl light:border-black light:bg-white"
            >
              <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 light:border-black">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white light:text-slate-950">Velora AI</h2>
                    <p className="flex items-center gap-2 text-xs font-semibold text-mint">
                      <span className="h-2 w-2 rounded-full bg-mint" />
                      Online
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:border-orange-400/40 hover:text-white light:border-black light:text-slate-700" aria-label="Close Velora AI assistant">
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {messages.map((message) => (
                  <div key={message.id} className={cx("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cx("max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6", message.role === "user" ? "bg-gradient-to-r from-orange-500 to-red-500 font-semibold text-white" : "border border-white/10 bg-white/[0.04] text-slate-200 light:border-black light:bg-white light:text-slate-800")}>
                      {message.content}
                    </div>
                  </div>
                ))}

                {latestPreview ? <ConfirmationPreview parsed={latestPreview} /> : null}

                <div className="grid gap-2">
                  {examples.slice(0, 4).map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setInput(example)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left text-xs font-semibold text-slate-300 transition hover:border-orange-400/40 hover:bg-orange-500/10 light:border-black light:bg-white light:text-slate-800"
                    >
                      <span>{example}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-orange-300 light:text-orange-700" />
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={submitCommand} className="border-t border-white/10 p-4 light:border-black">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 light:border-black light:bg-white">
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Type a message..."
                    className="min-h-11 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-500 light:text-slate-950"
                  />
                  <button type="button" className="hidden items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 sm:inline-flex light:border-black light:text-slate-700">
                    <Mic className="h-4 w-4" /> Voice
                  </button>
                  <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_12px_30px_rgba(249,115,22,0.28)]" aria-label="Send assistant message">
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-400 light:text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-mint" />
                  No signing, no wallet popups, no fund movement in this phase.
                </div>
              </form>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
