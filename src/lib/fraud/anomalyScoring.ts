import { analyzeGpsSpoofing } from "./gpsSpoofing";
import { analyzeWeatherClaimAnomaly } from "./weatherClaimAnomaly";
import { countClaimsByWorkerSince } from "@/lib/db/repositories/claimsRepository";
import {
  countWorkersByDeviceFingerprint,
  getWorkerDeviceFingerprint,
} from "@/lib/db/repositories/workers";

const ML_BASE = (process.env.ML_API_URL ?? process.env.NEXT_PUBLIC_ML_API_URL ?? "").replace(/\/$/, "");

function hashUnit(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) / 0x7fffffff;
}

async function callMlFraudScore(payload: {
  claim_velocity: number;
  zone_coherence_score: number;
  same_device_cluster: number;
}): Promise<number> {
  if (!ML_BASE) {
    return Math.min(
      1,
      0.5 * payload.claim_velocity +
        0.3 * (1 - payload.zone_coherence_score) +
        0.2 * payload.same_device_cluster
    );
  }
  try {
    const res = await fetch(`${ML_BASE}/ml/fraud-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return 0.5;
    const body = (await res.json()) as { fraud_score?: number };
    return Number(body.fraud_score ?? 0.5);
  } catch {
    return 0.5;
  }
}

export type FraudDecision = "auto_approved" | "watchlist" | "flagged" | "auto_rejected";

export async function evaluateClaimFraud(params: {
  workerId: string;
  city: string;
  zone: string;
  eventType: string;
  triggerStartAt: string;
  triggerEndAt?: string | null;
  activeScore: number;
  pincode?: string | null;
}): Promise<{
  fraudScore: number;
  anomalyScore: number;
  decision: FraudDecision;
  reasonCodes: string[];
  evidence: Record<string, unknown>;
}> {
  const {
    workerId,
    city,
    zone,
    eventType,
    triggerStartAt,
    triggerEndAt,
    activeScore,
    pincode,
  } = params;

  const endAt = triggerEndAt ?? new Date().toISOString();
  const [gpsSignal, weatherSignal] = await Promise.all([
    analyzeGpsSpoofing({
      workerId,
      city,
      zone,
      startAt: triggerStartAt,
      endAt,
    }),
    analyzeWeatherClaimAnomaly({
      city,
      zone,
      eventType,
      triggerStartAt,
      triggerEndAt,
      pincode,
    }),
  ]);

  const recentSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const claimCount = await countClaimsByWorkerSince(workerId, recentSince);

  const worker = await getWorkerDeviceFingerprint(workerId);

  let sameDeviceCluster = hashUnit(workerId);
  if (worker?.device_fingerprint) {
    const count = await countWorkersByDeviceFingerprint(worker.device_fingerprint);
    sameDeviceCluster = Math.min(1, (count - 1) / 5);
  }

  const claimVelocity = Math.min(1, (claimCount ?? 0) / 8);
  const mlFraud = await callMlFraudScore({
    claim_velocity: claimVelocity,
    zone_coherence_score: gpsSignal.zoneCoherenceScore,
    same_device_cluster: sameDeviceCluster,
  });

  const anomalyScore = Math.min(
    1,
    gpsSignal.score * 0.5 + weatherSignal.score * 0.35 + (1 - activeScore) * 0.15
  );
  const fraudScore = Math.min(1, mlFraud * 0.6 + anomalyScore * 0.4);

  let decision: FraudDecision;
  if (fraudScore > 0.9) {
    decision = "auto_rejected";
  } else if (fraudScore > 0.7) {
    decision = "flagged";
  } else if (fraudScore > 0.35) {
    decision = "watchlist";
  } else {
    decision = "auto_approved";
  }

  return {
    fraudScore,
    anomalyScore,
    decision,
    reasonCodes: [...gpsSignal.reasonCodes, ...weatherSignal.reasonCodes],
    evidence: {
      active_score: activeScore,
      claim_velocity: claimVelocity,
      same_device_cluster: sameDeviceCluster,
      gps: gpsSignal.evidence,
      weather: weatherSignal.evidence,
      ml_fraud_score: mlFraud,
    },
  };
}
