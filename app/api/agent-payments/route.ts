import { NextResponse } from "next/server";
import type { AgentPaymentRecord } from "@/lib/agent-payments/types";
import { listAgentPaymentsFromDatabase, saveAgentPaymentToDatabase, updateAgentPaymentInDatabase } from "@/lib/supabase/helpers";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isAgentPaymentRecord(value: unknown): value is AgentPaymentRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<AgentPaymentRecord>;
  return (
    typeof record.paymentId === "string" &&
    typeof record.agentName === "string" &&
    typeof record.serviceName === "string" &&
    typeof record.amount === "string" &&
    record.token === "USDC" &&
    typeof record.destination === "string" &&
    typeof record.status === "string" &&
    Array.isArray(record.logs)
  );
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Wallet authentication is required." }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "100"), 250);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? "0"), 0);

  try {
    const payments = await listAgentPaymentsFromDatabase(user.walletAddress, limit, offset);
    return NextResponse.json({ payments: payments ?? [], storageMode: payments ? "database" : "unconfigured" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to list agent payments.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Wallet authentication is required." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { payment?: unknown } | null;
  if (!isAgentPaymentRecord(body?.payment)) {
    return NextResponse.json({ error: "Invalid agent payment payload." }, { status: 400 });
  }

  try {
    const payment = await saveAgentPaymentToDatabase(body.payment, user.walletAddress);
    return NextResponse.json({ payment, storageMode: payment ? "database" : "unconfigured" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save agent payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Wallet authentication is required." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { payment?: unknown } | null;
  if (!isAgentPaymentRecord(body?.payment)) {
    return NextResponse.json({ error: "Invalid agent payment payload." }, { status: 400 });
  }

  try {
    const payment = await updateAgentPaymentInDatabase(body.payment, user.walletAddress);
    return NextResponse.json({ payment, storageMode: payment ? "database" : "unconfigured" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update agent payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
