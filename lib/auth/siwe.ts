import type { SiweMessageInput } from "./types";

export const SIWE_STATEMENT = "Sign in to Velora AI to sync activity, rewards, faucet claims, and transaction history.";
export const SIWE_VERSION = "1" as const;
export const SIWE_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export function createNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createSiweMessage(input: SiweMessageInput) {
  return `${input.domain} wants you to sign in with your Ethereum account:
${input.address}

${input.statement}

URI: ${input.uri}
Version: ${input.version}
Chain ID: ${input.chainId}
Nonce: ${input.nonce}
Issued At: ${input.issuedAt}
Expiration Time: ${input.expirationTime}`;
}

export function parseSiweMessage(message: string) {
  const lines = message.split("\n");
  const address = lines[1]?.trim();
  const field = (label: string) => {
    const line = lines.find((item) => item.startsWith(`${label}: `));
    return line?.slice(label.length + 2).trim() ?? "";
  };

  return {
    domain: lines[0]?.replace(" wants you to sign in with your Ethereum account:", "").trim() ?? "",
    address,
    uri: field("URI"),
    version: field("Version"),
    chainId: Number(field("Chain ID")),
    nonce: field("Nonce"),
    issuedAt: field("Issued At"),
    expirationTime: field("Expiration Time")
  };
}
