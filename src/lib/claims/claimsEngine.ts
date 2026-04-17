import { calculateActiveScore } from "./activeScore";
import { calculatePayout } from "./payoutCalc";
import { evaluateClaimFraud } from "@/lib/fraud/anomalyScoring";
import { processPayoutForClaim } from "@/lib/payments/payoutProcessor";
import { getTriggerEventById } from "@/lib/db/repositories/triggersRepository";
import { getWorkersByCityZone } from "@/lib/db/repositories/workersRepository";
import { getActivePoliciesByWorkerIds } from "@/lib/db/repositories/policiesRepository";
import {
  claimExistsForWorkerPolicyTrigger,
  createClaim,
} from "@/lib/db/repositories/claimsRepository";
import { insertFraudAuditLogs } from "@/lib/db/repositories/fraudRepository";

export type ClaimsSummary = {
  affected: number;
  total_payout: number;
  auto_approved: number;
  watchlist: number;
  flagged: number;
  rejected: number;
  payout_failed: number;
};

export async function processClaimsForTrigger(
  triggerEventId: string
): Promise<ClaimsSummary> {
  const ev = await getTriggerEventById(triggerEventId);
  if (!ev) {
    throw new Error("Trigger event not found");
  }

  const start = new Date(ev.started_at).getTime();
  const end = ev.ended_at
    ? new Date(ev.ended_at).getTime()
    : Date.now();
  const totalDisruptionHours = Math.max(
    0.25,
    (end - start) / (1000 * 60 * 60)
  );

  const workers = await getWorkersByCityZone(ev.city, ev.zone);
  if (!workers.length) {
    return {
      affected: 0,
      total_payout: 0,
      auto_approved: 0,
      watchlist: 0,
      flagged: 0,
      rejected: 0,
      payout_failed: 0,
    };
  }

  const workerIds = workers.map((w) => w.id);
  const policies = await getActivePoliciesByWorkerIds(workerIds);
  if (!policies.length) {
    return {
      affected: 0,
      total_payout: 0,
      auto_approved: 0,
      watchlist: 0,
      flagged: 0,
      rejected: 0,
      payout_failed: 0,
    };
  }

  let total_payout = 0;
  let auto_approved = 0;
  let watchlist = 0;
  let flagged = 0;
  let rejected = 0;
  let payout_failed = 0;

  for (const pol of policies) {
    const workerId = pol.worker_id as string;
    const alreadyExists = await claimExistsForWorkerPolicyTrigger({
      workerId,
      policyId: pol.id,
      triggerEventId,
    });
    if (alreadyExists) {
      continue;
    }

    const worker = workers.find((w) => w.id === workerId);
    const city = worker?.city || ev.city;

    const activeScore = await calculateActiveScore(workerId, triggerEventId);
    const fraudEval = await evaluateClaimFraud({
      workerId,
      city: ev.city,
      zone: ev.zone,
      eventType: ev.event_type,
      triggerStartAt: ev.started_at,
      triggerEndAt: ev.ended_at,
      activeScore,
    });
    const fraudScore = fraudEval.fraudScore;

    const { finalPayout, coveredHours } = calculatePayout({
      totalDisruptionHours,
      city,
      tier: pol.tier as string,
      weeklyPremium: Number(pol.weekly_premium),
    });

    let status: string;
    let rejectionReason: string | null = null;
    if (activeScore < 0.35) {
      status = "rejected";
      rejected += 1;
      rejectionReason = "Active score below threshold (0.35)";
    } else if (fraudEval.decision === "auto_approved") {
      status = "auto_approved";
      auto_approved += 1;
    } else if (fraudEval.decision === "watchlist") {
      status = "watchlist";
      watchlist += 1;
    } else if (fraudEval.decision === "flagged") {
      status = "flagged";
      flagged += 1;
    } else {
      status = "rejected";
      rejected += 1;
      rejectionReason = "Auto-rejected by anomaly engine";
    }

    const payoutAmount = status === "auto_approved" ? finalPayout : 0;

    const claimRow = await createClaim({
        worker_id: workerId,
        policy_id: pol.id,
        trigger_event_id: triggerEventId,
        active_score: activeScore,
        fraud_score: fraudScore,
        anomaly_score: fraudEval.anomalyScore,
        fraud_decision: fraudEval.decision,
        covered_hours: coveredHours,
        payout_amount: payoutAmount,
        status,
        payout_status: status === "auto_approved" ? "processing" : "not_started",
        rejection_reason: rejectionReason,
      });

    if (!claimRow) continue;

    if (fraudEval.reasonCodes.length > 0) {
      await insertFraudAuditLogs(
        fraudEval.reasonCodes.map((reasonCode) => ({
          claim_id: claimRow.id,
          worker_id: workerId,
          reason_code: reasonCode,
          severity:
            reasonCode.includes("IMPOSSIBLE") || reasonCode.includes("MISMATCH")
              ? "high"
              : "medium",
          score_impact: fraudEval.anomalyScore,
          evidence_json: fraudEval.evidence as Record<string, unknown>,
        }))
      );
    }

    if (status === "auto_approved" && payoutAmount > 0) {
      const payout = await processPayoutForClaim({
        claimId: claimRow.id as string,
        workerId,
        amount: payoutAmount,
      });
      if (payout.ok) {
        total_payout += payoutAmount;
      } else {
        auto_approved -= 1;
        payout_failed += 1;
      }
    }
  }

  return {
    affected: policies.length,
    total_payout: Math.round(total_payout * 100) / 100,
    auto_approved,
    watchlist,
    flagged,
    rejected,
    payout_failed,
  };
}
