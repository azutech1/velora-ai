import { isAddress, parseUnits, type Address } from "viem";
import { erc20UsdcAbi, USDC_CONTRACT_ADDRESS, USDC_DECIMALS } from "@/lib/contracts/usdc";
import { ARC_CHAIN_ID } from "./chains";

export type SendValidationResult =
  | {
      valid: true;
      recipient: Address;
      amountUnits: bigint;
    }
  | {
      valid: false;
      reason: string;
    };

export function validateUSDCSend(recipient: string, amount: string): SendValidationResult {
  if (!isAddress(recipient)) {
    return { valid: false, reason: "Enter a valid EVM recipient address." };
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return { valid: false, reason: "Enter a USDC amount greater than zero." };
  }

  return {
    valid: true,
    recipient,
    amountUnits: parseUnits(amount, USDC_DECIMALS)
  };
}

export function createUSDCSendContractRequest(recipient: Address, amount: string) {
  return {
    chainId: ARC_CHAIN_ID,
    address: USDC_CONTRACT_ADDRESS,
    abi: erc20UsdcAbi,
    functionName: "transfer",
    args: [recipient, parseUnits(amount, USDC_DECIMALS)]
  } as const;
}
