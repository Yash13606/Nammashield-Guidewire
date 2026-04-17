import { NextResponse } from "next/server";
import {
  getFraudReasonCodesByClaimIds,
  getReviewQueueClaims,
} from "@/lib/db/repositories/claimsRepository";
import { getWorkersByIds } from "@/lib/db/repositories/workersRepository";
import { getTriggerEventsByIds } from "@/lib/db/repositories/triggersRepository";

export async function GET() {
  try {
    const claims = await getReviewQueueClaims();

    const workerIds = [...new Set((claims ?? []).map((c) => c.worker_id))];
    const triggerIds = [...new Set((claims ?? []).map((c) => c.trigger_event_id))];
    const claimIds = [...new Set((claims ?? []).map((c) => c.id))];

    const [workers, triggers, fraudAudit] = await Promise.all([
      getWorkersByIds(workerIds),
      getTriggerEventsByIds(triggerIds),
      getFraudReasonCodesByClaimIds(claimIds),
    ]);

    const wMap = Object.fromEntries((workers ?? []).map((w) => [w.id, w]));
    const tMap = Object.fromEntries((triggers ?? []).map((t) => [t.id, t]));
    const reasonByClaim: Record<string, string[]> = {};
    for (const row of fraudAudit ?? []) {
      if (!reasonByClaim[row.claim_id]) reasonByClaim[row.claim_id] = [];
      reasonByClaim[row.claim_id].push(row.reason_code);
    }

    const rows = (claims ?? []).map((c) => ({
      ...c,
      worker: wMap[c.worker_id as string],
      trigger: tMap[c.trigger_event_id as string],
      reason_codes: reasonByClaim[c.id as string] ?? [],
    }));

    return NextResponse.json({ claims: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
