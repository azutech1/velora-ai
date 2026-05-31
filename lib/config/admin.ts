export const ADMIN_WALLETS = (process.env.NEXT_PUBLIC_ADMIN_WALLETS ?? "")
  .split(",")
  .map((wallet) => wallet.trim().toLowerCase())
  .filter(Boolean);

export function isAdminWallet(address?: string | null) {
  if (!address) return false;
  return ADMIN_WALLETS.includes(address.toLowerCase());
}
