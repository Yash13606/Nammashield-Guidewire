import { execute, queryMaybeOne, queryRows } from "@/lib/db/postgres";

export type WorkerNotificationRow = {
  id: string;
  worker_id: string;
  category: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export type WorkerNotificationPreferenceRow = {
  worker_id: string;
  push_enabled: boolean;
  payout_enabled: boolean;
  trigger_enabled: boolean;
  fraud_enabled: boolean;
  profile_updates_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export async function ensureWorkerNotificationPreferences(workerId: string) {
  await execute(
    `INSERT INTO worker_notification_preferences (worker_id)
     VALUES ($1)
     ON CONFLICT (worker_id) DO NOTHING`,
    [workerId]
  );
}

export async function getWorkerNotificationPreferences(workerId: string) {
  await ensureWorkerNotificationPreferences(workerId);
  return queryMaybeOne<WorkerNotificationPreferenceRow>(
    `SELECT
      worker_id,
      COALESCE(push_enabled, true) AS push_enabled,
      COALESCE(payout_enabled, true) AS payout_enabled,
      COALESCE(trigger_enabled, true) AS trigger_enabled,
      COALESCE(fraud_enabled, true) AS fraud_enabled,
      COALESCE(profile_updates_enabled, true) AS profile_updates_enabled,
      created_at::text AS created_at,
      updated_at::text AS updated_at
     FROM worker_notification_preferences
     WHERE worker_id = $1`,
    [workerId]
  );
}

export async function updateWorkerNotificationPreferences(
  workerId: string,
  updates: Partial<
    Pick<
      WorkerNotificationPreferenceRow,
      "push_enabled" | "payout_enabled" | "trigger_enabled" | "fraud_enabled" | "profile_updates_enabled"
    >
  >
) {
  await ensureWorkerNotificationPreferences(workerId);

  const allowed = new Set([
    "push_enabled",
    "payout_enabled",
    "trigger_enabled",
    "fraud_enabled",
    "profile_updates_enabled",
  ]);
  const entries = Object.entries(updates).filter(
    ([key, value]) => allowed.has(key) && typeof value === "boolean"
  );

  if (entries.length === 0) {
    return getWorkerNotificationPreferences(workerId);
  }

  const setClauses = entries.map(([key], index) => `${key} = $${index + 2}`).join(", ");
  const params = [workerId, ...entries.map(([, value]) => value)];

  return queryMaybeOne<WorkerNotificationPreferenceRow>(
    `UPDATE worker_notification_preferences
     SET ${setClauses}, updated_at = now()
     WHERE worker_id = $1
     RETURNING
      worker_id,
      COALESCE(push_enabled, true) AS push_enabled,
      COALESCE(payout_enabled, true) AS payout_enabled,
      COALESCE(trigger_enabled, true) AS trigger_enabled,
      COALESCE(fraud_enabled, true) AS fraud_enabled,
      COALESCE(profile_updates_enabled, true) AS profile_updates_enabled,
      created_at::text AS created_at,
      updated_at::text AS updated_at`,
    params
  );
}

export async function createWorkerNotification(input: {
  worker_id: string;
  category: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  return queryMaybeOne<{ id: string }>(
    `INSERT INTO worker_notifications (
      worker_id, category, title, message, metadata
    ) VALUES ($1, $2, $3, $4, $5::jsonb)
    RETURNING id`,
    [
      input.worker_id,
      input.category,
      input.title,
      input.message,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
}

export async function listWorkerNotifications(input: {
  workerId: string;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const limit = input.limit && Number.isFinite(input.limit) && input.limit > 0 ? input.limit : 30;

  return queryRows<WorkerNotificationRow>(
    `SELECT
      id,
      worker_id,
      category,
      title,
      message,
      COALESCE(metadata, '{}'::jsonb) AS metadata,
      COALESCE(is_read, false) AS is_read,
      created_at::text AS created_at,
      read_at::text AS read_at
     FROM worker_notifications
     WHERE worker_id = $1
       AND ($2::boolean = false OR COALESCE(is_read, false) = false)
     ORDER BY created_at DESC
     LIMIT $3`,
    [input.workerId, Boolean(input.unreadOnly), limit]
  );
}

export async function countUnreadWorkerNotifications(workerId: string) {
  const row = await queryMaybeOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM worker_notifications
     WHERE worker_id = $1
       AND COALESCE(is_read, false) = false`,
    [workerId]
  );

  return Number(row?.count ?? 0);
}

export async function markWorkerNotificationRead(workerId: string, notificationId: string) {
  return execute(
    `UPDATE worker_notifications
     SET is_read = true,
         read_at = COALESCE(read_at, now())
     WHERE worker_id = $1
       AND id = $2`,
    [workerId, notificationId]
  );
}

export async function markAllWorkerNotificationsRead(workerId: string) {
  return execute(
    `UPDATE worker_notifications
     SET is_read = true,
         read_at = COALESCE(read_at, now())
     WHERE worker_id = $1
       AND COALESCE(is_read, false) = false`,
    [workerId]
  );
}