import { NextRequest, NextResponse } from "next/server";
import { processClaimsForTrigger } from "@/lib/claims/claimsEngine";
import { createTriggerEvent } from "@/lib/db/repositories/triggersRepository";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      event_type?: string;
      city?: string;
      zone?: string;
      severity?: string;
      threshold_value?: number;
      duration_hours?: number;
    };

    const {
      event_type,
      city,
      zone,
      severity = "moderate",
      threshold_value = 0,
      duration_hours = 5,
    } = body;

    if (!event_type || !city || !zone) {
      return NextResponse.json(
        { error: "event_type, city, and zone are required" },
        { status: 400 }
      );
    }

    const started = new Date();
    const ended = new Date(
      started.getTime() + Math.max(0.5, duration_hours) * 60 * 60 * 1000
    );

    const trigger = await createTriggerEvent({
        event_type,
        city,
        zone,
        severity,
        threshold_value,
        started_at: started.toISOString(),
        ended_at: ended.toISOString(),
        source: "simulation",
        is_simulated: true,
      });

    if (!trigger) {
      return NextResponse.json({ error: "insert failed" }, { status: 500 });
    }

    const summary = await processClaimsForTrigger(trigger.id);

    return NextResponse.json({
      trigger,
      affected: summary.affected,
      total_payout: summary.total_payout,
      auto_approved: summary.auto_approved,
      watchlist: summary.watchlist,
      flagged: summary.flagged,
      rejected: summary.rejected,
      payout_failed: summary.payout_failed,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
