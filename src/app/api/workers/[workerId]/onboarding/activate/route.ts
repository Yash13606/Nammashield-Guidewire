import { NextRequest, NextResponse } from "next/server";
import { insertPolicy } from "@/lib/db/repositories/policiesRepository";
import {
  getWorkerRenewalDetails,
  setWorkerOnboarded,
} from "@/lib/db/repositories/workersRepository";
import { getRiskQuote } from "@/lib/risk/riskQuote";

type Params = { params: { workerId: string } | Promise<{ workerId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
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
        { error: "Worker city and zone are required before policy activation" },
        { status: 400 }
      );
    }

    const quote = await getRiskQuote({
      city: worker.city,
      zone: worker.zone,
      streakWeeks: worker.streak_weeks ?? 0,
      preferredTier: body.tier,
    });

    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    await insertPolicy({
      worker_id: workerId,
      tier: quote.tier,
      weekly_premium: quote.weekly_premium,
      coverage_amount: quote.coverage_amount,
      risk_score: quote.risk_score,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
    });
    await setWorkerOnboarded(workerId);

    return NextResponse.json({ ok: true, quote });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
