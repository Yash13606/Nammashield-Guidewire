import { NextRequest, NextResponse } from "next/server";
import { listClaimsForWorker } from "@/lib/db/repositories/claimsRepository";

type Params = { params: { workerId: string } | Promise<{ workerId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { workerId } = await params;
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? "0");
    const since = req.nextUrl.searchParams.get("since");
    const status = req.nextUrl.searchParams.get("status");

    const data = await listClaimsForWorker({
      workerId,
      since,
      status,
      limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    });

    return NextResponse.json({
      claims: (data ?? []).map((row) => ({
        id: row.id,
        created_at: row.created_at,
        payout_amount: row.payout_amount,
        status: row.status,
        payout_status: row.payout_status,
        payout_channel: row.payout_channel,
        payout_processed_at: row.payout_processed_at,
        payout_failure_reason: row.payout_failure_reason,
        covered_hours: row.covered_hours,
        active_score: row.active_score,
        fraud_score: row.fraud_score,
        trigger_events: row.trigger_event_type ? { event_type: row.trigger_event_type } : null,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
