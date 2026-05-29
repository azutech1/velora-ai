# Velora AI Wallet and USDC Transaction Testing Guide

This guide verifies the real Arc Testnet wallet and USDC payment flow.

## Prerequisites

- Browser wallet installed, such as MetaMask.
- Wallet funded on Arc Testnet with test USDC from the Circle Faucet.
- Velora AI environment variables configured:
  - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
  - `NEXT_PUBLIC_ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network`
  - `NEXT_PUBLIC_ARC_TESTNET_EXPLORER_URL=https://testnet.arcscan.app`
  - `NEXT_PUBLIC_ARC_TESTNET_USDC_ADDRESS=0x3600000000000000000000000000000000000000`
- Arc Testnet details:
  - Chain ID: `5042002`
  - Native currency: `USDC`
  - Explorer: `https://testnet.arcscan.app`

## Local Setup

1. Install dependencies:
   ```powershell
   npm install
   ```
2. Start the app:
   ```powershell
   npm run dev
   ```
3. Open:
   ```text
   http://localhost:3000
   ```

## Wallet Connection

1. Open Velora AI.
2. Click `Connect Wallet`.
3. Select MetaMask or another supported wallet.
4. Approve the wallet connection.

Expected result:

- The top bar shows one Arc network badge.
- The wallet button shows the connected address.
- The sidebar wallet status shows the same address.

## Wallet Disconnection

1. Click the wallet address dropdown.
2. Select `Disconnect Wallet`.

Expected result:

- Wallet status returns to disconnected.
- Balance fields show `Connect wallet` or `No data available`.
- Protected transaction actions require reconnection.

## Network Switching

1. Connect while on any non-Arc network.
2. Open `Payments`.
3. Click `Switch to Arc Testnet`.
4. Approve the network switch in the wallet.

Expected result:

- The network badge shows `Arc Testnet`.
- Payment preview becomes available.
- If switching is rejected, Velora AI shows a clear error state.

## Balance Display

1. Connect a funded Arc Testnet wallet.
2. Open `Dashboard` and `Payments`.

Expected result:

- USDC balance is read from the Arc Testnet ERC-20 USDC contract.
- Unavailable RPC or unfunded wallets show a loading or empty state, never fake balances.

## USDC Payment Preview

1. Open `Payments`.
2. Enter a valid recipient EVM address.
3. Enter a positive USDC amount with no more than 6 decimal places.
4. Click `Preview Transaction`.

Expected result:

- Velora AI validates the recipient and amount.
- Velora AI estimates contract gas on Arc Testnet.
- A confirmation modal opens with sender, recipient, amount, network, and gas estimate.

Failure checks:

- Invalid address shows a validation error.
- Empty or zero amount is rejected.
- More than 6 decimals is rejected.
- Wrong network asks the user to switch to Arc.

## USDC Transaction Execution

1. Complete a valid preview.
2. Click `Confirm Transaction`.
3. Confirm in MetaMask.

Expected result:

- Velora AI enters a sending state while the wallet is open.
- After wallet submission, Velora AI tracks the transaction as pending.
- After Arc confirmation, Velora AI shows success.
- The transaction hash and ArcScan link are displayed.
- Activity records include `USDC send started` and `USDC send completed`.
- Wallet balance refreshes after confirmation.

## Error Handling

Test these cases:

- Reject the MetaMask signature or transaction.
- Send more USDC than the wallet balance.
- Disconnect wallet before preview.
- Switch away from Arc before sending.
- Temporarily use an invalid RPC URL in a preview environment.

Expected result:

- Velora AI shows a useful error message.
- Failed transactions are recorded in Activity.
- The app does not display fake success states.

## Production Verification

1. Add the same environment variables in Vercel for Production and Preview.
2. Redeploy the latest commit.
3. Open the production URL.
4. Repeat wallet connect, network switch, balance display, preview, and send tests.

Production pass criteria:

- Wallet connection works on the public domain.
- Arc Testnet switch works.
- Real USDC balance appears for a funded wallet.
- USDC transfer submits through the wallet.
- ArcScan confirms the transaction.
- Velora AI updates status and Activity after confirmation.

## Notes

- Arc Testnet USDC uses the ERC-20 interface at `0x3600000000000000000000000000000000000000` with 6 decimals for app balance and transfer logic.
- Arc native gas accounting can appear in USDC in wallets because Arc uses USDC as the native gas token.
- Testnet tokens have no real monetary value.
