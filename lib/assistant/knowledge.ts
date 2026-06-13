export type AssistantKnowledgeCategory =
  | "Velora Features"
  | "Wallet Help"
  | "Swap Help"
  | "Bridge Help"
  | "Faucet Help"
  | "Rewards Help"
  | "Profile Help"
  | "Arc Knowledge"
  | "Circle Knowledge"
  | "Security Rules"
  | "Token Disclaimer"
  | "Future Updates";

export type AssistantKnowledgeEntry = {
  id: string;
  category: AssistantKnowledgeCategory;
  title: string;
  topics: string[];
  answer: string;
  relatedCommands?: string[];
};

export const ASSISTANT_SCOPE_RESPONSE =
  "I’m focused on Velora AI, Arc, Circle, stablecoins, liquidity pools, and supported wallet actions. I can help you send, swap, bridge, claim faucet, check balances, view XP, or answer questions about Velora AI, Arc, and Circle.";

const TRANSACTION_SAFETY_NOTE =
  "Velora AI never moves funds automatically. Always verify the recipient address, token, network, and route before confirming in your wallet.";

export const ASSISTANT_KNOWLEDGE: AssistantKnowledgeEntry[] = [
  {
    id: "security-secrets",
    category: "Security Rules",
    title: "Protect Your Secret Keys",
    topics: ["seed phrase", "private key", "password", "api key", "admin wallet", "environment variables", "backend credentials", "secret config", "hidden config", "reveal secrets"],
    answer:
      "I can't help reveal or request secret keys, private credentials, or sensitive information. Never share your seed phrase, private key, password, API keys, admin wallet secrets, or backend credentials with anyone.",
    relatedCommands: ["Show my wallet balance"]
  },
  {
    id: "token-safety",
    category: "Token Disclaimer",
    title: "Velora Token Safety",
    topics: ["velora token", "native token", "airdrop", "token launch", "xp convert", "xp conversion", "profit", "allocation", "token price", "launch date"],
    answer:
      "Velora AI may explore future ecosystem rewards or token-related utilities, but no guaranteed token, airdrop, profit, allocation, launch date, or XP conversion rate should be promised unless officially announced.",
    relatedCommands: ["Show my XP", "Open Rewards Center"]
  },
  {
    id: "future-updates",
    category: "Future Updates",
    title: "Latest Arc and Circle Updates",
    topics: ["new event", "events", "campaign", "campaigns", "new launch", "ecosystem update", "latest update", "latest news", "future launch"],
    answer:
      "I can only answer based on current Velora knowledge. Please check official Arc and Circle channels for the latest updates, events, launches, and ecosystem announcements. Velora can connect official links or live news sources later.",
    relatedCommands: ["What is Arc?", "What is Circle CCTP?"]
  },
  {
    id: "velora-overview",
    category: "Velora Features",
    title: "Velora AI",
    topics: ["velora", "velora ai", "how does velora work", "what is velora", "what velora is building", "velora features"],
    answer:
      "Velora AI is an AI-native stablecoin operating system for Arc. During Testnet Beta, it focuses on USDC/EURC swaps, bridge workflows, faucet access, transaction activity, Rewards Center progress, profiles, and a safe assistant in one interface. Additional assets such as USDT will be introduced in future updates.",
    relatedCommands: ["Show my wallet balance", "Show my XP", "Swap 20 USDC to EURC"]
  },
  {
    id: "assistant-help",
    category: "Velora Features",
    title: "Using Velora AI Assistant",
    topics: ["how do i use ai assistant", "use ai assistant", "assistant help", "what can assistant do", "velora assistant"],
    answer:
      `Use the floating Velora AI button to type commands or questions. You can ask for wallet balances, XP, faucet help, swaps, bridges, sends, or product guidance. For transactions, the assistant prepares a preview first and requires wallet confirmation. ${TRANSACTION_SAFETY_NOTE}`,
    relatedCommands: ["Show my wallet balance", "Bridge 10 USDC from Arc to Base"]
  },
  {
    id: "connect-wallet",
    category: "Wallet Help",
    title: "Connect Wallet",
    topics: ["connect wallet", "how do i connect my wallet", "wallet connect", "connect metamask", "connect rabby", "connect coinbase wallet"],
    answer:
      "To connect your wallet, use the wallet button in the top-right of Velora AI, choose your wallet provider, approve the connection request, and confirm the connected address shown in the header. Never share your seed phrase or private key.",
    relatedCommands: ["Show my wallet balance"]
  },
  {
    id: "switch-arc",
    category: "Wallet Help",
    title: "Switch to Arc Testnet",
    topics: ["switch to arc", "switch arc testnet", "wrong network", "arc testnet network", "how do i switch to arc testnet"],
    answer:
      "If Velora asks you to switch networks, click the network button or action prompt, then approve the wallet network switch. If Arc Testnet is missing, your wallet may ask to add it first. Confirm only if the chain details match the Velora prompt.",
    relatedCommands: ["Show my wallet balance", "Swap 20 USDC to EURC"]
  },
  {
    id: "wallet-balance",
    category: "Wallet Help",
    title: "Check Wallet Balance",
    topics: ["wallet balance", "check balance", "show balance", "how do i check my wallet balance", "portfolio value"],
    answer:
      "Open Dashboard or Profile to view your stablecoin balances. You can also ask Velora AI: 'Show my wallet balance' to display supported Testnet Beta balances such as USDC, EURC, and portfolio value when your wallet is connected. USDT support is marked Coming Soon.",
    relatedCommands: ["Show my wallet balance"]
  },
  {
    id: "swap-help",
    category: "Swap Help",
    title: "Swap Stablecoins",
    topics: ["swap", "swap usdc to eurc", "swap eurc to usdc", "swap usdc to usdt", "how does swapping work", "how do i swap usdc to eurc"],
    answer:
      `To swap during Testnet Beta, open Bridge & Swap, choose the Swap tab, use the active USDC ↔ EURC pair, enter an amount, review the estimated output, route, price impact, and fee, then click Swap and confirm in your wallet. USDT swap support is coming soon. ${TRANSACTION_SAFETY_NOTE}`,
    relatedCommands: ["Swap 20 USDC to EURC", "Swap 10 EURC to USDC"]
  },
  {
    id: "bridge-help",
    category: "Bridge Help",
    title: "Bridge USDC",
    topics: ["bridge", "bridge usdc", "bridge usdc to base", "how do i bridge usdc to base sepolia", "how does bridging work", "cross chain bridge"],
    answer:
      `To bridge USDC, open Bridge & Swap, choose the Bridge tab, select the source and destination networks, select USDC, enter an amount, review the route/provider/fee, then confirm each required wallet step. Velora tracks approval, source transaction, and destination settlement when provider data is available. ${TRANSACTION_SAFETY_NOTE}`,
    relatedCommands: ["Bridge 10 USDC from Arc to Base"]
  },
  {
    id: "liquidity-pools",
    category: "Velora Features",
    title: "Liquidity Pools",
    topics: ["liquidity pool", "liquidity pools", "how does liquidity work", "what is liquidity pool", "add liquidity", "remove liquidity", "pool positions", "lp position"],
    answer:
      "Liquidity pools let users deposit paired tokens into a pool so swaps can route through shared liquidity. In Velora AI Testnet Beta, the active designed pool focus is USDC/EURC on Arc Testnet. USDC/USDT and EURC/USDT are visible as Coming Soon. Pool values, rewards, and positions are for testing only and do not represent real yield or financial returns. Velora will only request wallet confirmation once a real pool contract integration is available.",
    relatedCommands: ["Show liquidity pools", "Add 10 USDC and EURC liquidity"]
  },
  {
    id: "gas-fees",
    category: "Wallet Help",
    title: "Gas Fees and Testnet ETH",
    topics: ["gas fees", "why gas", "testnet eth", "need eth", "why users need testnet eth", "native gas"],
    answer:
      "Gas fees pay the network to process transactions. Even testnet swaps, bridges, approvals, and sends may require native testnet gas on the source chain. If a transaction cannot start, check that your wallet has the required testnet gas token for that network.",
    relatedCommands: ["Claim Arc faucet", "Show my wallet balance"]
  },
  {
    id: "faucet-help",
    category: "Faucet Help",
    title: "Claim Faucet",
    topics: ["faucet", "claim faucet", "claim arc faucet", "claim usdc faucet", "claim testnet funds", "how do i claim faucet"],
    answer:
      "Open the Faucet page in Velora AI and use the Open Circle Faucet button. The assistant can also open the official faucet workflow with 'Claim Arc faucet' or 'Claim USDC faucet'. Faucet assets are testnet-only and have no real monetary value.",
    relatedCommands: ["Claim Arc faucet"]
  },
  {
    id: "rewards-center",
    category: "Rewards Help",
    title: "Rewards Center",
    topics: ["rewards center", "use rewards center", "xp balance", "claim daily xp", "daily check in", "daily reward", "social tasks", "complete social tasks", "bridge tasks", "swap tasks"],
    answer:
      "Open Rewards Center to view XP, level, streak, daily check-in, social tasks, bridge tasks, swap tasks, and achievements. Daily XP can be claimed once per day. Social tasks require opening the task first, then using Verify Task before XP is credited.",
    relatedCommands: ["Show my XP", "Claim daily reward preview"]
  },
  {
    id: "profile-help",
    category: "Profile Help",
    title: "Profile and Activity",
    topics: ["profile", "view profile", "transaction history", "activity history", "view transaction history", "recent transactions"],
    answer:
      "Open Profile to review wallet-linked profile details, badges, and portfolio activity. Open Activity to see transaction history, including swaps, bridges, payments, status, and explorer links when transaction hashes are available.",
    relatedCommands: ["Show my wallet balance"]
  },
  {
    id: "arc",
    category: "Arc Knowledge",
    title: "Arc",
    topics: ["arc", "arc testnet", "arc ecosystem", "what is arc"],
    answer:
      "Arc is Circle's economic operating system initiative for stablecoin-native applications. In Velora AI, Arc Testnet is the primary network for wallet activity, swaps, bridge testing, rewards, and public beta workflows.",
    relatedCommands: ["Show my wallet balance", "Bridge 10 USDC from Arc to Base"]
  },
  {
    id: "why-arc",
    category: "Arc Knowledge",
    title: "Why Build on Arc",
    topics: ["why build on arc", "why arc", "arc ecosystem basics", "arc basics"],
    answer:
      "Arc is designed around stablecoin-native financial applications. Velora builds on Arc because the product is focused on USDC and EURC workflows: wallet activity, swaps, bridge routes, rewards, and AI-assisted approval-first actions.",
    relatedCommands: ["Show my portfolio", "Swap 20 USDC to EURC"]
  },
  {
    id: "stablecoins",
    category: "Circle Knowledge",
    title: "Stablecoins",
    topics: ["stablecoins", "what are stablecoins", "stablecoin", "how stablecoins work"],
    answer:
      "Stablecoins are digital assets designed to track the value of a reference asset such as the US dollar or euro. Velora focuses on stablecoin workflows so users can test payments, swaps, bridges, and activity using assets like USDC and EURC.",
    relatedCommands: ["Swap 20 USDC to EURC"]
  },
  {
    id: "cctp",
    category: "Circle Knowledge",
    title: "Circle CCTP",
    topics: ["cctp", "circle cctp", "cross-chain transfer protocol", "how does cctp work"],
    answer:
      "Circle CCTP moves USDC across supported chains by burning USDC on the source chain and minting USDC on the destination chain after Circle attestation. Velora uses this model for bridge routes when a live executable provider route is available.",
    relatedCommands: ["Bridge 10 USDC from Arc to Base"]
  },
  {
    id: "gateway",
    category: "Circle Knowledge",
    title: "Circle Gateway",
    topics: ["gateway", "circle gateway", "arc gateway", "what is circle gateway"],
    answer:
      "Circle Gateway is designed to improve stablecoin liquidity and movement across supported environments. For Arc outbound bridge routes, Velora treats Gateway/CCTP as the preferred path when it can produce a real executable bridge lifecycle.",
    relatedCommands: ["Bridge 10 USDC from Arc to Ethereum"]
  },
  {
    id: "usdc",
    category: "Circle Knowledge",
    title: "USDC",
    topics: ["usdc", "usd coin", "what is usdc"],
    answer:
      "USDC is Circle's dollar-backed stablecoin. Velora focuses on USDC-first workflows including sending, swapping, bridging, activity tracking, and rewards progress on supported testnet routes.",
    relatedCommands: ["Send 10 USDC to 0x...", "Swap 20 USDC to EURC"]
  },
  {
    id: "eurc",
    category: "Circle Knowledge",
    title: "EURC",
    topics: ["eurc", "euro coin", "euro stablecoin", "what is eurc"],
    answer:
      "EURC is Circle's euro-denominated stablecoin. Velora supports stablecoin swap workflows such as USDC to EURC and EURC to USDC when a live executable swap route is available.",
    relatedCommands: ["Swap 20 USDC to EURC", "Swap 10 EURC to USDC"]
  },
  {
    id: "appkit",
    category: "Circle Knowledge",
    title: "Circle AppKit",
    topics: ["appkit", "circle appkit", "bridge kit", "bridgekit"],
    answer:
      "Circle AppKit and BridgeKit provide developer tools for wallet-connected stablecoin flows. Velora uses these tools where they can produce real wallet-confirmed transactions and traceable bridge lifecycle data.",
    relatedCommands: ["Bridge 10 USDC from Arc to Base"]
  },
  {
    id: "agent-wallets",
    category: "Circle Knowledge",
    title: "Agent Wallets",
    topics: ["agent wallets", "what are agent wallets", "agent wallet", "ai wallet"],
    answer:
      "Agent Wallets are a design direction for AI-assisted wallet experiences where software can prepare recommendations or requests while users remain in control. In Velora, every transaction remains approval-first and requires wallet confirmation.",
    relatedCommands: ["How does Velora AI work?", "Send 10 USDC to 0x..."]
  },
  {
    id: "scam-safety",
    category: "Security Rules",
    title: "Scam Warnings",
    topics: ["scam", "phishing", "wallet safety", "safe wallet", "security", "suspicious link"],
    answer:
      "Be careful with links, fake support accounts, surprise airdrop claims, and requests for wallet secrets. Velora AI will never ask for your seed phrase, private key, password, or API keys. Always verify the site URL, token, network, amount, and recipient before confirming in your wallet.",
    relatedCommands: ["Show my wallet balance"]
  }
];

const SENSITIVE_PATTERNS = [
  /\b(seed phrase|recovery phrase|private key|password|api key|secret key|admin wallet|environment variable|env var|backend credential|hidden config)\b/i,
  /\b(reveal|show|give me|send me|print|leak|export)\b.*\b(secret|key|password|credential|config|env)\b/i
];

const TOKEN_PATTERNS = [/\b(airdrop|profit|guaranteed|allocation|token launch|launch date|token price|xp.*convert|convert.*xp|market cap|supply|distribution)\b/i];
const UPDATE_PATTERNS = [/\b(latest|new|upcoming|future|event|campaign|launch|announcement|news)\b/i, /\b(arc|circle|ecosystem)\b.*\b(update|event|campaign|launch|announcement|news)\b/i];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function keywordScore(question: string, topic: string) {
  const normalizedTopic = normalize(topic);
  if (!normalizedTopic) return 0;
  if (question.includes(normalizedTopic)) return Math.max(8, normalizedTopic.split(" ").length * 3);
  return normalizedTopic.split(" ").filter((word) => word.length > 3 && question.includes(word)).length;
}

export function isAssistantKnowledgeInScope(question: string) {
  if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(question))) return true;
  if (TOKEN_PATTERNS.some((pattern) => pattern.test(question)) && /\b(velora|token|xp|airdrop)\b/i.test(question)) return true;
  if (UPDATE_PATTERNS.some((pattern) => pattern.test(question)) && /\b(arc|circle|velora|ecosystem|campaign|event|launch)\b/i.test(question)) return true;

  const normalizedQuestion = normalize(question);
  return ASSISTANT_KNOWLEDGE.some((entry) => {
    const score = entry.topics.reduce((total, topic) => total + keywordScore(normalizedQuestion, topic), 0);
    return score >= 4 || entry.topics.some((topic) => normalizedQuestion.includes(normalize(topic)));
  });
}

export function findAssistantKnowledgeAnswer(question: string) {
  const normalizedQuestion = normalize(question);

  if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(question))) {
    return ASSISTANT_KNOWLEDGE.find((entry) => entry.id === "security-secrets") ?? null;
  }

  if (TOKEN_PATTERNS.some((pattern) => pattern.test(question)) && /\b(velora|token|xp|airdrop)\b/i.test(question)) {
    return ASSISTANT_KNOWLEDGE.find((entry) => entry.id === "token-safety") ?? null;
  }

  if (UPDATE_PATTERNS.some((pattern) => pattern.test(question)) && /\b(arc|circle|velora|ecosystem|campaign|event|launch)\b/i.test(question)) {
    return ASSISTANT_KNOWLEDGE.find((entry) => entry.id === "future-updates") ?? null;
  }

  let best: { entry: AssistantKnowledgeEntry; score: number } | null = null;

  for (const entry of ASSISTANT_KNOWLEDGE) {
    const score = entry.topics.reduce((total, topic) => total + keywordScore(normalizedQuestion, topic), 0);

    if (!best || score > best.score) {
      best = { entry, score };
    }
  }

  return best && best.score >= 4 ? best.entry : null;
}
