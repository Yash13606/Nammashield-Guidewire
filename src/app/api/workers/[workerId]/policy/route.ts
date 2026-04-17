import { NextRequest, NextResponse } from "next/server";
import { updateActivePolicyForWorker } from "@/lib/db/repositories/policiesRepository";

type Params = { params: { workerId: string } | Promise<{ workerId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { workerId } = await params;
    const body = (await req.json()) as {
      tier?: string;
      weekly_premium?: number;
      coverage_amount?: number;
    };

    if (!body.tier || body.weekly_premium === undefined || body.coverage_amount === undefined) {
      return NextResponse.json(
        { error: "tier, weekly_premium, and coverage_amount are required" },
        { status: 400 }
      );
    }

    const updated = await updateActivePolicyForWorker(workerId, {
      tier: body.tier,
      weekly_premium: body.weekly_premium,
      coverage_amount: body.coverage_amount,
    });
    if (updated === 0) {
      return NextResponse.json({ error: "Active policy not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
