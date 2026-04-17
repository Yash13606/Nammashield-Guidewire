import { execute, queryRows } from "@/lib/db/postgres";

export async function countGpsLogsForWorkerInWindow(
  workerId: string,
  startIso: string,
  endIso: string
) {
  const rows = await queryRows<{ id: string }>(
    `SELECT id
     FROM gps_logs
     WHERE worker_id = $1 AND logged_at >= $2 AND logged_at <= $3`,
    [workerId, startIso, endIso]
  );
  return rows.length;
}

export async function getGpsLogsForFraudWindow(workerId: string, startAt: string, endAt: string) {
  return queryRows<{ lat: number; lng: number; logged_at: string }>(
    `SELECT lat::float8, lng::float8, logged_at::text AS logged_at
     FROM gps_logs
     WHERE worker_id = $1 AND logged_at >= $2 AND logged_at <= $3
     ORDER BY logged_at ASC`,
    [workerId, startAt, endAt]
  );
}

export async function insertGpsLog(input: {
  worker_id: string;
  lat: number;
  lng: number;
  is_active: boolean;
}) {
  await execute(
    "INSERT INTO gps_logs (worker_id, lat, lng, is_active) VALUES ($1, $2, $3, $4)",
    [input.worker_id, input.lat, input.lng, input.is_active]
  );
}

export async function bulkInsertGpsLogs(
  rows: Array<{
    worker_id: string;
    lat: number;
    lng: number;
    is_active: boolean;
    logged_at: string;
  }>
) {
  if (rows.length === 0) return;
  const values: unknown[] = [];
  const tuples = rows
    .map((row, idx) => {
      const base = idx * 5;
      values.push(row.worker_id, row.lat, row.lng, row.is_active, row.logged_at);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    })
    .join(", ");
  await execute(
    `INSERT INTO gps_logs (worker_id, lat, lng, is_active, logged_at) VALUES ${tuples}`,
    values
  );
}
