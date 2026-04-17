import { NextRequest, NextResponse } from "next/server";
import { insertPolicy } from "@/lib/db/repositories/policiesRepository";
import { setWorkerOnboarded } from "@/lib/db/repositories/workersRepository";

type Params = { params: { workerId: string } | Promise<{ workerId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { workerId } = await params;
    const body = (await req.json()) as {
      tier?: string;
      weeklyPremium?: number;
      coverageAmount?: number;
      riskScore?: number;
    };

    if (
      !body.tier ||
      body.weeklyPremium === undefined ||
      body.coverageAmount === undefined ||
      body.riskScore === undefined
    ) {
      return NextResponse.json(
        { error: "tier, weeklyPremium, coverageAmount, and riskScore are required" },
        { status: 400 }
      );
    }

    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    await insertPolicy({
      worker_id: workerId,
      tier: body.tier,
      weekly_premium: body.weeklyPremium,
      coverage_amount: body.coverageAmount,
      risk_score: body.riskScore,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
    });
    await setWorkerOnboarded(workerId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
