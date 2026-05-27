export type AuthUser = {
  walletAddress: string;
  chainId?: number | null;
  issuedAt: string;
  expiresAt: string;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
};

export type SiweMessageInput = {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: "1";
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
};
