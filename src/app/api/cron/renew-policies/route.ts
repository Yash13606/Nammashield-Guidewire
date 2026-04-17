import { NextResponse } from "next/server";
import {
  expirePolicy,
  insertPolicy,
  listPoliciesExpiringOn,
} from "@/lib/db/repositories/policiesRepository";
import { countClaimsByWorkerInWindow } from "@/lib/db/repositories/claimsRepository";
import {
  getWorkerRenewalDetails,
  updateWorkerStreakWeeks,
} from "@/lib/db/repositories/workers";

const ML_BASE = (process.env.ML_API_URL ?? process.env.NEXT_PUBLIC_ML_API_URL ?? "").replace(/\/$/, "");

async function mlRisk(city: string, zone: string, streakWeeks: number) {
  if (!ML_BASE) {
    return { risk_score: 45, tier: "Standard", weekly_premium: 100 };
  }
  const res = await fetch(`${ML_BASE}/ml/risk-score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city, zone, streak_weeks: streakWeeks }),
  });
  if (!res.ok) {
    return { risk_score: 45, tier: "Standard", weekly_premium: 100 };
  }
  return (await res.json()) as {
    risk_score: number;
    tier: string;
    weekly_premium: number;
  };
}

/** Daily cron — policies expiring today get renewed; streak updated from claim history */
export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const expiring = await listPoliciesExpiringOn(today);

    const results: Array<{ worker_id: string; renewed: boolean }> = [];

    for (const pol of expiring ?? []) {
      const worker = await getWorkerRenewalDetails(pol.worker_id);

      if (!worker?.city || !worker?.zone) {
        results.push({ worker_id: pol.worker_id, renewed: false });
        continue;
      }

      const claimCount = await countClaimsByWorkerInWindow(
        pol.worker_id,
        `${pol.start_date}T00:00:00`,
        `${pol.end_date}T23:59:59`
      );

      const hadClaims = (claimCount ?? 0) > 0;
      const nextStreak = hadClaims ? 0 : (worker.streak_weeks ?? 0) + 1;

      const risk = await mlRisk(worker.city, worker.zone, nextStreak);
      const coverageAmount = Math.round(Number(risk.weekly_premium) * 7);

      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      await expirePolicy(pol.id);
      await insertPolicy({
        worker_id: pol.worker_id,
        tier: risk.tier,
        weekly_premium: risk.weekly_premium,
        coverage_amount: coverageAmount,
        risk_score: risk.risk_score,
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
      });

      await updateWorkerStreakWeeks(pol.worker_id, nextStreak);

      results.push({ worker_id: pol.worker_id, renewed: true });
    }

    return NextResponse.json({ ok: true, renewed: results.length, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
