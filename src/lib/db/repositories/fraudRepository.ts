import { queryRows, execute } from "@/lib/db/postgres";

export async function insertFraudAuditLogs(
  rows: Array<{
    claim_id: string;
    worker_id: string;
    reason_code: string;
    severity: string;
    score_impact: number;
    evidence_json: Record<string, unknown>;
  }>
) {
  if (rows.length === 0) return;
  const values: unknown[] = [];
  const tuples = rows
    .map((row, idx) => {
      const base = idx * 6;
      values.push(
        row.claim_id,
        row.worker_id,
        row.reason_code,
        row.severity,
        row.score_impact,
        JSON.stringify(row.evidence_json)
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}::jsonb)`;
    })
    .join(", ");

  await execute(
    `INSERT INTO fraud_audit_logs (
      claim_id, worker_id, reason_code, severity, score_impact, evidence_json
    ) VALUES ${tuples}`,
    values
  );
}

export async function listRecentFraudCases(limit: number) {
  return queryRows<{
    reason_code: string;
    severity: string;
    created_at: string;
    claim_id: string;
  }>(
    `SELECT reason_code, severity, created_at::text AS created_at, claim_id
     FROM fraud_audit_logs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
}
