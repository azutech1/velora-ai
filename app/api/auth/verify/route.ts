import { NextResponse } from "next/server";
import { isAddress, verifyMessage } from "viem";
import { authCookieOptions, AUTH_COOKIE_NAME, createSessionToken } from "@/lib/auth/session";
import { parseSiweMessage, SIWE_SESSION_TTL_MS } from "@/lib/auth/siwe";
import type { AuthUser } from "@/lib/auth/types";

const NONCE_COOKIE_PREFIX = "velora_nonce_";

type VerifyBody = {
  message?: string;
  signature?: `0x${string}`;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as VerifyBody | null;
  if (!body?.message || !body.signature) {
    return NextResponse.json({ error: "SIWE message and signature are required." }, { status: 400 });
  }

  const parsed = parseSiweMessage(body.message);
  if (!parsed.address || !isAddress(parsed.address)) {
    return NextResponse.json({ error: "SIWE message contains an invalid wallet address." }, { status: 400 });
  }

  if (!parsed.expirationTime || new Date(parsed.expirationTime).getTime() <= Date.now()) {
    return NextResponse.json({ error: "SIWE message has expired." }, { status: 401 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const nonceCookieName = `${NONCE_COOKIE_PREFIX}${parsed.address.toLowerCase()}`;
  const expectedNonce = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${nonceCookieName}=`))
    ?.split("=")[1];

  if (!expectedNonce || expectedNonce !== parsed.nonce) {
    return NextResponse.json({ error: "Auth nonce is missing or expired. Please try signing in again." }, { status: 401 });
  }

  const validSignature = await verifyMessage({
    address: parsed.address,
    message: body.message,
    signature: body.signature
  });

  if (!validSignature) {
    return NextResponse.json({ error: "Wallet signature verification failed." }, { status: 401 });
  }

  const now = new Date();
  const user: AuthUser = {
    walletAddress: parsed.address,
    chainId: parsed.chainId,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SIWE_SESSION_TTL_MS).toISOString()
  };
  const token = createSessionToken(user);
  const response = NextResponse.json({ user });
  response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions(SIWE_SESSION_TTL_MS / 1000));
  response.cookies.delete(nonceCookieName);
  return response;
}
