import { encodeFunctionData, type Address } from "viem";
import { erc20UsdcAbi, USDC_CONTRACT_ADDRESS } from "@/lib/contracts/usdc";
import { createUSDCSendContractRequest, validateUSDCSend } from "./send";
import { ARC_CHAIN_ID, hasLiveArcConfig } from "./chains";

export type PreparedUSDCSend =
  | {
      ready: true;
      chainId: number;
      to: Address;
      contractAddress: Address;
      amountUnits: bigint;
      data: `0x${string}`;
    }
  | {
      ready: false;
      reason: string;
    };

export function prepareSendUSDC(recipient: string, amount: string): PreparedUSDCSend {
  const validation = validateUSDCSend(recipient, amount);
  if (!validation.valid) {
    return { ready: false, reason: validation.reason };
  }

  if (!hasLiveArcConfig()) {
    return {
      ready: false,
      reason: "Arc Testnet config is not ready. Verify chain, RPC, explorer, and USDC values in lib/web3/chains.ts."
    };
  }

  const data = encodeFunctionData({
    abi: erc20UsdcAbi,
    functionName: "transfer",
    args: [validation.recipient, validation.amountUnits]
  });

  return {
    ready: true,
    chainId: ARC_CHAIN_ID,
    to: USDC_CONTRACT_ADDRESS,
    contractAddress: USDC_CONTRACT_ADDRESS,
    amountUnits: validation.amountUnits,
    data
  };
}

export function createSendUSDCRequest(recipient: Address, amount: string) {
  return createUSDCSendContractRequest(recipient, amount);
}
