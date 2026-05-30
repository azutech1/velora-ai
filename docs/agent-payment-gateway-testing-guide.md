# Velora AI Agent Payment Gateway Testing Guide

This guide verifies the Agent Payments approval flow, Circle Gateway balance checks, Arc Nanopayments execution, transaction tracking, logs, and retry behavior.

## Required Environment

Set these server-side environment variables before testing real execution:

```bash
AGENT_PAYMENTS_PRIVATE_KEY=0x...
AGENT_PAYMENTS_GATEWAY_CHAIN=arcTestnet
AGENT_PAYMENTS_GATEWAY_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_TESTNET_EXPLORER_URL=https://testnet.arcscan.app
```

Use an EOA private key only. Circle Gateway nanopayments require EOA signatures for x402 payment authorizations. Do not expose this key to the browser or commit it to Git.

## Funding Checklist

1. Fund the execution wallet with testnet USDC.
2. Fund the wallet with enough native gas for the one-time Gateway deposit or Gateway withdrawal transaction.
3. Deposit USDC into the Circle Gateway Wallet for `arcTestnet`.
4. Confirm Gateway available balance is greater than the approval amount.

## Manual UI Flow

1. Start the app:

```bash
npm.cmd run dev
```

2. Open `/agent-payments`.
3. Confirm the page shows no fake balances or fake payment history.
4. Confirm the Pending Approvals section shows an empty state when no real requests exist.
5. Open `/agents`.
6. Click `Open agent` on `Payment Agent`.
7. In the Payment Agent workspace, click through each payment type:
   - One-time payment
   - Recurring payment
   - Scheduled payment
8. Create a payment request with:
   - Recipient Name
   - Wallet Address
   - Amount (USDC)
   - Payment Type
   - Description
   - Schedule Date for scheduled payments
9. Confirm a unique Payment ID is generated.
10. Open `/agent-payments`.
11. Confirm the new request appears in Pending Approvals and includes:
   - Payment ID
   - Agent Name
   - Service Name
   - Amount in USDC
   - Destination
   - Timestamp
   - Status
12. Open `/activity`.
13. Confirm the request creation appears as a pending activity entry.
14. Return to `/agent-payments` and click Approve.
15. Confirm the lifecycle moves through:
   - Pending
   - Approved
   - Executing
   - Completed or Failed
16. Confirm Activity records an approval entry and a completion or failure entry.
17. If a transaction hash is returned, open the explorer link and verify the transaction.

## x402 / Arc Nanopayment Test

Use a real x402-protected resource URL that advertises Circle Gateway batching support.

Expected behavior:

1. The server initializes `GatewayClient`.
2. The server calls `getBalances()` and verifies Gateway available USDC.
3. The server calls `supports(resourceUrl)`.
4. The server calls `pay(resourceUrl)`.
5. The UI stores the returned Gateway transaction reference or EVM transaction hash.
6. Execution logs are visible in Recent Agent Payments.

Failure cases to verify:

1. Missing `AGENT_PAYMENTS_PRIVATE_KEY` returns a failed payment with a clear configuration error.
2. Insufficient Gateway balance returns a failed payment before execution.
3. A resource URL without Circle Gateway x402 batching support fails before payment signing.
4. Retry keeps the original approval and increments the retry count.

## Circle Gateway Transfer Test

Use a real approval request with:

```json
{
  "executionMode": "gateway-transfer",
  "token": "USDC",
  "network": "Arc Testnet",
  "destination": "0xRecipientAddress"
}
```

Expected behavior:

1. The server verifies Gateway available USDC.
2. The server calls `withdraw(amount, { chain, recipient })`.
3. The returned `mintTxHash` is stored as the transaction hash.
4. The UI renders a real explorer link when the hash is an EVM transaction hash.

## Production Readiness Checks

Run before deployment:

```bash
npm.cmd run lint
npm.cmd run build
```

Only deploy after both commands pass. Real payment execution should remain disabled in production until the execution wallet is funded, monitored, and protected by operational key management.
