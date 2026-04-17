import { calculatePayout } from "./payoutCalc";
import { getClaimForPayoutComputation } from "@/lib/db/repositories/claimsRepository";
import { getPolicyForPayout } from "@/lib/db/repositories/policiesRepository";
import { getTriggerEventById } from "@/lib/db/repositories/triggersRepository";
import { getWorkerCity } from "@/lib/db/repositories/workersRepository";

/** Recompute payout for manual approval of watchlist/flagged claims */
export async function computeApprovalPayout(claimId: string): Promise<number> {
  const claim = await getClaimForPayoutComputation(claimId);
  if (!claim) throw new Error("Claim not found");

  const [policy, ev, worker] = await Promise.all([
    getPolicyForPayout(claim.policy_id),
    getTriggerEventById(claim.trigger_event_id),
    getWorkerCity(claim.worker_id),
  ]);

  if (!policy || !ev || !worker?.city) throw new Error("Missing relations");

  const start = new Date(ev.started_at).getTime();
  const end = ev.ended_at
    ? new Date(ev.ended_at).getTime()
    : Date.now();
  const totalDisruptionHours = Math.max(
    0.25,
    (end - start) / (1000 * 60 * 60)
  );

  const { finalPayout } = calculatePayout({
    totalDisruptionHours,
    city: worker.city,
    tier: policy.tier,
    weeklyPremium: Number(policy.weekly_premium),
  });

  return finalPayout;
}
