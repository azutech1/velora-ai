"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Bot, CheckCircle2, Coins, Copy, Droplets, Edit3, Mic, MessageCircle, Route, Send, ShieldCheck, Sparkles, Wallet, X } from "lucide-react";
import { cx } from "@/components/azu/utils";
import { useAssistantActions, type AssistantActionResult } from "./useAssistantActions";
import type { AssistantAction, AssistantIntent, ParsedCommand } from "./types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  parsed?: ParsedCommand;
  result?: AssistantActionResult;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
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
    return {
      intentType: "send",
      actionType: "send",
      amount,
      token,
      destinationAddress,
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

function commandSummary(parsed: ParsedCommand) {
  const amountText = parsed.amount && parsed.token ? `${parsed.amount} ${parsed.token}` : parsed.token;

  switch (parsed.actionType) {
    case "send":
      return `send ${amountText ?? "funds"} to ${parsed.destinationAddress ?? "a wallet address"}`;
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

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
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
        {parsed.actionType === "send" ? <DetailRow label="Destination" value={parsed.destinationAddress} /> : null}
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
  const assistantActions = useAssistantActions();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(thinkingSteps[0]);
  const [activePreview, setActivePreview] = useState<ParsedCommand | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "I am online. Type a wallet, swap, bridge, balance, or XP command and I will prepare a safe preview. Velora AI never moves funds automatically. Every transaction will require wallet confirmation."
    }
  ]);

  const visibleExamples = useMemo(() => examples.slice(0, 4), []);

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

    if (parsed.confidence === "low") {
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

    if (shouldAnswerDirectly(parsed)) {
      const result = await assistantActions.executeAssistantAction(parsed);
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

    setActivePreview(parsed);
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: naturalResponse(parsed),
        parsed
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
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Voice input is not supported in this browser yet. You can still type the command."
        }
      ]);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setInput(transcript);
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: `Voice captured: "${transcript}". Review it, then send when ready.`
          }
        ]);
      }
    };
    recognition.onerror = () => {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Voice input failed. Please try again or type the command."
        }
      ]);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
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
              </div>

              <form onSubmit={submitCommand} className="border-t border-white/10 p-4 light:border-black">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 light:border-black light:bg-white">
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Type a message..."
                    disabled={isThinking}
                    className="min-h-11 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-500 light:text-slate-950"
                  />
                  <button type="button" onClick={handleVoiceInput} className="hidden items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 sm:inline-flex light:border-black light:text-slate-700">
                    <Mic className="h-4 w-4" /> {isListening ? "Listening" : "Voice"}
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
