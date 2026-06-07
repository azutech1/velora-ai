export type AssistantKnowledgeEntry = {
  id: string;
  title: string;
  topics: string[];
  answer: string;
  relatedCommands?: string[];
};

export const ASSISTANT_KNOWLEDGE: AssistantKnowledgeEntry[] = [
  {
    id: "arc",
    title: "Arc",
    topics: ["arc", "arc testnet", "arc ecosystem", "what is arc"],
    answer:
      "Arc is Circle's economic operating system initiative for stablecoin-native applications. In Velora AI, Arc Testnet is the primary network for wallet activity, swaps, bridge testing, rewards, and public beta workflows.",
    relatedCommands: ["Show my wallet balance", "Bridge 10 USDC from Arc to Base"]
  },
  {
    id: "cctp",
    title: "Circle CCTP",
    topics: ["cctp", "circle cctp", "cross-chain transfer protocol", "how does cctp work"],
    answer:
      "Circle CCTP moves USDC across supported chains by burning USDC on the source chain and minting USDC on the destination chain after Circle attestation. Velora uses this model for bridge routes when a live executable provider route is available.",
    relatedCommands: ["Bridge 10 USDC from Arc to Base"]
  },
  {
    id: "gateway",
    title: "Circle Gateway",
    topics: ["gateway", "circle gateway", "arc gateway"],
    answer:
      "Circle Gateway is designed to improve stablecoin liquidity and movement across supported environments. For Arc outbound bridge routes, Velora treats Gateway/CCTP as the preferred path when it can produce a real executable bridge lifecycle.",
    relatedCommands: ["Bridge 10 USDC from Arc to Ethereum"]
  },
  {
    id: "usdc",
    title: "USDC",
    topics: ["usdc", "usd coin", "stablecoin"],
    answer:
      "USDC is Circle's dollar-backed stablecoin. Velora focuses on USDC-first workflows including sending, swapping, bridging, activity tracking, and rewards progress on supported testnet routes.",
    relatedCommands: ["Send 10 USDC to 0x...", "Swap 20 USDC to EURC"]
  },
  {
    id: "eurc",
    title: "EURC",
    topics: ["eurc", "euro coin", "euro stablecoin"],
    answer:
      "EURC is Circle's euro-denominated stablecoin. Velora supports stablecoin swap workflows such as USDC to EURC and EURC to USDC when a live executable swap route is available.",
    relatedCommands: ["Swap 20 USDC to EURC", "Swap 10 EURC to USDC"]
  },
  {
    id: "agent-wallets",
    title: "Agent Wallets",
    topics: ["agent wallets", "agent wallet", "ai wallet", "approval first"],
    answer:
      "Velora's assistant is approval-first. It can parse requests, prepare previews, validate balances and routes, and then require wallet confirmation before any transaction can move funds.",
    relatedCommands: ["Send 10 USDC to 0x...", "Show my XP"]
  },
  {
    id: "appkit",
    title: "Circle AppKit",
    topics: ["appkit", "circle appkit", "bridge kit", "bridgekit"],
    answer:
      "Circle AppKit and BridgeKit provide developer tools for wallet-connected stablecoin flows. Velora uses these tools where they can produce real wallet-confirmed transactions and traceable bridge lifecycle data.",
    relatedCommands: ["Bridge 10 USDC from Arc to Base"]
  },
  {
    id: "velora",
    title: "Velora AI",
    topics: ["velora", "velora ai", "how does velora work", "what is velora"],
    answer:
      "Velora AI is an AI-native stablecoin operating system for Arc. It combines wallet balances, swaps, bridges, activity tracking, rewards, and an assistant that helps users prepare actions safely before wallet confirmation.",
    relatedCommands: ["Show my wallet balance", "Show my XP", "Swap 20 USDC to EURC"]
  },
  {
    id: "bridge-usdc",
    title: "Bridging USDC",
    topics: ["how do i bridge usdc", "bridge usdc", "how to bridge", "bridge"],
    answer:
      "To bridge USDC, choose a supported source and destination chain, enter the USDC amount, review the route, approve if needed, then confirm the bridge transaction in your wallet. Velora tracks approval, source transaction, and destination settlement when provider data is available.",
    relatedCommands: ["Bridge 10 USDC from Arc to Base"]
  }
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function findAssistantKnowledgeAnswer(question: string) {
  const normalizedQuestion = normalize(question);
  let best: { entry: AssistantKnowledgeEntry; score: number } | null = null;

  for (const entry of ASSISTANT_KNOWLEDGE) {
    const score = entry.topics.reduce((total, topic) => {
      const normalizedTopic = normalize(topic);
      if (!normalizedTopic) return total;
      if (normalizedQuestion.includes(normalizedTopic)) return total + Math.max(3, normalizedTopic.split(" ").length);
      return total + normalizedTopic.split(" ").filter((word) => normalizedQuestion.includes(word)).length;
    }, 0);

    if (!best || score > best.score) {
      best = { entry, score };
    }
  }

  return best && best.score > 0 ? best.entry : null;
}
