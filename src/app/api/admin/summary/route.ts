import { NextResponse } from "next/server";
import {
  countActivePolicies,
  getActivePoliciesForZoneLoss,
  getActivePolicyWorkerIds,
  sumActiveWeeklyPremiums,
} from "@/lib/db/repositories/policiesRepository";
import { listAllPayoutRows, sumTotalPayouts } from "@/lib/db/repositories/payoutRepository";
import {
  getTriggerTypesFrequencyRows,
  listRecentTriggers,
} from "@/lib/db/repositories/triggersRepository";
import { countClaimsByTrigger } from "@/lib/db/repositories/claimsRepository";
import { getWorkersCityZoneByIds } from "@/lib/db/repositories/workersRepository";
import { listRecentFraudCases } from "@/lib/db/repositories/fraudRepository";
import { getWeatherObservationsSince } from "@/lib/db/repositories/weatherRepository";

export async function GET() {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const activePolicyWorkerIds = await getActivePolicyWorkerIds();
    const activeWorkers = new Set(activePolicyWorkerIds).size;
    const activePolicies = await countActivePolicies();
    const weeklyPremiums = await sumActiveWeeklyPremiums();
    const totalPayouts = await sumTotalPayouts();

    const lossRatio = weeklyPremiums > 0 ? (totalPayouts / weeklyPremiums) * 100 : 0;

    const recentTriggers = await listRecentTriggers(10);
    const triggersWithCounts = await Promise.all(
      recentTriggers.map(async (trigger) => ({
        ...trigger,
        claim_count: await countClaimsByTrigger(trigger.id),
      }))
    );

    const triggerFreq = await getTriggerTypesFrequencyRows();
    const freqMap: Record<string, number> = {};
    for (const row of triggerFreq) {
      const key = row.event_type ?? "unknown";
      freqMap[key] = (freqMap[key] ?? 0) + 1;
    }

    const zonePolicies = await getActivePoliciesForZoneLoss();
    const zoneWorkerIds = [...new Set(zonePolicies.map((p) => p.worker_id))];
    const zoneWorkers = await getWorkersCityZoneByIds(zoneWorkerIds);
    const workerZoneMap = Object.fromEntries(
      zoneWorkers.map((worker) => [worker.id, `${worker.city} · ${worker.zone}`])
    );

    const premiumByZone: Record<string, number> = {};
    for (const policy of zonePolicies) {
      const key = workerZoneMap[policy.worker_id] ?? "Unknown";
      premiumByZone[key] = (premiumByZone[key] ?? 0) + Number(policy.weekly_premium ?? 0);
    }

    const payoutRows = await listAllPayoutRows();
    const payoutByZone: Record<string, number> = {};
    for (const row of payoutRows) {
      const key = workerZoneMap[row.worker_id] ?? "Unknown";
      payoutByZone[key] = (payoutByZone[key] ?? 0) + Number(row.amount ?? 0);
    }

    const zoneLossRatios = Object.keys({ ...premiumByZone, ...payoutByZone }).map((zoneName) => {
      const premiums = premiumByZone[zoneName] ?? 0;
      const payouts = payoutByZone[zoneName] ?? 0;
      const ratio = premiums > 0 ? (payouts / premiums) * 100 : 0;
      return {
        zone: zoneName,
        premiums,
        payouts,
        lossRatio: Math.round(ratio * 10) / 10,
      };
    });

    const fraudCases = await listRecentFraudCases(20);
    const weatherRows = await getWeatherObservationsSince(weekAgo.toISOString());

    const forecastMap: Record<
      string,
      { city: string; zone: string; expected_disruption_risk: number; expected_claim_load: number }
    > = {};

    for (const row of weatherRows) {
      const key = `${row.city}|${row.zone}`;
      if (!forecastMap[key]) {
        forecastMap[key] = {
          city: row.city,
          zone: row.zone,
          expected_disruption_risk: 0,
          expected_claim_load: 0,
        };
      }
      const rain = Number(row.rain_mm ?? 0);
      forecastMap[key].expected_disruption_risk += Math.min(100, rain * 3);
      forecastMap[key].expected_claim_load += rain > 10 ? 3 : rain > 2 ? 1 : 0.25;
    }

    const predictiveForecast = Object.values(forecastMap)
      .map((row) => ({
        ...row,
        expected_disruption_risk: Math.min(
          100,
          Math.round((row.expected_disruption_risk / 5) * 10) / 10
        ),
        expected_claim_load: Math.round(row.expected_claim_load * 10) / 10,
      }))
      .sort((a, b) => b.expected_disruption_risk - a.expected_disruption_risk)
      .slice(0, 6);

    return NextResponse.json({
      activeWorkers,
      activePolicies,
      weeklyPremiums,
      totalPayouts,
      lossRatio: Math.round(lossRatio * 10) / 10,
      recentTriggers: triggersWithCounts,
      triggerFrequency: Object.entries(freqMap).map(([name, value]) => ({ name, value })),
      zoneLossRatios,
      predictiveForecast,
      flaggedFraudCases: fraudCases,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
