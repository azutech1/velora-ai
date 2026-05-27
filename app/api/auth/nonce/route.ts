import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { createNonce } from "@/lib/auth/siwe";

const NONCE_COOKIE_PREFIX = "velora_nonce_";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "A valid wallet address is required." }, { status: 400 });
  }

  const nonce = createNonce();
  const response = NextResponse.json({ nonce });
  response.cookies.set(`${NONCE_COOKIE_PREFIX}${address.toLowerCase()}`, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10
  });
  return response;
}
