import { NextResponse } from "next/server";
import { GatewayClient, type SupportedChainName } from "@circle-fin/x402-batching/client";
import { isAddress, parseUnits, type Address, type Hex } from "viem";
import type { AgentPaymentExecutionLog, AgentPaymentExecutionRequest, AgentPaymentExecutionResult } from "@/lib/agent-payments/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createLog(level: AgentPaymentExecutionLog["level"], message: string, details?: string): AgentPaymentExecutionLog {
  return {
    id: `server_log_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    details
  };
}

function jsonFailure(error: string, logs: AgentPaymentExecutionLog[], status = 400) {
  const result: AgentPaymentExecutionResult = {
    status: "failed",
    error,
    logs: [...logs, createLog("error", error)]
  };
  return NextResponse.json(result, { status });
}

function isExecutionRequest(value: unknown): value is AgentPaymentExecutionRequest {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<AgentPaymentExecutionRequest>;
  return (
    typeof input.paymentId === "string" &&
    typeof input.agentName === "string" &&
    typeof input.serviceName === "string" &&
    typeof input.amount === "string" &&
    input.token === "USDC" &&
    typeof input.destination === "string" &&
    typeof input.network === "string" &&
    typeof input.rail === "string" &&
    (input.executionMode === "x402-resource" || input.executionMode === "gateway-transfer")
  );
}

function isEvmTransactionHash(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{64}$/.test(value));
}

export async function POST(request: Request) {
  const logs: AgentPaymentExecutionLog[] = [createLog("info", "Circle Gateway execution request received.")];
  const body = (await request.json().catch(() => null)) as unknown;

  if (!isExecutionRequest(body)) {
    return jsonFailure("Invalid agent payment execution payload.", logs);
  }

  if (!body.amount || Number(body.amount) <= 0) {
    return jsonFailure("Payment amount must be greater than zero USDC.", logs);
  }

  const privateKey = process.env.AGENT_PAYMENTS_PRIVATE_KEY;
  if (!privateKey || !/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    return jsonFailure("AGENT_PAYMENTS_PRIVATE_KEY is not configured with a valid EOA private key.", logs, 503);
  }

  const chain = (process.env.AGENT_PAYMENTS_GATEWAY_CHAIN || "arcTestnet") as SupportedChainName;
  const rpcUrl = process.env.AGENT_PAYMENTS_GATEWAY_RPC_URL || process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL;
  const amountAtomic = parseUnits(body.amount, 6);

  try {
    const gateway = new GatewayClient({
      chain,
      privateKey: privateKey as Hex,
      rpcUrl
    });

    logs.push(createLog("info", `Gateway client initialized for ${gateway.chainName}.`));

    const balancesBefore = await gateway.getBalances();
    logs.push(
      createLog(
        "info",
        "Gateway balance verified before execution.",
        `Gateway available: ${balancesBefore.gateway.formattedAvailable} USDC; wallet: ${balancesBefore.wallet.formatted} USDC.`
      )
    );

    if (balancesBefore.gateway.available < amountAtomic) {
      return jsonFailure(`Insufficient Gateway balance. Available ${balancesBefore.gateway.formattedAvailable} USDC, required ${body.amount} USDC.`, logs, 402);
    }

    if (body.executionMode === "gateway-transfer") {
      if (!isAddress(body.destination)) {
        return jsonFailure("Gateway transfer destination must be a valid EVM address.", logs);
      }

      logs.push(createLog("info", "Submitting Circle Gateway transfer.", `Recipient: ${body.destination}`));
      const transfer = await gateway.withdraw(body.amount, {
        chain,
        recipient: body.destination as Address
      });
      const balancesAfter = await gateway.getBalances();
      const txHash = transfer.mintTxHash;

      return NextResponse.json({
        status: "completed",
        txHash,
        transferId: txHash,
        gatewayBalanceBefore: balancesBefore.gateway.formattedAvailable,
        gatewayBalanceAfter: balancesAfter.gateway.formattedAvailable,
        walletBalance: balancesAfter.wallet.formatted,
        amountPaid: transfer.formattedAmount,
        logs: [...logs, createLog("success", "Circle Gateway transfer completed.", `Transaction: ${txHash}`)]
      } satisfies AgentPaymentExecutionResult);
    }

    if (!body.resourceUrl) {
      return jsonFailure("x402 resource URL is required for Arc Nanopayments execution.", logs);
    }

    logs.push(createLog("info", "Checking x402 Gateway batching support.", body.resourceUrl));
    const support = await gateway.supports(body.resourceUrl);
    if (!support.supported) {
      return jsonFailure(support.error || "The destination resource does not advertise Circle Gateway x402 batching support.", logs, 422);
    }

    logs.push(createLog("info", "Submitting x402 nanopayment through Circle Gateway.", body.resourceUrl));
    const payment = await gateway.pay(body.resourceUrl);
    const balancesAfter = await gateway.getBalances();
    const transaction = payment.transaction;

    return NextResponse.json({
      status: "completed",
      txHash: isEvmTransactionHash(transaction) ? transaction : undefined,
      transferId: transaction,
      gatewayBalanceBefore: balancesBefore.gateway.formattedAvailable,
      gatewayBalanceAfter: balancesAfter.gateway.formattedAvailable,
      walletBalance: balancesAfter.wallet.formatted,
      amountPaid: payment.formattedAmount,
      logs: [...logs, createLog("success", "Arc nanopayment completed through Circle Gateway.", `Gateway transaction: ${transaction}`)]
    } satisfies AgentPaymentExecutionResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Circle Gateway execution error.";
    return jsonFailure(message, logs, 500);
  }
}
