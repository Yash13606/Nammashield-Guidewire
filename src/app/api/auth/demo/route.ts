import { NextResponse } from "next/server";
import {
  createWorkerWithPhone,
  getWorkerByPhone,
  updateWorkerProfile,
} from "@/lib/db/repositories/workers";
import { getLatestActivePolicyForWorker, insertPolicy } from "@/lib/db/repositories/policiesRepository";

const ML_BASE = (process.env.ML_API_URL ?? process.env.NEXT_PUBLIC_ML_API_URL ?? "").replace(/\/$/, "");

async function demoRisk(city: string, zone: string, streakWeeks: number) {
  if (!ML_BASE) {
    return { risk_score: 67, tier: "Standard", weekly_premium: 100 };
  }

  try {
    const mlRes = await fetch(`${ML_BASE}/predict-risk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, zone, streak_weeks: streakWeeks }),
    });
    if (!mlRes.ok) {
      return { risk_score: 67, tier: "Standard", weekly_premium: 100 };
    }
    const ml = (await mlRes.json()) as {
      risk_score?: number;
      tier?: string;
      weekly_premium?: number;
    };
    return {
      risk_score: Number(ml.risk_score ?? 67),
      tier: ml.tier ?? "Standard",
      weekly_premium: Number(ml.weekly_premium ?? 100),
    };
  } catch {
    return { risk_score: 67, tier: "Standard", weekly_premium: 100 };
  }
}

export async function POST() {
  try {
    const demoPhone = "+91 00000 00000";
    const demoCity = "Chennai";
    const demoZone = "Zone 4 — T. Nagar";

    const existing = await getWorkerByPhone(demoPhone);
    const worker = existing ?? (await createWorkerWithPhone(demoPhone));
    if (!worker) throw new Error("Unable to create demo worker");

    const workerId = worker.id;
    await updateWorkerProfile(workerId, {
      name: "Demo Partner",
      city: demoCity,
      zone: demoZone,
      is_onboarded: true,
      streak_weeks: 3,
    });

    const existingPolicy = await getLatestActivePolicyForWorker(workerId);

    if (!existingPolicy) {
      const risk = await demoRisk(demoCity, demoZone, 3);
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      await insertPolicy({
        worker_id: workerId,
        tier: String(risk.tier),
        weekly_premium: Number(risk.weekly_premium),
        coverage_amount: Math.round(Number(risk.weekly_premium) * 7),
        risk_score: Number(risk.risk_score),
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
