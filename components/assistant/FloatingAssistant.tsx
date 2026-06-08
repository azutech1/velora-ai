"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { ArrowRight, BookOpen, Bot, CheckCircle2, Coins, Copy, Droplets, Edit3, Mic, MessageCircle, Pencil, Route, Send, ShieldCheck, Sparkles, Trash2, UserPlus, Wallet, X } from "lucide-react";
import { cx } from "@/components/azu/utils";
import { useAssistantActions, type AssistantActionResult } from "./useAssistantActions";
import type { AssistantAction, AssistantIntent, ParsedCommand } from "./types";
import { useAssistantContacts, type AssistantContact } from "./useAssistantContacts";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  parsed?: ParsedCommand;
  result?: AssistantActionResult;
};

type ContactCommand =
  | { type: "save"; name: string; address: string }
  | { type: "delete"; name: string }
  | { type: "update"; name: string; address: string }
  | { type: "show" };

type PendingContactSave = {
  name: string;
  address: string;
  overwrite: boolean;
};

const examples = [
  "Send 10 USDC to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "Swap 20 USDC to EURC",
  "Swap EURC to USDC",
  "Bridge 50 USDC to Base",
  "Claim Arc faucet",
  "Show my wallet balance",
  "Show my XP",
  "What is Circle CCTP?"
];

const thinkingSteps = ["Analyzing request...", "Detecting action...", "Reading token and amount...", "Preparing preview..."];

const tokenPattern = /\b(USDC|EURC|USDT|ETH|WETH|WBTC|BTC)\b/i;
const amountTokenPattern = /(\d+(?:\.\d+)?)\s*(USDC|EURC|USDT|ETH|WETH|WBTC|BTC)/i;
const addressPattern = /(0x[a-fA-F0-9]{40})/;
const contactNamePattern = /[a-zA-Z][a-zA-Z0-9 _.-]{0,40}/;
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

function classifyIntent(command: string): { intentType: AssistantIntent; confidence: "high" | "medium" | "low" } {
  const text = command.trim();
  if (!text) return { intentType: "unknown", confidence: "low" };
  if (/\b(show|check|view|display)\b.*\b(balance|balances|wallet|portfolio|assets)\b/i.test(text) || /\b(how much)\b.*\b(USDC|EURC|USDT|ETH|WETH|WBTC|BTC)\b/i.test(text) || /\b(what assets do i own|wallet summary|show my portfolio|show my balances)\b/i.test(text) || /^\s*(balance|balances|portfolio)\s*$/i.test(text)) {
    return { intentType: "balance", confidence: "high" };
  }
  if (/\b(show|check|view|display|how much)\b.*\b(xp|reward|rewards|level|streak|achievement|achievements|milestone)\b/i.test(text)) {
    return { intentType: "rewards", confidence: "high" };
  }
  if (/\b(show|check|view|display|open)\b.*\b(profile|badges)\b/i.test(text)) {
    return { intentType: "profile", confidence: "high" };
  }
  if (/\b(show|check|view|display)\b.*\b(transaction|transactions|history|activity)\b/i.test(text) || /\b(swap history|bridge history|send history|last 5 transactions|recent transactions)\b/i.test(text)) {
    return { intentType: "transaction-history", confidence: "high" };
  }
  if (/\b(notify me|remind me|alert me|create alert|set alert)\b/i.test(text)) {
    return { intentType: "automation", confidence: "high" };
  }
  if (/^(what|why|explain|tell me|describe)\b/i.test(text) || /\b(what is|stablecoin|arc ecosystem|circle gateway|cctp|appkit|bridgekit|agent wallet|velora ai|private key|seed phrase|airdrop|token launch)\b/i.test(text)) {
    return { intentType: "knowledge", confidence: "high" };
  }
  if (/^how\b/i.test(text) || /\b(connect wallet|switch to arc|arc testnet|use rewards center|claim daily xp|daily check.?in|complete social tasks|view profile|transaction history|gas fees|testnet eth|how to)\b/i.test(text)) {
    return { intentType: "help", confidence: "high" };
  }
  if (/\b(send|pay|transfer)\b/i.test(text)) return { intentType: "send", confidence: "high" };
  if (/\b(swap|exchange|convert)\b/i.test(text)) return { intentType: "swap", confidence: "high" };
  if (/\b(bridge|move cross-chain|cross chain)\b/i.test(text)) return { intentType: "bridge", confidence: "high" };
  if (/\b(faucet|testnet funds|test funds)\b/i.test(text)) return { intentType: "faucet", confidence: "high" };
  if (/\b(wallet|token|network|arc|circle|velora|usdc|eurc|bridge|swap|reward)\b/i.test(text)) return { intentType: "unknown", confidence: "medium" };
  return { intentType: "unknown", confidence: "low" };
}

function parseCommand(input: string): ParsedCommand {
  const command = input.trim();
  const intent = classifyIntent(command);
  const amountToken = command.match(amountTokenPattern);
  const token = amountToken?.[2]?.toUpperCase() ?? command.match(tokenPattern)?.[1]?.toUpperCase();
  const amount = amountToken?.[1];
  const destinationAddress = command.match(addressPattern)?.[1];

  if (intent.intentType === "knowledge" || intent.intentType === "help") {
    return {
      intentType: intent.intentType,
      actionType: "knowledge",
      question: command,
      status: "Ready for answer",
      confidence: intent.confidence
    };
  }

  if (intent.intentType === "faucet") {
    return {
      intentType: "faucet",
      actionType: "faucet",
      token,
      destinationAddress,
      status: "Ready for faucet workflow",
      confidence: "high"
    };
  }

  if (intent.intentType === "send") {
    const destinationName = command.match(/\bto\s+([^,.;]+)$/i)?.[1]?.trim();
    return {
      intentType: "send",
      actionType: "send",
      amount,
      token,
      destinationAddress,
      contactName: destinationAddress ? undefined : destinationName,
      status: "Waiting for confirmation",
      confidence: amount && token && destinationAddress ? "high" : "medium"
    };
  }

  if (intent.intentType === "swap") {
    const receiveToken = command.match(/\b(?:to|for)\s+(USDC|EURC|USDT|ETH|WETH|WBTC|BTC)\b/i)?.[1]?.toUpperCase();
    return {
      intentType: "swap",
      actionType: "swap",
      amount,
      token,
      receiveToken,
      status: "Waiting for confirmation",
      confidence: amount && token && receiveToken ? "high" : "medium"
    };
  }

  if (intent.intentType === "bridge") {
    return {
      intentType: "bridge",
      actionType: "bridge",
      amount,
      token,
      sourceChain: findChainAfter(command, "from") ?? "Current network",
      destinationChain: findChainAfter(command, "to"),
      status: "Waiting for confirmation",
      confidence: amount && token && findChainAfter(command, "to") ? "high" : "medium"
    };
  }

  if (intent.intentType === "balance") {
    return {
      intentType: "balance",
      actionType: "balance",
      token,
      status: "Ready for confirmation",
      confidence: "high"
    };
  }

  if (intent.intentType === "rewards") {
    if (/\b(claim|daily|check.?in)\b/i.test(command)) {
      return {
        intentType: "rewards",
        actionType: "dailyReward",
        status: "Ready for confirmation",
        confidence: "high"
      };
    }

    return {
      intentType: "rewards",
      actionType: "rewards",
      status: "Ready for confirmation",
      confidence: "high"
    };
  }

  if (intent.intentType === "profile") {
    return {
      intentType: "profile",
      actionType: "profile",
      status: "Ready to show profile",
      confidence: "high"
    };
  }

  if (intent.intentType === "transaction-history") {
    return {
      intentType: "transaction-history",
      actionType: "transactionHistory",
      question: command,
      status: "Ready to show transaction history",
      confidence: "high"
    };
  }

  if (intent.intentType === "automation") {
    return {
      intentType: "automation",
      actionType: "automation",
      question: command,
      status: "Ready to create alert",
      confidence: "high"
    };
  }

  return {
    intentType: intent.intentType,
    actionType: "unknown",
    status: "Needs more detail",
    confidence: intent.confidence
  };
}

function parseContactCommand(input: string): ContactCommand | null {
  const command = input.trim();
  const saveThis = command.match(new RegExp(`^save\\s+this\\s+address\\s+as\\s+(${contactNamePattern.source})\\s*:?\\s*${addressPattern.source}$`, "i"));
  if (saveThis) return { type: "save", name: saveThis[1], address: saveThis[2] };
  const addAs = command.match(new RegExp(`^add\\s+${addressPattern.source}\\s+as\\s+(${contactNamePattern.source})$`, "i"));
  if (addAs) return { type: "save", name: addAs[2], address: addAs[1] };
  const saveContact = command.match(new RegExp(`^save\\s+contact\\s+(${contactNamePattern.source})\\s+${addressPattern.source}$`, "i"));
  if (saveContact) return { type: "save", name: saveContact[1], address: saveContact[2] };
  const update = command.match(new RegExp(`^update\\s+(${contactNamePattern.source})\\s+address\\s+to\\s+${addressPattern.source}$`, "i"));
  if (update) return { type: "update", name: update[1], address: update[2] };
  const del = command.match(new RegExp(`^delete\\s+(${contactNamePattern.source})\\s+from\\s+contacts$`, "i"));
  if (del) return { type: "delete", name: del[1] };
  if (/^(show|view|list)\s+my\s+saved\s+contacts$/i.test(command) || /^saved\s+contacts$/i.test(command)) return { type: "show" };
  return null;
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
    case "dailyReward":
      return "Daily Reward";
    case "faucet":
      return "Faucet";
    case "knowledge":
      return "Knowledge";
    case "profile":
      return "Profile";
    case "transactionHistory":
      return "Transaction History";
    case "automation":
      return "Automation Alert";
    default:
      return "Unknown";
  }
}

function ActionIcon({ action }: { action: AssistantAction }) {
  const Icon = action === "send" ? Send : action === "swap" ? Coins : action === "bridge" ? Route : action === "balance" || action === "profile" ? Wallet : action === "faucet" ? Droplets : action === "knowledge" || action === "transactionHistory" ? BookOpen : action === "automation" || action === "rewards" || action === "dailyReward" ? Sparkles : Bot;
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

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function commandSummary(parsed: ParsedCommand) {
  const amountText = parsed.amount && parsed.token ? `${parsed.amount} ${parsed.token}` : parsed.token;

  switch (parsed.actionType) {
    case "send":
      return `send ${amountText ?? "funds"} to ${parsed.contactName ?? parsed.destinationAddress ?? "a wallet address"}`;
    case "swap":
      return `swap ${amountText ?? "tokens"} to ${parsed.receiveToken ?? "another token"}`;
    case "bridge":
      return `bridge ${amountText ?? "tokens"} from ${parsed.sourceChain ?? "your current network"} to ${parsed.destinationChain ?? "another network"}`;
    case "balance":
      return parsed.token ? `show your ${parsed.token} balance` : "show your wallet balance";
    case "rewards":
      return "show your XP balance";
    case "dailyReward":
      return "preview a daily reward claim";
    case "faucet":
      return `open the official faucet workflow${parsed.token ? ` for ${parsed.token}` : ""}`;
    case "knowledge":
      return `answer "${parsed.question ?? "your question"}"`;
    case "profile":
      return "show your profile summary";
    case "transactionHistory":
      return "show your recent transaction history";
    case "automation":
      return `create an alert for "${parsed.question ?? "this request"}"`;
    default:
      return "complete this request";
  }
}

function naturalResponse(parsed: ParsedCommand) {
  return `I understood that you want to ${commandSummary(parsed)}. I prepared a safe preview below. No funds will move until you confirm with your wallet.`;
}

function shouldAnswerDirectly(parsed: ParsedCommand) {
  return ["knowledge", "help", "balance", "rewards", "profile", "transaction-history", "automation"].includes(parsed.intentType ?? "");
}

function ConfirmationPreview({
  parsed,
  onEdit,
  onCancel,
  onLooksCorrect,
  isRunning
}: {
  parsed: ParsedCommand;
  onEdit: () => void;
  onCancel: () => void;
  onLooksCorrect: () => void;
  isRunning: boolean;
}) {
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
        {parsed.actionType === "send" && parsed.contactName ? <DetailRow label="Saved Contact" value={parsed.contactName} /> : null}
        {parsed.actionType === "send" ? <DetailRow label="Destination Address" value={parsed.destinationAddress} /> : null}
        {parsed.actionType === "swap" ? <DetailRow label="Receive" value={parsed.receiveToken} /> : null}
        {parsed.actionType === "faucet" ? <DetailRow label="Wallet" value={parsed.destinationAddress ?? "Connected wallet"} /> : null}
        {parsed.actionType === "knowledge" ? <DetailRow label="Question" value={parsed.question} /> : null}
        {parsed.actionType === "bridge" ? (
          <>
            <DetailRow label="From" value={parsed.sourceChain} />
            <DetailRow label="To" value={parsed.destinationChain} />
          </>
        ) : null}
        <DetailRow label="Status" value={parsed.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-200 transition hover:border-orange-400/40 hover:text-orange-200 light:border-black light:text-slate-800 light:hover:text-orange-700">
          <Edit3 className="h-3.5 w-3.5" /> Edit
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-red-400/25 px-3 py-2 text-xs font-black text-red-200 transition hover:bg-red-500/10 light:text-red-700">
          Cancel
        </button>
        <button type="button" onClick={onLooksCorrect} disabled={isRunning} className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-3 py-2 text-xs font-black text-white shadow-[0_12px_30px_rgba(249,115,22,0.22)] disabled:cursor-not-allowed disabled:opacity-70">
          {isRunning ? "Working..." : "Looks Correct"}
        </button>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-orange-400/25 bg-orange-500/10 p-3 text-xs font-semibold leading-5 text-orange-100 light:border-orange-500/40 light:bg-orange-50 light:text-orange-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Velora AI never moves funds automatically. Every transaction will require wallet confirmation.</span>
      </div>
    </motion.div>
  );
}

function ResultCard({ result }: { result: AssistantActionResult }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function copyHash(key: string, value?: string | null) {
    if (!value || typeof navigator === "undefined") return;
    await navigator.clipboard?.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1400);
  }

  const hashBlocks = [
    result.approvalTxHash ? { key: "approval", label: "Approval transaction hash", value: result.approvalTxHash, link: undefined, actionLabel: "Copy Approval Hash" } : null,
    result.txHash ? { key: "source", label: "Source transaction hash", value: result.txHash, link: result.explorerLink, actionLabel: "Copy Hash" } : null,
    result.destinationTxHash
      ? {
          key: "destination",
          label: "Destination transaction hash",
          value: result.destinationTxHash,
          link: result.destinationExplorerLink ?? undefined,
          actionLabel: "Copy Destination Hash"
        }
      : null
  ].filter(Boolean) as Array<{ key: string; label: string; value: string; link?: string; actionLabel: string }>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-2xl border border-orange-400/25 bg-orange-500/10 p-4 light:border-orange-500/35 light:bg-orange-50">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-white light:text-slate-950">{result.title}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-300 light:text-slate-700">{result.message}</p>
        </div>
      </div>
      {result.details?.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {result.details.map((detail) => (
            <DetailRow key={detail.label} label={detail.label} value={detail.value} />
          ))}
        </div>
      ) : null}
      {hashBlocks.length
        ? hashBlocks.map((hashBlock) => (
            <div key={hashBlock.key} className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 light:border-black light:bg-white">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{hashBlock.label}</p>
              <p className="mt-1 break-all text-xs font-bold text-slate-300 light:text-slate-700">{hashBlock.value}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {hashBlock.link ? (
                  <a href={hashBlock.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-3 py-2 text-xs font-black text-white">
                    {hashBlock.key === "destination" ? "View Destination" : "View Transaction"} <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                <button type="button" onClick={() => copyHash(hashBlock.key, hashBlock.value)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-200 transition hover:border-orange-400/40 hover:text-orange-200 light:border-black light:text-slate-800">
                  <Copy className="h-3.5 w-3.5" /> {copiedKey === hashBlock.key ? "Copied" : hashBlock.actionLabel}
                </button>
              </div>
            </div>
          ))
        : null}
    </motion.div>
  );
}

function AssistantProgressCard({ label, message }: { label: string; message: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 light:border-black light:bg-white">
      <div className="flex items-center gap-3">
        <span className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:120ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:240ms]" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300 light:text-orange-700">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-200 light:text-slate-800">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function FloatingAssistant() {
  const { address } = useAccount();
  const assistantActions = useAssistantActions();
  const assistantContacts = useAssistantContacts(address);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [voiceNoticeOpen, setVoiceNoticeOpen] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(thinkingSteps[0]);
  const [activePreview, setActivePreview] = useState<ParsedCommand | null>(null);
  const [pendingContactSave, setPendingContactSave] = useState<PendingContactSave | null>(null);
  const [contactChoices, setContactChoices] = useState<{ parsed: ParsedCommand; contacts: AssistantContact[] } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi, I'm Velora AI 👋\n\nI can help you:\n\n• Send USDC\n• Swap USDC ↔ EURC\n• Bridge across networks\n• Claim faucet\n• Check balances\n• View rewards\n• Answer questions about Velora, Arc, and Circle\n\nTry:\n\n\"Swap 20 USDC to EURC\"\n\"Bridge 10 USDC to Base\"\n\"What is Velora AI?\""
    }
  ]);

  const visibleExamples = useMemo(() => examples.slice(0, 4), []);
  const visibleContacts = useMemo(() => assistantContacts.contacts.slice(0, 4), [assistantContacts.contacts]);

  useEffect(() => {
    function openAssistant() {
      setOpen(true);
    }

    window.addEventListener("velora:open-assistant", openAssistant);

    const params = new URLSearchParams(window.location.search);
    if (params.get("assistant") === "open") {
      setOpen(true);
      params.delete("assistant");
      const nextQuery = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`);
    }

    return () => window.removeEventListener("velora:open-assistant", openAssistant);
  }, []);

  async function runThinkingAnimation() {
    setIsThinking(true);
    for (const step of thinkingSteps) {
      setThinkingStep(step);
      await new Promise((resolve) => window.setTimeout(resolve, 330));
    }
    setIsThinking(false);
  }

  async function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const command = input.trim();
    if (!command || isThinking) return;
    setActivePreview(null);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: command }
    ]);
    setInput("");
    await runThinkingAnimation();

    const contactCommand = parseContactCommand(command);
    if (contactCommand) {
      handleContactCommand(contactCommand);
      return;
    }

    const parsed = parseCommand(command);
    if (parsed.actionType === "unknown") {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "I'm not sure whether you're asking for information or trying to perform an action. Could you clarify?"
        }
      ]);
      return;
    }

    const resolvedParsed = resolveContactForParsedCommand(parsed);
    if (!resolvedParsed) return;

    if (resolvedParsed.confidence === "low") {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "I need a little more detail before preparing a preview. Please include the action, token, amount, and destination if needed."
        }
      ]);
      return;
    }

    if (shouldAnswerDirectly(resolvedParsed)) {
      const result = await assistantActions.executeAssistantAction(resolvedParsed);
      if (!result) return;
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: result.message,
          result
        }
      ]);
      return;
    }

    setActivePreview(resolvedParsed);
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: naturalResponse(resolvedParsed),
        parsed: resolvedParsed
      }
    ]);
  }

  function handleContactCommand(command: ContactCommand) {
    if (command.type === "show") {
      const content = assistantContacts.contacts.length
        ? `Saved contacts:\n\n${assistantContacts.contacts.map((contact) => `${contact.name}: ${contact.address}`).join("\n")}`
        : "No saved contacts yet. You can say: Save this address as Ali: 0x...";
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", content }]);
      return;
    }

    if (command.type === "delete") {
      const result = assistantContacts.deleteContact(command.name);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "error" in result ? result.error ?? "Contact could not be deleted." : `Deleted ${result.contact.name} from your saved contacts.`
        }
      ]);
      return;
    }

    if (command.type === "update") {
      const result = assistantContacts.updateContact(command.name, command.address);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "error" in result ? result.error ?? "Contact could not be updated." : `Updated ${result.contact.name} to ${result.contact.address}.`
        }
      ]);
      return;
    }

    if (!isAddress(command.address)) {
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", content: "That is not a valid wallet address. Please provide a valid 0x address." }]);
      return;
    }

    const duplicate = assistantContacts.findExact(command.name);
    setPendingContactSave({ name: command.name.trim(), address: command.address, overwrite: Boolean(duplicate) });
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: duplicate
          ? `I found an existing contact named ${duplicate.name}.\n\nCurrent address:\n${duplicate.address}\n\nNew address:\n${command.address}\n\nOverwrite this saved contact?`
          : `I found this address:\n${command.address}\n\nSave it as:\n${command.name.trim()}?`
      }
    ]);
  }

  function resolveContactForParsedCommand(parsed: ParsedCommand) {
    if (parsed.actionType !== "send" || parsed.destinationAddress || !parsed.contactName) return parsed;
    const exact = assistantContacts.findExact(parsed.contactName);
    if (exact) {
      const resolved: ParsedCommand = {
        ...parsed,
        destinationAddress: exact.address,
        contactName: exact.name,
        confidence: parsed.amount && parsed.token ? "high" : parsed.confidence
      };
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `I found ${exact.name} in your saved contacts.\n\nName:\n${exact.name}\n\nAddress:\n${exact.address}`
        }
      ]);
      return resolved;
    }

    const similar = assistantContacts.findSimilar(parsed.contactName);
    if (similar.length > 1) {
      setContactChoices({ parsed, contacts: similar });
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `I found multiple contacts similar to "${parsed.contactName}". Choose the correct one before I prepare a send preview.`
        }
      ]);
      return null;
    }

    if (similar.length === 1) {
      const contact = similar[0];
      setContactChoices({ parsed, contacts: similar });
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `I found a similar saved contact: ${contact.name} (${contact.address}). Choose it if this is the intended recipient.`
        }
      ]);
      return null;
    }

    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `I could not find "${parsed.contactName}" in your saved contacts. Please provide the full wallet address or save this contact first.`
      }
    ]);
    return null;
  }

  function confirmSaveContact() {
    if (!pendingContactSave) return;
    const result = assistantContacts.saveContact(pendingContactSave.name, pendingContactSave.address, pendingContactSave.overwrite);
    setPendingContactSave(null);
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "error" in result ? result.error ?? "Contact could not be saved." : `Saved ${result.contact.name} to your address book.\n\nAddress:\n${result.contact.address}`
      }
    ]);
  }

  function selectContactForSend(contact: AssistantContact) {
    if (!contactChoices) return;
    const resolved: ParsedCommand = {
      ...contactChoices.parsed,
      destinationAddress: contact.address,
      contactName: contact.name,
      confidence: contactChoices.parsed.amount && contactChoices.parsed.token ? "high" : contactChoices.parsed.confidence
    };
    setContactChoices(null);
    setActivePreview(resolved);
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `I found ${contact.name} in your saved contacts.\n\nName:\n${contact.name}\n\nAddress:\n${contact.address}\n\n${naturalResponse(resolved)}`,
        parsed: resolved
      }
    ]);
  }

  function handleEditPreview() {
    if (!activePreview) return;
    setInput(commandSummary(activePreview));
    setActivePreview(null);
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "No problem. Edit the request and send it again when it looks right."
      }
    ]);
  }

  function handleCancelPreview() {
    setActivePreview(null);
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Preview canceled. Nothing was executed."
      }
    ]);
  }

  async function handleLooksCorrect() {
    if (!activePreview || assistantActions.isRunning) return;
    const preview = activePreview;
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `${actionLabel(preview.actionType)} request accepted. I am validating it now.`
      }
    ]);
    const result = await assistantActions.executeAssistantAction(preview);
    if (!result) return;
    setActivePreview(null);
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.message,
        result
      }
    ]);
  }

  function handleVoiceInput() {
    setVoiceNoticeOpen(true);
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
                    <div className={cx("max-w-[86%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6", message.role === "user" ? "bg-gradient-to-r from-orange-500 to-red-500 font-semibold text-white" : "border border-white/10 bg-white/[0.04] text-slate-200 light:border-black light:bg-white light:text-slate-800")}>
                      {message.content}
                      {message.result ? <ResultCard result={message.result} /> : null}
                    </div>
                  </div>
                ))}

                {isThinking ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <div className="flex max-w-[86%] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 light:border-black light:bg-white light:text-slate-800">
                      <span className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:120ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:240ms]" />
                      </span>
                      {thinkingStep}
                    </div>
                  </motion.div>
                ) : null}

                {assistantActions.isRunning ? <AssistantProgressCard label={assistantActions.progressLabel} message={assistantActions.progressMessage} /> : null}

                {activePreview ? <ConfirmationPreview parsed={activePreview} onEdit={handleEditPreview} onCancel={handleCancelPreview} onLooksCorrect={handleLooksCorrect} isRunning={assistantActions.isRunning} /> : null}

                {pendingContactSave ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 light:border-emerald-600/25 light:bg-emerald-50">
                    <div className="flex items-start gap-3">
                      <ActionIcon action="profile" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300 light:text-emerald-700">Saved Contact</p>
                        <h3 className="mt-1 text-base font-black text-white light:text-slate-950">{pendingContactSave.overwrite ? "Overwrite Contact?" : "Save Contact?"}</h3>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <DetailRow label="Name" value={pendingContactSave.name} />
                      <DetailRow label="Address" value={pendingContactSave.address} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={confirmSaveContact} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-3 py-2 text-xs font-black text-white shadow-[0_12px_30px_rgba(249,115,22,0.22)]">
                        <UserPlus className="h-3.5 w-3.5" /> {pendingContactSave.overwrite ? "Overwrite Contact" : "Save Contact"}
                      </button>
                      <button type="button" onClick={() => setPendingContactSave(null)} className="rounded-xl border border-red-400/25 px-3 py-2 text-xs font-black text-red-200 transition hover:bg-red-500/10 light:text-red-700">
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : null}

                {contactChoices ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-orange-400/25 bg-orange-500/10 p-4 light:border-black light:bg-orange-50">
                    <p className="text-sm font-black text-white light:text-slate-950">Choose saved contact</p>
                    <div className="mt-3 grid gap-2">
                      {contactChoices.contacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => selectContactForSend(contact)}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left text-xs font-semibold text-slate-300 transition hover:border-orange-400/40 hover:bg-orange-500/10 light:border-black light:bg-white light:text-slate-800"
                        >
                          <span>
                            <span className="block font-black text-white light:text-slate-950">{contact.name}</span>
                            <span className="mt-1 block break-all text-slate-400 light:text-slate-600">{contact.address}</span>
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-orange-300 light:text-orange-700" />
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => setContactChoices(null)} className="mt-3 rounded-xl border border-red-400/25 px-3 py-2 text-xs font-black text-red-200 transition hover:bg-red-500/10 light:text-red-700">
                      Cancel
                    </button>
                  </motion.div>
                ) : null}

                <div className="grid gap-2">
                  {visibleExamples.map((example) => (
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

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 light:border-black light:bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white light:text-slate-950">Saved Contacts</p>
                      <p className="mt-1 text-xs text-slate-400 light:text-slate-600">Use names in commands like “Send 10 USDC to Ali”.</p>
                    </div>
                    <UserPlus className="h-4 w-4 text-orange-300 light:text-orange-700" />
                  </div>
                  {visibleContacts.length ? (
                    <div className="mt-3 grid gap-2">
                      {visibleContacts.map((contact) => (
                        <div key={contact.id} className="rounded-xl border border-white/10 bg-black/20 p-3 light:border-black light:bg-slate-50">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-white light:text-slate-950">{contact.name}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-400 light:text-slate-600">{shortAddress(contact.address)}</p>
                            </div>
                            <div className="flex gap-1.5">
                              <button type="button" onClick={() => navigator.clipboard?.writeText(contact.address)} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:text-orange-200 light:border-black light:text-slate-700" aria-label={`Copy ${contact.name} address`}>
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" onClick={() => setInput(`Update ${contact.name} address to `)} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:text-orange-200 light:border-black light:text-slate-700" aria-label={`Edit ${contact.name}`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" onClick={() => setInput(`Delete ${contact.name} from contacts`)} className="rounded-lg border border-red-400/20 p-2 text-red-200 hover:bg-red-500/10 light:text-red-700" aria-label={`Delete ${contact.name}`}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-slate-400 light:border-black light:bg-slate-50 light:text-slate-600">
                      No contacts saved yet. Try: Save this address as Ali: 0x...
                    </p>
                  )}
                </div>
              </div>

              <form onSubmit={submitCommand} className="border-t border-white/10 p-4 light:border-black">
                <AnimatePresence>
                  {voiceNoticeOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mb-3 rounded-2xl border border-orange-400/25 bg-gradient-to-br from-orange-500/15 via-white/[0.04] to-red-500/10 p-4 shadow-[0_18px_45px_rgba(249,115,22,0.16)] light:border-black light:bg-orange-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-white light:text-slate-950">🎤 Voice Assistant</p>
                          <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-orange-300 light:text-orange-700">Coming Soon</p>
                        </div>
                        <button type="button" onClick={() => setVoiceNoticeOpen(false)} className="rounded-lg border border-white/10 p-1.5 text-slate-300 light:border-black light:text-slate-700" aria-label="Close voice assistant notice">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300 light:text-slate-700">Soon you&apos;ll be able to send funds, swap tokens, bridge assets, claim faucet, check rewards, and manage your wallet using voice commands.</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 light:border-black light:bg-white">
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Type a message..."
                    disabled={isThinking}
                    className="min-h-11 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-500 light:text-slate-950"
                  />
                  <button type="button" onClick={handleVoiceInput} className="group relative inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-orange-400/40 hover:text-white light:border-black light:text-slate-700 light:hover:text-orange-700">
                    <Mic className="h-4 w-4" /> Voice
                    <span className="pointer-events-none absolute bottom-full right-0 mb-2 hidden w-64 rounded-xl border border-orange-400/25 bg-slate-950 p-3 text-left text-xs leading-5 text-slate-200 shadow-[0_18px_45px_rgba(0,0,0,0.36)] group-hover:block light:border-black light:bg-white light:text-slate-800">
                      <span className="block font-black text-white light:text-slate-950">🎤 Voice Assistant</span>
                      <span className="mt-1 block font-black uppercase tracking-[0.14em] text-orange-300 light:text-orange-700">Coming Soon</span>
                      <span className="mt-2 block">Soon you&apos;ll use voice commands for sends, swaps, bridges, faucet, rewards, and wallet management.</span>
                    </span>
                  </button>
                  <button type="submit" disabled={isThinking} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_12px_30px_rgba(249,115,22,0.28)] disabled:cursor-not-allowed disabled:opacity-70" aria-label="Send assistant message">
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-400 light:text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-mint" />
                  Velora AI never moves funds automatically. Every transaction will require wallet confirmation.
                </div>
              </form>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
