import { execute, queryMaybeOne, queryRows } from "@/lib/db/postgres";

export async function createPayoutTransaction(input: {
  claim_id: string;
  worker_id: string;
  amount: number;
  status: string;
  gateway: string;
  channel: string;
  retry_count: number;
}) {
  return queryMaybeOne<{ id: string }>(
    `INSERT INTO payout_transactions (
      claim_id, worker_id, amount, status, gateway, channel, retry_count
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
    [
      input.claim_id,
      input.worker_id,
      input.amount,
      input.status,
      input.gateway,
      input.channel,
      input.retry_count,
    ]
  );
}

export async function updatePayoutTransactionFailed(
  id: string,
  input: {
    retry_count: number;
    failure_code: string | null;
    failure_message: string | null;
    processed_at: string;
  }
) {
  await execute(
    `UPDATE payout_transactions
     SET status = 'failed',
         retry_count = $2,
         failure_code = $3,
         failure_message = $4,
         processed_at = $5
     WHERE id = $1`,
    [id, input.retry_count, input.failure_code, input.failure_message, input.processed_at]
  );
}

export async function updatePayoutTransactionCompleted(
  id: string,
  input: { retry_count: number; provider_ref: string | null; processed_at: string }
) {
  await execute(
    `UPDATE payout_transactions
     SET status = 'completed',
         retry_count = $2,
         provider_ref = $3,
         processed_at = $4,
         failure_code = NULL,
         failure_message = NULL
     WHERE id = $1`,
    [id, input.retry_count, input.provider_ref, input.processed_at]
  );
}

export async function insertPayoutLog(input: {
  claim_id: string;
  worker_id: string;
  amount: number;
  wallet_balance_after: number;
  status: string;
}) {
  await execute(
    `INSERT INTO payout_log (
      claim_id, worker_id, amount, wallet_balance_after, status
    ) VALUES ($1, $2, $3, $4, $5)`,
    [
      input.claim_id,
      input.worker_id,
      input.amount,
      input.wallet_balance_after,
      input.status,
    ]
  );
}

export async function sumTotalPayouts() {
  const row = await queryMaybeOne<{ total: number }>(
    "SELECT COALESCE(SUM(amount), 0)::float8 AS total FROM payout_log"
  );
  return Number(row?.total ?? 0);
}

export async function listAllPayoutRows() {
  return queryRows<{ amount: number; worker_id: string }>(
    "SELECT COALESCE(amount, 0)::float8 AS amount, worker_id FROM payout_log"
  );
}

export async function listPayoutTransactionsSince(input: {
  since: string;
  limit?: number;
}) {
  const limit = input.limit && Number.isFinite(input.limit) && input.limit > 0 ? input.limit : 20;

  return queryRows<{
    id: string;
    claim_id: string;
    worker_id: string;
    worker_phone: string | null;
    amount: number;
    status: string;
    channel: string;
    failure_message: string | null;
    requested_at: string;
    processed_at: string | null;
  }>(
    `SELECT
      pt.id,
      pt.claim_id,
      pt.worker_id,
      w.phone AS worker_phone,
      COALESCE(pt.amount, 0)::float8 AS amount,
      pt.status,
      pt.channel,
      pt.failure_message,
      pt.requested_at::text AS requested_at,
      pt.processed_at::text AS processed_at
     FROM payout_transactions pt
     LEFT JOIN workers w ON w.id = pt.worker_id
     WHERE COALESCE(pt.processed_at, pt.requested_at) > $1
     ORDER BY COALESCE(pt.processed_at, pt.requested_at) ASC
     LIMIT $2`,
    [input.since, limit]
  );
}
