import { NextRequest, NextResponse } from "next/server";
import { updateActivePolicyForWorker } from "@/lib/db/repositories/policiesRepository";
import { getWorkerRenewalDetails } from "@/lib/db/repositories/workersRepository";
import { getRiskQuote } from "@/lib/risk/riskQuote";

type Params = { params: { workerId: string } | Promise<{ workerId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { workerId } = await params;
    const body = (await req.json()) as {
      tier?: string;
    };

    if (!body.tier) {
      return NextResponse.json(
        { error: "tier is required" },
        { status: 400 }
      );
    }

    const worker = await getWorkerRenewalDetails(workerId);
    if (!worker?.city || !worker?.zone) {
      return NextResponse.json(
        { error: "Worker city and zone are required for policy repricing" },
        { status: 400 }
      );
    }

    const quote = await getRiskQuote({
      city: worker.city,
      zone: worker.zone,
      streakWeeks: worker.streak_weeks ?? 0,
      preferredTier: body.tier,
    });

    const updated = await updateActivePolicyForWorker(workerId, {
      tier: quote.tier,
      weekly_premium: quote.weekly_premium,
      coverage_amount: quote.coverage_amount,
    });
    if (updated === 0) {
      return NextResponse.json({ error: "Active policy not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, quote });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
