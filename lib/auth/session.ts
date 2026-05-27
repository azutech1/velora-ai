import { createHmac, timingSafeEqual } from "crypto";
import type { AuthSession, AuthUser } from "./types";

export const AUTH_COOKIE_NAME = "velora_session";
const DEFAULT_AUTH_SECRET = "velora-ai-local-dev-secret-change-before-production";

function getAuthSecret() {
  return process.env.VELORA_AUTH_SECRET || DEFAULT_AUTH_SECRET;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

export function createSessionToken(user: AuthUser) {
  const payload = base64UrlEncode(JSON.stringify(user));
  return `${payload}.${signPayload(payload)}`;
}

export function parseSessionToken(token?: string | null): AuthSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = signPayload(payload);
  const signatureBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (signatureBytes.length !== expectedBytes.length || !timingSafeEqual(signatureBytes, expectedBytes)) {
    return null;
  }

  try {
    const user = JSON.parse(base64UrlDecode(payload)) as AuthUser;
    if (new Date(user.expiresAt).getTime() <= Date.now()) return null;
    return { user, token };
  } catch {
    return null;
  }
}

export function authCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds
  };
}
