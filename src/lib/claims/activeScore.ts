import { getTriggerEventById } from "@/lib/db/repositories/triggersRepository";
import { countGpsLogsForWorkerInWindow } from "@/lib/db/repositories/gpsRepository";

/**
 * Ratio of GPS pings during the trigger window vs expected (1 ping/hour).
 * Demo fallback 0.65 when no logs.
 */
export async function calculateActiveScore(
  workerId: string,
  triggerEventId: string
): Promise<number> {
  const trigger = await getTriggerEventById(triggerEventId);
  if (!trigger) return 0.65;

  const start = new Date(trigger.started_at).getTime();
  const end = trigger.ended_at
    ? new Date(trigger.ended_at).getTime()
    : Date.now();
  const durationHours = Math.max(
    0.25,
    (end - start) / (1000 * 60 * 60)
  );

  const logsCount = await countGpsLogsForWorkerInWindow(
    workerId,
    new Date(start).toISOString(),
    new Date(end).toISOString()
  );
  if (!logsCount) return 0.65;

  const expectedPings = Math.max(1, Math.floor(durationHours));
  const activePings = logsCount;
  return Math.min(1, activePings / expectedPings);
}
