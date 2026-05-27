import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { saveTransaction } from "@/lib/supabase/helpers";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { DatabaseTransaction } from "@/lib/supabase/types";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Wallet authentication is required." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Partial<DatabaseTransaction> | null;
  if (!body?.tx_hash || !body.chain_id || !body.feature || !body.status) {
    return NextResponse.json({ error: "Invalid transaction payload." }, { status: 400 });
  }

  if (!isAddress(user.walletAddress)) {
    return NextResponse.json({ error: "Authenticated wallet is invalid." }, { status: 401 });
  }

  const transaction = await saveTransaction({
    ...body,
    wallet_address: user.walletAddress,
    tx_hash: body.tx_hash,
    chain_id: body.chain_id,
    feature: body.feature,
    status: body.status
  });

  return NextResponse.json({ transaction, storageMode: transaction ? "database" : "unconfigured" });
}
