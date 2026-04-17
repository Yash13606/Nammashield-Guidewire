import { NextRequest, NextResponse } from "next/server";
import {
  getClaimStatus,
  rejectClaimByReviewer,
} from "@/lib/db/repositories/claimsRepository";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      claim_id?: string;
      claimId?: string;
      rejection_reason?: string;
    };
    const claim_id = body.claim_id ?? body.claimId;
    const { rejection_reason = "Rejected by reviewer" } = body;

    if (!claim_id) {
      return NextResponse.json({ error: "claim_id (or claimId) required" }, { status: 400 });
    }

    const claim = await getClaimStatus(claim_id);

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claim.status === "rejected") {
      return NextResponse.json({ ok: true, message: "Claim already rejected" });
    }

    if (claim.status === "auto_approved") {
      return NextResponse.json({ ok: true, message: "Claim already approved" });
    }

    if (claim.status !== "watchlist" && claim.status !== "flagged") {
      return NextResponse.json(
        { error: `Claim not in review queue (status=${claim.status})` },
        { status: 409 }
      );
    }

    await rejectClaimByReviewer(claim_id, rejection_reason);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
