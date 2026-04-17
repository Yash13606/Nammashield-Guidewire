import { NextRequest, NextResponse } from "next/server";
import { processClaimsForTrigger } from "@/lib/claims/claimsEngine";
import { createTriggerEvent } from "@/lib/db/repositories/triggersRepository";
import type { MockPayoutChannel } from "@/lib/payments/mockUpiGateway";

const ALLOWED_PAYOUT_CHANNELS: MockPayoutChannel[] = ["UPI_SIM", "RAZORPAY_TEST", "STRIPE_TEST"];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      event_type?: string;
      city?: string;
      zone?: string;
      severity?: string;
      threshold_value?: number;
      duration_hours?: number;
      payment_channel?: MockPayoutChannel;
    };

    const {
      event_type,
      city,
      zone,
      severity = "moderate",
      threshold_value = 0,
      duration_hours = 5,
      payment_channel = "UPI_SIM",
    } = body;

    if (!event_type || !city || !zone) {
      return NextResponse.json(
        { error: "event_type, city, and zone are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_PAYOUT_CHANNELS.includes(payment_channel)) {
      return NextResponse.json(
        { error: "payment_channel must be one of UPI_SIM, RAZORPAY_TEST, STRIPE_TEST" },
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

    const summary = await processClaimsForTrigger(trigger.id, {
      payoutChannel: payment_channel,
    });

    return NextResponse.json({
      trigger,
      workers_found: summary.affected,
      affected_workers: summary.affected,
      claims_created: summary.claims_created,
      city_fallback_used: summary.city_fallback_used,
      message:
        summary.affected === 0
          ? "No active workers/policies matched this simulation."
          : summary.city_fallback_used
            ? "No exact zone match found; used city-level worker fallback for simulation."
            : "Simulation completed with exact zone match.",
      affected: summary.affected,
      total_payout: summary.total_payout,
      auto_approved: summary.auto_approved,
      watchlist: summary.watchlist,
      flagged: summary.flagged,
      rejected: summary.rejected,
      payout_failed: summary.payout_failed,
      payment_simulation: summary.payout_simulation,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
