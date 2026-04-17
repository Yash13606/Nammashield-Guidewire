import { queryMaybeOne, queryRows, execute } from "@/lib/db/postgres";
import { inClause } from "./sqlHelpers";

export type ClaimReviewRow = {
  id: string;
  worker_id: string;
  payout_amount: number;
  fraud_score: number | null;
  active_score: number | null;
  status: string;
  created_at: string;
  trigger_event_id: string;
};

export type ClaimForApprovalRow = {
  id: string;
  worker_id: string;
  status: string;
  payout_amount: number;
};

export type ClaimPayoutComputationRow = {
  worker_id: string;
  policy_id: string;
  trigger_event_id: string;
};

export type WorkerClaimListRow = {
  id: string;
  created_at: string;
  payout_amount: number;
  status: string;
  payout_status: string | null;
  payout_channel: string | null;
  payout_processed_at: string | null;
  payout_failure_reason: string | null;
  covered_hours: number | null;
  active_score: number | null;
  fraud_score: number | null;
  trigger_event_type: string | null;
};

export async function getClaimForApproval(claimId: string) {
  return queryMaybeOne<ClaimForApprovalRow>(
    `SELECT id, worker_id, status, COALESCE(payout_amount, 0)::float8 AS payout_amount
     FROM claims WHERE id = $1`,
    [claimId]
  );
}

export async function listClaimsForWorker(input: {
  workerId: string;
  since?: string | null;
  status?: string | null;
  limit?: number;
}) {
  const where: string[] = ["c.worker_id = $1"];
  const params: Array<string | number> = [input.workerId];
  let paramIndex = 2;

  if (input.since) {
    where.push(`c.created_at > $${paramIndex}`);
    params.push(input.since);
    paramIndex += 1;
  }
  if (input.status) {
    where.push(`c.status = $${paramIndex}`);
    params.push(input.status);
    paramIndex += 1;
  }

  let sql = `SELECT
      c.id,
      c.created_at::text AS created_at,
      COALESCE(c.payout_amount, 0)::float8 AS payout_amount,
      c.status,
      c.payout_status,
      c.payout_channel,
      c.payout_processed_at::text AS payout_processed_at,
      c.payout_failure_reason,
      c.covered_hours::float8 AS covered_hours,
      c.active_score::float8 AS active_score,
      c.fraud_score::float8 AS fraud_score,
      t.event_type AS trigger_event_type
    FROM claims c
    LEFT JOIN trigger_events t ON t.id = c.trigger_event_id
    WHERE ${where.join(" AND ")}
    ORDER BY c.created_at DESC`;

  if (input.limit && Number.isFinite(input.limit) && input.limit > 0) {
    sql += ` LIMIT $${paramIndex}`;
    params.push(input.limit);
  }

  return queryRows<WorkerClaimListRow>(sql, params);
}

export async function sumPayoutAmountsForWorkerPolicy(workerId: string, policyId: string) {
  const row = await queryMaybeOne<{ total: number }>(
    `SELECT COALESCE(SUM(payout_amount), 0)::float8 AS total
     FROM claims
     WHERE worker_id = $1 AND policy_id = $2`,
    [workerId, policyId]
  );
  return Number(row?.total ?? 0);
}

export async function getClaimStatus(claimId: string) {
  return queryMaybeOne<{ status: string }>(
    "SELECT status FROM claims WHERE id = $1",
    [claimId]
  );
}

export async function getClaimForPayoutComputation(claimId: string) {
  return queryMaybeOne<ClaimPayoutComputationRow>(
    "SELECT worker_id, policy_id, trigger_event_id FROM claims WHERE id = $1",
    [claimId]
  );
}

export async function setClaimManualProcessing(claimId: string) {
  await execute(
    `UPDATE claims
     SET status = 'watchlist', payout_amount = 0, payout_status = 'processing', rejection_reason = NULL
     WHERE id = $1`,
    [claimId]
  );
}

export async function rejectClaimByReviewer(claimId: string, rejectionReason: string) {
  await execute(
    `UPDATE claims
     SET status = 'rejected',
         payout_amount = 0,
         payout_status = 'cancelled',
         payout_failure_reason = $2,
         rejection_reason = $2
     WHERE id = $1`,
    [claimId, rejectionReason]
  );
}

export async function getReviewQueueClaims() {
  return queryRows<ClaimReviewRow>(
    `SELECT id, worker_id,
            COALESCE(payout_amount, 0)::float8 AS payout_amount,
            fraud_score::float8,
            active_score::float8,
            status,
            created_at::text AS created_at,
            trigger_event_id
     FROM claims
     WHERE status IN ('watchlist', 'flagged')
     ORDER BY created_at DESC`
  );
}

export async function countClaimsByTrigger(triggerEventId: string) {
  const row = await queryMaybeOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM claims WHERE trigger_event_id = $1",
    [triggerEventId]
  );
  return Number(row?.count ?? 0);
}

export async function countClaimsByWorkerSince(workerId: string, sinceIso: string) {
  const row = await queryMaybeOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM claims WHERE worker_id = $1 AND created_at >= $2",
    [workerId, sinceIso]
  );
  return Number(row?.count ?? 0);
}

export async function countClaimsByWorkerInWindow(
  workerId: string,
  fromIso: string,
  toIso: string
) {
  const row = await queryMaybeOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM claims
     WHERE worker_id = $1 AND created_at >= $2 AND created_at <= $3`,
    [workerId, fromIso, toIso]
  );
  return Number(row?.count ?? 0);
}

export async function createClaim(input: {
  worker_id: string;
  policy_id: string;
  trigger_event_id: string;
  active_score: number;
  fraud_score: number;
  anomaly_score: number;
  fraud_decision: string;
  covered_hours: number;
  payout_amount: number;
  status: string;
  payout_status: string;
  rejection_reason: string | null;
}) {
  return queryMaybeOne<{ id: string }>(
    `INSERT INTO claims (
      worker_id, policy_id, trigger_event_id, active_score, fraud_score, anomaly_score,
      fraud_decision, covered_hours, payout_amount, status, payout_status, rejection_reason
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    ) RETURNING id`,
    [
      input.worker_id,
      input.policy_id,
      input.trigger_event_id,
      input.active_score,
      input.fraud_score,
      input.anomaly_score,
      input.fraud_decision,
      input.covered_hours,
      input.payout_amount,
      input.status,
      input.payout_status,
      input.rejection_reason,
    ]
  );
}

export async function updateClaimPayoutProcessing(claimId: string) {
  await execute("UPDATE claims SET payout_status = 'processing' WHERE id = $1", [claimId]);
}

export async function updateClaimPayoutFailed(
  claimId: string,
  failureText: string,
  channel: string,
  processedAt: string
) {
  await execute(
    `UPDATE claims
     SET status = 'payout_failed',
         payout_status = 'failed',
         payout_failure_reason = $2,
         payout_channel = $3,
         payout_processed_at = $4,
         payout_amount = 0
     WHERE id = $1`,
    [claimId, failureText, channel, processedAt]
  );
}

export async function updateClaimPayoutCompleted(
  claimId: string,
  amount: number,
  channel: string,
  processedAt: string
) {
  await execute(
    `UPDATE claims
     SET status = 'auto_approved',
         payout_status = 'completed',
         payout_failure_reason = NULL,
         payout_channel = $3,
         payout_processed_at = $4,
         payout_amount = $2,
         rejection_reason = NULL
     WHERE id = $1`,
    [claimId, amount, channel, processedAt]
  );
}

export async function getFraudReasonCodesByClaimIds(claimIds: string[]) {
  if (claimIds.length === 0) {
    return [] as Array<{ claim_id: string; reason_code: string }>;
  }
  const clause = inClause(claimIds);
  return queryRows<{ claim_id: string; reason_code: string }>(
    `SELECT claim_id, reason_code FROM fraud_audit_logs WHERE claim_id IN ${clause.sql}`,
    clause.params
  );
}
