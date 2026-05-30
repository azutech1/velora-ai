import { NextResponse } from "next/server";
import { GatewayClient, type SupportedChainName } from "@circle-fin/x402-batching/client";
import { type Hex } from "viem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GatewayAction = "deposit" | "withdraw";

function normalizePrivateKey(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}

function createGatewayClient() {
  const privateKey = normalizePrivateKey(process.env.AGENT_PAYMENTS_PRIVATE_KEY);
  if (!privateKey || !/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    throw new Error("AGENT_PAYMENTS_PRIVATE_KEY must be a valid EOA private key: 64 hex characters, with or without 0x.");
  }

  return new GatewayClient({
    chain: (process.env.AGENT_PAYMENTS_GATEWAY_CHAIN || "arcTestnet") as SupportedChainName,
    privateKey: privateKey as Hex,
    rpcUrl: process.env.AGENT_PAYMENTS_GATEWAY_RPC_URL || process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL
  });
}

async function readBalances() {
  const gateway = createGatewayClient();
  const balances = await gateway.getBalances();
  return {
    address: gateway.address,
    chain: gateway.chainName,
    wallet: {
      balance: balances.wallet.balance.toString(),
      formatted: balances.wallet.formatted
    },
    gateway: {
      total: balances.gateway.total.toString(),
      available: balances.gateway.available.toString(),
      withdrawing: balances.gateway.withdrawing.toString(),
      withdrawable: balances.gateway.withdrawable.toString(),
      formattedTotal: balances.gateway.formattedTotal,
      formattedAvailable: balances.gateway.formattedAvailable,
      formattedWithdrawing: balances.gateway.formattedWithdrawing,
      formattedWithdrawable: balances.gateway.formattedWithdrawable
    }
  };
}

function parseGatewayAction(value: unknown): value is GatewayAction {
  return value === "deposit" || value === "withdraw";
}

export async function GET() {
  try {
    return NextResponse.json({ balances: await readBalances() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read Circle Gateway balances.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { action?: unknown; amount?: unknown } | null;

  if (!body || !parseGatewayAction(body.action)) {
    return NextResponse.json({ error: "Gateway action must be deposit or withdraw." }, { status: 400 });
  }

  if (typeof body.amount !== "string" || !body.amount.trim() || Number(body.amount) <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero USDC." }, { status: 400 });
  }

  try {
    const gateway = createGatewayClient();
    if (body.action === "deposit") {
      const deposit = await gateway.deposit(body.amount.trim());
      return NextResponse.json({
        action: body.action,
        result: {
          approvalTxHash: deposit.approvalTxHash,
          depositTxHash: deposit.depositTxHash,
          amount: deposit.amount.toString(),
          formattedAmount: deposit.formattedAmount,
          depositor: deposit.depositor
        },
        balances: await readBalances()
      });
    }

    const withdrawal = await gateway.withdraw(body.amount.trim());
    return NextResponse.json({
      action: body.action,
      result: {
        mintTxHash: withdrawal.mintTxHash,
        amount: withdrawal.amount.toString(),
        formattedAmount: withdrawal.formattedAmount,
        sourceChain: withdrawal.sourceChain,
        destinationChain: withdrawal.destinationChain,
        recipient: withdrawal.recipient
      },
      balances: await readBalances()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Circle Gateway funding action failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
