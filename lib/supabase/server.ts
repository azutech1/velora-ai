import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseSessionToken } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return parseSessionToken(token)?.user ?? null;
}

export function requireAuthenticatedUser(user: AuthUser | null) {
  if (!user) {
    throw new Error("Wallet authentication is required.");
  }
  return user;
}
