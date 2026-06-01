"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDown, Copy, ExternalLink, Loader2, LogOut, ShieldCheck, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDisconnect } from "wagmi";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useAuthContext } from "@/providers/AuthProvider";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function WalletActivityTracker({
  ready,
  connected,
  address,
  chainId,
  chainName
}: {
  ready: boolean;
  connected: boolean;
  address?: string;
  chainId?: number;
  chainName?: string;
}) {
  const { recordActivity } = useActivityRecorder();
  const previousAddress = useRef<string | null>(null);
  const previousChain = useRef<string | number | null>(null);

  useEffect(() => {
    if (!ready) return;

    const currentAddress = connected && address ? address : null;
    const currentChain = connected ? chainId ?? null : null;

    if (currentAddress && previousAddress.current !== currentAddress) {
      recordActivity({
        walletAddress: currentAddress,
        actionType: "wallet_connect",
        title: "Wallet connected",
        description: "A wallet connected to Velora AI.",
        feature: "wallet",
        network: chainName,
        status: "success"
      });
    }

    if (!currentAddress && previousAddress.current) {
      recordActivity({
        walletAddress: previousAddress.current,
        actionType: "wallet_disconnect",
        title: "Wallet disconnected",
        description: "The wallet session was disconnected from Velora AI.",
        feature: "wallet",
        status: "info"
      });
    }

    if (currentAddress && previousChain.current && previousChain.current !== currentChain) {
      recordActivity({
        walletAddress: currentAddress,
        actionType: "network_switch",
        title: "Network switched",
        description: `Wallet network switched to ${chainName ?? `chain ${chainId}`}.`,
        feature: "network",
        network: chainName,
        status: "success",
        metadata: { chainId: chainId ?? null }
      });
    }

    previousAddress.current = currentAddress;
    previousChain.current = currentChain;
  }, [address, chainId, chainName, connected, ready, recordActivity]);

  return null;
}

export function WalletConnectButton({ compact = false }: { compact?: boolean }) {
  const auth = useAuthContext();
  const { disconnect } = useDisconnect();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted, authenticationStatus }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === "authenticated");

        if (!ready) {
          return (
            <>
              <WalletActivityTracker ready={ready} connected={Boolean(connected)} address={account?.address} chainId={chain?.id} chainName={chain?.name} />
              <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-cyan" /> Loading wallet
              </button>
            </>
          );
        }

        if (!connected) {
          return (
            <>
              <WalletActivityTracker ready={ready} connected={false} />
              <button onClick={openConnectModal} className="flex items-center gap-2 rounded-lg bg-cyan px-4 py-3 text-sm font-bold text-white shadow-neon transition hover:scale-[1.02]">
                <Wallet className="h-4 w-4" /> Connect Wallet
              </button>
            </>
          );
        }

        if (chain.unsupported) {
          return (
            <>
              <WalletActivityTracker ready={ready} connected={Boolean(connected)} address={account.address} chainId={chain.id} chainName={chain.name} />
              <button onClick={openChainModal} className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                Wrong network
              </button>
            </>
          );
        }

        return (
          <div className="relative flex flex-wrap items-center gap-2">
            <WalletActivityTracker ready={ready} connected={Boolean(connected)} address={account.address} chainId={chain.id} chainName={chain.name} />
            <button
              onClick={() => setMenuOpen((value) => !value)}
              className="flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan/45 hover:bg-cyan/10"
            >
              <Wallet className="h-4 w-4 text-cyan" />
              {compact ? shortAddress(account.address) : account.displayName || shortAddress(account.address)}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-white/10 bg-[#090D15]/95 p-2 shadow-2xl shadow-cyan/10 backdrop-blur-xl">
                <button
                  onClick={() => {
                    void navigator.clipboard?.writeText(account.address);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <Copy className="h-4 w-4 text-cyan" />
                  Copy Address
                </button>
                <button
                  onClick={() => {
                    openAccountModal();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <ExternalLink className="h-4 w-4 text-cyan" />
                  View Wallet
                </button>
                <button
                  onClick={() => {
                    disconnect();
                    setMenuOpen(false);
                  }}
                  className="disconnect-action flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <LogOut className="h-4 w-4 text-cyan" />
                  Disconnect Wallet
                </button>
                <div className="my-2 h-px bg-white/10" />
                {auth.isAuthenticated ? (
                  <button
                    onClick={() => {
                      void auth.logout();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <ShieldCheck className="h-4 w-4 text-mint" />
                    Logout Session
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      void auth.signIn();
                      setMenuOpen(false);
                    }}
                    disabled={auth.state === "signing"}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-mint transition hover:bg-mint/10 disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {auth.state === "signing" ? "Signing..." : "Sign in Session"}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

export function DisconnectHint() {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <LogOut className="h-3.5 w-3.5" />
      Disconnect is available from the wallet account menu.
    </div>
  );
}
