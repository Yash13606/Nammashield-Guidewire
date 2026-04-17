import { execute, queryMaybeOne, queryRows } from "@/lib/db/postgres";
import { inClause } from "./sqlHelpers";

export type PolicyForClaimsRow = {
  id: string;
  worker_id: string;
  tier: string;
  weekly_premium: number;
  risk_score: number | null;
};

export async function getPolicyForPayout(policyId: string) {
  return queryMaybeOne<{ tier: string; weekly_premium: number }>(
    `SELECT tier, COALESCE(weekly_premium, 0)::float8 AS weekly_premium
     FROM policies WHERE id = $1`,
    [policyId]
  );
}

export async function getLatestActivePolicyForWorker(workerId: string) {
  return queryMaybeOne<{
    id: string;
    worker_id: string;
    tier: string;
    weekly_premium: number;
    coverage_amount: number;
    risk_score: number;
    start_date: string;
    end_date: string;
    status: string;
    created_at: string;
  }>(
    `SELECT
      id,
      worker_id,
      tier,
      COALESCE(weekly_premium, 0)::float8 AS weekly_premium,
      COALESCE(coverage_amount, 0)::float8 AS coverage_amount,
      COALESCE(risk_score, 0)::float8 AS risk_score,
      start_date::text AS start_date,
      end_date::text AS end_date,
      status,
      created_at::text AS created_at
     FROM policies
     WHERE worker_id = $1 AND status = 'active'
     ORDER BY created_at DESC
     LIMIT 1`,
    [workerId]
  );
}

export async function updateActivePolicyForWorker(
  workerId: string,
  updates: { tier: string; weekly_premium: number; coverage_amount: number }
) {
  return execute(
    `UPDATE policies
     SET tier = $2, weekly_premium = $3, coverage_amount = $4
     WHERE worker_id = $1 AND status = 'active'`,
    [workerId, updates.tier, updates.weekly_premium, updates.coverage_amount]
  );
}

export async function getActivePoliciesByWorkerIds(workerIds: string[]) {
  if (workerIds.length === 0) return [] as PolicyForClaimsRow[];
  const clause = inClause(workerIds);
  return queryRows<PolicyForClaimsRow>(
    `SELECT id, worker_id, tier, COALESCE(weekly_premium, 0)::float8 AS weekly_premium, risk_score::float8
     FROM policies
     WHERE worker_id IN ${clause.sql} AND status = 'active'`,
    clause.params
  );
}

export async function getActivePolicyWorkerIds() {
  const rows = await queryRows<{ worker_id: string }>(
    "SELECT worker_id FROM policies WHERE status = 'active'"
  );
  return rows.map((row) => row.worker_id);
}

export async function countActivePolicies() {
  const row = await queryMaybeOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM policies WHERE status = 'active'"
  );
  return Number(row?.count ?? 0);
}

export async function sumActiveWeeklyPremiums() {
  const row = await queryMaybeOne<{ total: number }>(
    "SELECT COALESCE(SUM(weekly_premium), 0)::float8 AS total FROM policies WHERE status = 'active'"
  );
  return Number(row?.total ?? 0);
}

export async function getActivePoliciesForZoneLoss() {
  return queryRows<{ id: string; weekly_premium: number; worker_id: string }>(
    `SELECT id, COALESCE(weekly_premium, 0)::float8 AS weekly_premium, worker_id
     FROM policies WHERE status = 'active'`
  );
}

export async function listPoliciesExpiringOn(dateIso: string) {
  return queryRows<{ id: string; worker_id: string; start_date: string; end_date: string }>(
    `SELECT id, worker_id, start_date::text AS start_date, end_date::text AS end_date
     FROM policies
     WHERE status = 'active' AND end_date = $1`,
    [dateIso]
  );
}

export async function expirePolicy(policyId: string) {
  await execute("UPDATE policies SET status = 'expired' WHERE id = $1", [policyId]);
}

export async function insertPolicy(input: {
  worker_id: string;
  tier: string;
  weekly_premium: number;
  coverage_amount: number;
  risk_score: number;
  start_date: string;
  end_date: string;
}) {
  await execute(
    `INSERT INTO policies (
      worker_id, tier, weekly_premium, coverage_amount, risk_score, start_date, end_date, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
    [
      input.worker_id,
      input.tier,
      input.weekly_premium,
      input.coverage_amount,
      input.risk_score,
      input.start_date,
      input.end_date,
    ]
  );
}
