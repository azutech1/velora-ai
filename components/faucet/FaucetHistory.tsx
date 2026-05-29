import { ExternalLink } from "lucide-react";
import { type FaucetClaim } from "@/lib/faucet/tokens";
import { ARC_EXPLORER_URL } from "@/lib/web3/chains";
import { explorerTxUrl, shortAddress } from "@/lib/utils/format";

export function FaucetHistory({ claims }: { claims: FaucetClaim[] }) {
  return (
    <section className="glass rounded-lg p-5">
      <h2 className="text-xl font-bold text-white">Recent faucet claims</h2>
      <div className="mt-5 space-y-3">
        {claims.length ? (
          claims.slice(0, 6).map((claim) => (
            <div key={claim.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{claim.amount}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(claim.claimedAt).toLocaleString()}</p>
                </div>
                <a className="inline-flex items-center gap-2 text-sm text-cyan hover:text-mint" href={explorerTxUrl(ARC_EXPLORER_URL, claim.hash)} target="_blank" rel="noreferrer">
                  {shortAddress(claim.hash)} <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-slate-400">No faucet claims yet.</p>
        )}
      </div>
    </section>
  );
}
