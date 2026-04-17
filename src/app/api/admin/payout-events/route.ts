import { NextRequest, NextResponse } from "next/server";
import { listPayoutTransactionsSince } from "@/lib/db/repositories/payoutRepository";

export async function GET(req: NextRequest) {
  try {
    const since = req.nextUrl.searchParams.get("since") ?? new Date(0).toISOString();
    const limitRaw = Number(req.nextUrl.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 20;

    const events = await listPayoutTransactionsSince({ since, limit });

    return NextResponse.json({ events: events ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
