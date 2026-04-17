import { execute, queryMaybeOne, queryRows } from "@/lib/db/postgres";
import { inClause } from "./sqlHelpers";

const OPTIONAL_WORKER_PROFILE_COLUMNS = [
  "preferred_language",
  "emergency_contact_name",
  "emergency_contact_phone",
] as const;

const workerColumnCache = new Map<string, boolean>();

async function workerColumnExists(columnName: string) {
  const cached = workerColumnCache.get(columnName);
  if (cached !== undefined) {
    return cached;
  }

  const row = await queryMaybeOne<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'workers'
        AND column_name = $1
    ) AS exists`,
    [columnName]
  );

  const exists = Boolean(row?.exists);
  workerColumnCache.set(columnName, exists);
  return exists;
}

export type WorkerBasicRow = {
  id: string;
  name: string | null;
  phone: string;
};

export type WorkerCityZoneRow = {
  id: string;
  city: string | null;
  zone: string | null;
};

export type WorkerProfileRow = {
  id: string;
  phone: string;
  name: string | null;
  partner_id: string | null;
  city: string | null;
  zone: string | null;
  preferred_language: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  device_fingerprint: string | null;
  wallet_balance: number;
  streak_weeks: number;
  is_onboarded: boolean;
  created_at: string;
};

export async function getWorkersByCityZone(city: string, zone: string) {
  return queryRows<{ id: string; city: string; zone: string }>(
    `SELECT id, city, zone
     FROM workers
     WHERE lower(city) = lower($1)
       AND regexp_replace(lower(zone), '[^a-z0-9]+', '', 'g') = regexp_replace(lower($2), '[^a-z0-9]+', '', 'g')`,
    [city, zone]
  );
}

export async function getWorkerById(workerId: string) {
  const hasPreferredLanguage = await workerColumnExists("preferred_language");
  const hasEmergencyContactName = await workerColumnExists("emergency_contact_name");
  const hasEmergencyContactPhone = await workerColumnExists("emergency_contact_phone");

  const selectColumns = [
    "id",
    "phone",
    "name",
    "partner_id",
    "city",
    "zone",
    hasPreferredLanguage ? "preferred_language" : "NULL::text AS preferred_language",
    hasEmergencyContactName
      ? "emergency_contact_name"
      : "NULL::text AS emergency_contact_name",
    hasEmergencyContactPhone
      ? "emergency_contact_phone"
      : "NULL::text AS emergency_contact_phone",
    "device_fingerprint",
    "COALESCE(wallet_balance, 0)::float8 AS wallet_balance",
    "COALESCE(streak_weeks, 0)::int4 AS streak_weeks",
    "COALESCE(is_onboarded, false) AS is_onboarded",
    "created_at::text AS created_at",
  ];

  return queryMaybeOne<WorkerProfileRow>(
    `SELECT
      ${selectColumns.join(",\n      ")}
     FROM workers
     WHERE id = $1`,
    [workerId]
  );
}

export async function getWorkerByPhone(phone: string) {
  return queryMaybeOne<{ id: string; phone: string; is_onboarded: boolean }>(
    `SELECT id, phone, COALESCE(is_onboarded, false) AS is_onboarded
     FROM workers
     WHERE phone = $1`,
    [phone]
  );
}

export async function createWorkerWithPhone(phone: string) {
  return queryMaybeOne<{ id: string; phone: string; is_onboarded: boolean }>(
    `INSERT INTO workers (phone)
     VALUES ($1)
     RETURNING id, phone, COALESCE(is_onboarded, false) AS is_onboarded`,
    [phone]
  );
}

export async function getWorkersByIds(workerIds: string[]) {
  if (workerIds.length === 0) return [] as WorkerBasicRow[];
  const clause = inClause(workerIds);
  return queryRows<WorkerBasicRow>(
    `SELECT id, name, phone FROM workers WHERE id IN ${clause.sql}`,
    clause.params
  );
}

export async function getWorkersCityZoneByIds(workerIds: string[]) {
  if (workerIds.length === 0) return [] as WorkerCityZoneRow[];
  const clause = inClause(workerIds);
  return queryRows<WorkerCityZoneRow>(
    `SELECT id, city, zone FROM workers WHERE id IN ${clause.sql}`,
    clause.params
  );
}

export async function getWorkerCity(workerId: string) {
  return queryMaybeOne<{ city: string | null }>("SELECT city FROM workers WHERE id = $1", [
    workerId,
  ]);
}

export async function getWorkerRenewalDetails(workerId: string) {
  return queryMaybeOne<{ city: string | null; zone: string | null; streak_weeks: number | null }>(
    "SELECT city, zone, streak_weeks FROM workers WHERE id = $1",
    [workerId]
  );
}

export async function getWorkerDeviceFingerprint(workerId: string) {
  return queryMaybeOne<{ device_fingerprint: string | null }>(
    "SELECT device_fingerprint FROM workers WHERE id = $1",
    [workerId]
  );
}

export async function countWorkersByDeviceFingerprint(deviceFingerprint: string) {
  const row = await queryMaybeOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM workers WHERE device_fingerprint = $1",
    [deviceFingerprint]
  );
  return Number(row?.count ?? 0);
}

export async function getWorkerWalletBalance(workerId: string) {
  return queryMaybeOne<{ wallet_balance: number }>(
    "SELECT COALESCE(wallet_balance, 0)::float8 AS wallet_balance FROM workers WHERE id = $1",
    [workerId]
  );
}

export async function updateWorkerWalletBalance(workerId: string, nextBalance: number) {
  await execute("UPDATE workers SET wallet_balance = $2 WHERE id = $1", [workerId, nextBalance]);
}

export async function updateWorkerStreakWeeks(workerId: string, nextStreak: number) {
  await execute("UPDATE workers SET streak_weeks = $2 WHERE id = $1", [workerId, nextStreak]);
}

export async function setWorkerOnboarded(workerId: string) {
  await execute("UPDATE workers SET is_onboarded = true WHERE id = $1", [workerId]);
}

export async function updateWorkerProfile(
  workerId: string,
  updates: Partial<
    Pick<
      WorkerProfileRow,
      | "name"
      | "partner_id"
      | "city"
      | "zone"
      | "is_onboarded"
      | "streak_weeks"
      | "preferred_language"
      | "emergency_contact_name"
      | "emergency_contact_phone"
    >
  >
) {
  const optionalColumnAvailability = await Promise.all(
    OPTIONAL_WORKER_PROFILE_COLUMNS.map(async (columnName) => [
      columnName,
      await workerColumnExists(columnName),
    ] as const)
  );
  const availableOptionalColumns = new Set(
    optionalColumnAvailability.filter(([, exists]) => exists).map(([columnName]) => columnName)
  );

  const allowed = new Set([
    "name",
    "partner_id",
    "city",
    "zone",
    "is_onboarded",
    "streak_weeks",
    "preferred_language",
    "emergency_contact_name",
    "emergency_contact_phone",
  ]);
  const entries = Object.entries(updates).filter(
    ([key, value]) =>
      allowed.has(key) &&
      value !== undefined &&
      (!OPTIONAL_WORKER_PROFILE_COLUMNS.includes(key as (typeof OPTIONAL_WORKER_PROFILE_COLUMNS)[number]) ||
        availableOptionalColumns.has(key))
  );
  if (entries.length === 0) {
    return getWorkerById(workerId);
  }

  const setClauses = entries.map(([key], index) => `${key} = $${index + 2}`).join(", ");
  const params = [workerId, ...entries.map(([, value]) => value)];

  await execute(
    `UPDATE workers
     SET ${setClauses}
     WHERE id = $1`,
    params
  );

  return getWorkerById(workerId);
}
