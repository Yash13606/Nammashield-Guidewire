import { NextResponse } from "next/server";
import {
  createWorkerWithPhone,
  getWorkerByPhone,
  updateWorkerProfile,
} from "@/lib/db/repositories/workersRepository";
import { getLatestActivePolicyForWorker, insertPolicy } from "@/lib/db/repositories/policiesRepository";
import { getRiskQuote } from "@/lib/risk/riskQuote";

export async function POST() {
  try {
    const demoPhone = "+91 00000 00000";
    const demoCity = "Chennai";
    const demoZone = "Zone 3 - T Nagar";

    const existing = await getWorkerByPhone(demoPhone);
    const worker = existing ?? (await createWorkerWithPhone(demoPhone));
    if (!worker) throw new Error("Unable to create demo worker");

    const workerId = worker.id;
    await updateWorkerProfile(workerId, {
      name: "Ravi Kumar (Demo)",
      partner_id: "SWG-DEMO-65420",
      city: demoCity,
      zone: demoZone,
      is_onboarded: true,
      streak_weeks: 3,
    });

    const existingPolicy = await getLatestActivePolicyForWorker(workerId);

    if (!existingPolicy) {
      const quote = await getRiskQuote({
        city: demoCity,
        zone: demoZone,
        streakWeeks: 3,
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
    }

    return NextResponse.json({
      workerId,
      phone: worker.phone,
      isOnboarded: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
