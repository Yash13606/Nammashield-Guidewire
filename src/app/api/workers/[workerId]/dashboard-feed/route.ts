import { NextRequest, NextResponse } from "next/server";
import {
  listClaimsForWorker,
  sumPayoutAmountsForWorker,
  sumPayoutAmountsForWorkerPolicy,
} from "@/lib/db/repositories/claimsRepository";
import { listRecentTriggersByCity } from "@/lib/db/repositories/triggersRepository";

type Params = { params: { workerId: string } | Promise<{ workerId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { workerId } = await params;
    const city = req.nextUrl.searchParams.get("city");
    const policyId = req.nextUrl.searchParams.get("policy_id");

    if (!city) {
      return NextResponse.json({ error: "city query param required" }, { status: 400 });
    }

    const [triggers, recentClaims, lifetimeProtected] = await Promise.all([
      listRecentTriggersByCity(city, 5),
      listClaimsForWorker({
        workerId,
        limit: 5,
      }),
      sumPayoutAmountsForWorker(workerId),
    ]);

    let coverageUsed = 0;
    if (policyId) {
      coverageUsed = await sumPayoutAmountsForWorkerPolicy(workerId, policyId);
    }

    return NextResponse.json({
      triggers: triggers ?? [],
      recentClaims: (recentClaims ?? []).map((row) => ({
        id: row.id,
        created_at: row.created_at,
        payout_amount: row.payout_amount,
        status: row.status,
        trigger_events: row.trigger_event_type ? { event_type: row.trigger_event_type } : null,
      })),
      coverageUsed,
      lifetimeProtected,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
