import { queryMaybeOne, queryRows } from "@/lib/db/postgres";
import { inClause } from "./sqlHelpers";

export type TriggerEventCore = {
  id: string;
  event_type: string;
  city: string;
  zone: string;
  started_at: string;
  ended_at: string | null;
};

export async function getTriggerEventById(triggerEventId: string) {
  return queryMaybeOne<TriggerEventCore>(
    `SELECT id, event_type, city, zone, started_at::text AS started_at, ended_at::text AS ended_at
     FROM trigger_events WHERE id = $1`,
    [triggerEventId]
  );
}

export async function createTriggerEvent(input: {
  event_type: string;
  city: string;
  zone: string;
  severity: string;
  threshold_value: number;
  started_at: string;
  ended_at: string;
  source: string;
  is_simulated: boolean;
}) {
  return queryMaybeOne<{
    id: string;
    event_type: string;
    city: string;
    zone: string;
    severity: string;
    threshold_value: number | null;
    started_at: string;
    ended_at: string | null;
    source: string | null;
    is_simulated: boolean | null;
    created_at: string;
  }>(
    `INSERT INTO trigger_events (
      event_type, city, zone, severity, threshold_value, started_at, ended_at, source, is_simulated
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, event_type, city, zone, severity, threshold_value::float8,
              started_at::text AS started_at, ended_at::text AS ended_at,
              source, is_simulated, created_at::text AS created_at`,
    [
      input.event_type,
      input.city,
      input.zone,
      input.severity,
      input.threshold_value,
      input.started_at,
      input.ended_at,
      input.source,
      input.is_simulated,
    ]
  );
}

export async function listRecentTriggers(limit: number) {
  return queryRows<{
    id: string;
    event_type: string;
    city: string;
    zone: string;
    severity: string;
    started_at: string;
    is_simulated: boolean;
  }>(
    `SELECT id, event_type, city, zone, severity, started_at::text AS started_at, is_simulated
     FROM trigger_events ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
}

export async function listRecentTriggersByCity(city: string, limit: number) {
  return queryRows<{
    id: string;
    event_type: string;
    severity: string;
    city: string;
    zone: string;
    started_at: string;
  }>(
    `SELECT id, event_type, severity, city, zone, started_at::text AS started_at
     FROM trigger_events
     WHERE city = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [city, limit]
  );
}

export async function getTriggerTypesFrequencyRows() {
  return queryRows<{ event_type: string | null }>("SELECT event_type FROM trigger_events");
}

export async function getTriggerEventsByIds(triggerIds: string[]) {
  if (triggerIds.length === 0) return [] as Array<{ id: string; event_type: string }>;
  const clause = inClause(triggerIds);
  return queryRows<{ id: string; event_type: string }>(
    `SELECT id, event_type FROM trigger_events WHERE id IN ${clause.sql}`,
    clause.params
  );
}

export async function hasRecentTriggerByTypeAndZone(input: {
  eventType: string;
  city: string;
  zone: string;
  windowMinutes: number;
}) {
  const row = await queryMaybeOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM trigger_events
     WHERE event_type = $1
       AND lower(city) = lower($2)
       AND regexp_replace(lower(zone), '[^a-z0-9]+', '', 'g') = regexp_replace(lower($3), '[^a-z0-9]+', '', 'g')
       AND created_at >= now() - (($4::text || ' minutes')::interval)`,
    [input.eventType, input.city, input.zone, input.windowMinutes]
  );
  return Number(row?.count ?? 0) > 0;
}
