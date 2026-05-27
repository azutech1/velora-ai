import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "velora_session";
const PROTECTED_API_PREFIXES = ["/api/activity", "/api/rewards", "/api/faucet/claims", "/api/settings"];

export function middleware(request: NextRequest) {
  const isProtectedApi = PROTECTED_API_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  if (!isProtectedApi) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (!hasSession) {
    return NextResponse.json({ error: "Wallet authentication is required." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"]
};
