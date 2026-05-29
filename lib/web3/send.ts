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

  const trimmedAmount = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmedAmount)) {
    return { valid: false, reason: "Enter a valid decimal USDC amount." };
  }

  const numericAmount = Number(trimmedAmount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return { valid: false, reason: "Enter a USDC amount greater than zero." };
  }

  const decimalPart = trimmedAmount.split(".")[1];
  if (decimalPart && decimalPart.length > USDC_DECIMALS) {
    return { valid: false, reason: `USDC supports up to ${USDC_DECIMALS} decimal places.` };
  }

  try {
    return {
      valid: true,
      recipient,
      amountUnits: parseUnits(trimmedAmount, USDC_DECIMALS)
    };
  } catch {
    return { valid: false, reason: "Unable to parse this USDC amount." };
  }
}

export function createUSDCSendContractRequest(recipient: Address, amount: string) {
  const trimmedAmount = amount.trim();

  return {
    chainId: ARC_CHAIN_ID,
    address: USDC_CONTRACT_ADDRESS,
    abi: erc20UsdcAbi,
    functionName: "transfer",
    args: [recipient, parseUnits(trimmedAmount, USDC_DECIMALS)]
  } as const;
}
