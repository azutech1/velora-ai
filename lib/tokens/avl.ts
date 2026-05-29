import type { Address } from "viem";

export const AVL_TOKEN = {
  name: "Velora AI Token",
  symbol: "AVL",
  network: "Arc",
  decimals: 18,
  totalSupply: "100,000,000 AVL",
  contractAddress: "0x0000000000000000000000000000000000000000" as Address,
  purpose:
    "AVL is a utility token for premium AI automation access, agent marketplace utility, fee discounts, rewards, and future governance.",
  safety:
    "AVL is designed as a utility token for the Velora AI ecosystem. This page is for product demonstration and does not represent financial advice."
};

export const AVL_TOKENOMICS = [
  { label: "Community Rewards", value: "40%", detail: "User rewards, participation incentives, and ecosystem contribution programs." },
  { label: "Ecosystem Growth", value: "25%", detail: "Partnerships, integrations, developer grants, and Arc ecosystem expansion." },
  { label: "Team & Development", value: "20%", detail: "Product development, operations, security, and long-term maintenance." },
  { label: "Liquidity", value: "10%", detail: "Future liquidity support for utility access and marketplace operations." },
  { label: "Reserve", value: "5%", detail: "Strategic reserve for future ecosystem needs and governance-directed programs." }
];

export const AVL_UTILITIES = [
  "Premium AI automation access",
  "Agent marketplace utility",
  "Fee discount eligibility",
  "Rewards system participation",
  "Future governance signaling",
  "Developer and integration incentives"
];

export const SUPPORTED_SWAP_TOKENS = [
  { symbol: "USDC", name: "USD Coin", decimals: 6 },
  { symbol: "AVL", name: "Velora AI Token", decimals: 18 }
];
