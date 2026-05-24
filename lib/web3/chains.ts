import { ARC_TESTNET, arcTestnetChain, isArcTestnetConfigReady } from "./arc";

export const ARC_CHAIN_ID = ARC_TESTNET.id;
export const ARC_RPC_URL = ARC_TESTNET.rpcUrl;
export const ARC_EXPLORER_URL = ARC_TESTNET.explorerUrl;
export const ARC_USDC_ADDRESS = ARC_TESTNET.usdcAddress;

export const arcTestnet = arcTestnetChain;
export const arcNetwork = arcTestnetChain;

export function hasLiveArcConfig() {
  return isArcTestnetConfigReady();
}
