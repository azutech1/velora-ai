import { formatUnits } from "viem";

export function shortAddress(address?: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatUSDC(value: bigint, decimals = 6) {
  const formatted = formatUnits(value, decimals);
  const [whole, fraction = ""] = formatted.split(".");
  const trimmedFraction = fraction.slice(0, 2).replace(/0+$/, "");
  return `${whole}${trimmedFraction ? `.${trimmedFraction}` : ""} USDC`;
}

export function explorerTxUrl(explorerUrl: string, hash: string) {
  return `${explorerUrl.replace(/\/$/, "")}/tx/${hash}`;
}

export function formatGasEstimate(gas?: bigint) {
  if (!gas) return "Pending estimate";
  return `${gas.toLocaleString()} gas`;
}
