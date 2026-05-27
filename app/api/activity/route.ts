import { NextResponse } from "next/server";
import type { ActivityInput } from "@/lib/activity/types";
import { listActivitiesFromDatabase, saveActivityToDatabase } from "@/lib/supabase/helpers";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Wallet authentication is required." }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? "0"), 0);
  const activities = await listActivitiesFromDatabase(user.walletAddress, limit, offset);
  return NextResponse.json({ activities: activities ?? [], storageMode: activities ? "database" : "unconfigured" });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Wallet authentication is required." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as ActivityInput | null;
  if (!body?.actionType || !body.feature || !body.title || !body.description || !body.status) {
    return NextResponse.json({ error: "Invalid activity payload." }, { status: 400 });
  }

  const activity = await saveActivityToDatabase(body, user.walletAddress);
  return NextResponse.json({ activity, storageMode: activity ? "database" : "unconfigured" });
}
