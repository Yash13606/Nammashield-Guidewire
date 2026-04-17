import { calculateActiveScore } from "./activeScore";
import { calculatePayout } from "./payoutCalc";
import { evaluateClaimFraud } from "@/lib/fraud/anomalyScoring";
import { processPayoutForClaim } from "@/lib/payments/payoutProcessor";
import type { MockPayoutChannel } from "@/lib/payments/mockUpiGateway";
import { getTriggerEventById } from "@/lib/db/repositories/triggersRepository";
import { getWorkersByCityZone } from "@/lib/db/repositories/workersRepository";
import { getActivePoliciesByWorkerIds } from "@/lib/db/repositories/policiesRepository";
import {
  claimExistsForWorkerPolicyTrigger,
  createClaim,
} from "@/lib/db/repositories/claimsRepository";
import { insertFraudAuditLogs } from "@/lib/db/repositories/fraudRepository";
import { createWorkerNotification, getWorkerNotificationPreferences } from "@/lib/db/repositories/notificationsRepository";

export type ClaimsSummary = {
  affected: number;
  claims_created: number;
  total_payout: number;
  auto_approved: number;
  watchlist: number;
  flagged: number;
  rejected: number;
  payout_failed: number;
  payout_simulation: {
    channel: MockPayoutChannel;
    gateway: "upi_simulator" | "razorpay_test" | "stripe_sandbox";
    successful_payouts: number;
    failed_payouts: number;
    total_requested: number;
    total_credited: number;
  };
};

export async function processClaimsForTrigger(
  triggerEventId: string,
  options?: { payoutChannel?: MockPayoutChannel }
): Promise<ClaimsSummary> {
  const payoutChannel = options?.payoutChannel ?? "UPI_SIM";
  const gatewayByChannel: Record<MockPayoutChannel, "upi_simulator" | "razorpay_test" | "stripe_sandbox"> = {
    UPI_SIM: "upi_simulator",
    RAZORPAY_TEST: "razorpay_test",
    STRIPE_TEST: "stripe_sandbox",
  };

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
      claims_created: 0,
      total_payout: 0,
      auto_approved: 0,
      watchlist: 0,
      flagged: 0,
      rejected: 0,
      payout_failed: 0,
      payout_simulation: {
        channel: payoutChannel,
        gateway: gatewayByChannel[payoutChannel],
        successful_payouts: 0,
        failed_payouts: 0,
        total_requested: 0,
        total_credited: 0,
      },
    };
  }

  const workerIds = workers.map((w) => w.id);
  const policies = await getActivePoliciesByWorkerIds(workerIds);
  if (!policies.length) {
    return {
      affected: 0,
      claims_created: 0,
      total_payout: 0,
      auto_approved: 0,
      watchlist: 0,
      flagged: 0,
      rejected: 0,
      payout_failed: 0,
      payout_simulation: {
        channel: payoutChannel,
        gateway: gatewayByChannel[payoutChannel],
        successful_payouts: 0,
        failed_payouts: 0,
        total_requested: 0,
        total_credited: 0,
      },
    };
  }

  let claims_created = 0;
  let total_payout = 0;
  let auto_approved = 0;
  let watchlist = 0;
  let flagged = 0;
  let rejected = 0;
  let payout_failed = 0;
  let payout_success_count = 0;
  let payout_failure_count = 0;
  let total_requested = 0;

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
    if (status === "auto_approved" && payoutAmount > 0) {
      total_requested += payoutAmount;
    }

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
  claims_created += 1;

    const notificationPrefs = await getWorkerNotificationPreferences(workerId);
    if (notificationPrefs?.trigger_enabled !== false) {
      await createWorkerNotification({
        worker_id: workerId,
        category: "trigger",
        title: "New disruption claim generated",
        message: `${ev.event_type.replace(/_/g, " ")} created a claim with status ${status}.`,
        metadata: {
          claim_id: claimRow.id,
          trigger_event_id: triggerEventId,
          status,
        },
      });
    }

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
        channel: payoutChannel,
      });
      if (payout.ok) {
        total_payout += payoutAmount;
        payout_success_count += 1;
      } else {
        auto_approved -= 1;
        payout_failed += 1;
        payout_failure_count += 1;
      }
    } else if (notificationPrefs?.fraud_enabled !== false) {
      if (status === "flagged" || status === "watchlist" || status === "rejected") {
        await createWorkerNotification({
          worker_id: workerId,
          category: "fraud",
          title: "Claim needs review",
          message: `Claim was marked as ${status}. ${rejectionReason ?? "Fraud checks requested manual review."}`,
          metadata: {
            claim_id: claimRow.id,
            fraud_decision: fraudEval.decision,
            anomaly_score: fraudEval.anomalyScore,
          },
        });
      }
    }
  }

  return {
    affected: policies.length,
    claims_created,
    total_payout: Math.round(total_payout * 100) / 100,
    auto_approved,
    watchlist,
    flagged,
    rejected,
    payout_failed,
    payout_simulation: {
      channel: payoutChannel,
      gateway: gatewayByChannel[payoutChannel],
      successful_payouts: payout_success_count,
      failed_payouts: payout_failure_count,
      total_requested: Math.round(total_requested * 100) / 100,
      total_credited: Math.round(total_payout * 100) / 100,
    },
  };
}
