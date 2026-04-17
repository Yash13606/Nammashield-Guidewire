import { NextRequest, NextResponse } from "next/server";
import { computeApprovalPayout } from "@/lib/claims/approvePayout";
import { processPayoutForClaim } from "@/lib/payments/payoutProcessor";
import {
  getClaimForApproval,
  setClaimManualProcessing,
} from "@/lib/db/repositories/claimsRepository";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { claim_id?: string };
    const claimId = body.claim_id;
    if (!claimId) {
      return NextResponse.json({ error: "claim_id required" }, { status: 400 });
    }

    const claim = await getClaimForApproval(claimId);
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claim.status !== "watchlist" && claim.status !== "flagged") {
      return NextResponse.json(
        { error: "Claim not in review queue" },
        { status: 400 }
      );
    }

    const payoutAmount = await computeApprovalPayout(claimId);

    await setClaimManualProcessing(claimId);

    const payout = await processPayoutForClaim({
      claimId,
      workerId: claim.worker_id,
      amount: payoutAmount,
    });

    if (!payout.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: payout.failureMessage,
          failure_code: payout.failureCode,
          payout_status: "failed",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      payout_amount: payoutAmount,
      channel: payout.channel,
      processed_at: payout.processedAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
