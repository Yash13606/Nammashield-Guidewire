import { getWeatherObservationsWindow } from "@/lib/db/repositories/weatherRepository";

export type WeatherFraudSignal = {
  score: number;
  reasonCodes: string[];
  evidence: Record<string, unknown>;
};

const RAIN_EVENT_TYPES = new Set(["heavy_rain", "flash_flood"]);

export async function analyzeWeatherClaimAnomaly(params: {
  city: string;
  zone: string;
  eventType: string;
  triggerStartAt: string;
  triggerEndAt?: string | null;
  pincode?: string | null;
}): Promise<WeatherFraudSignal> {
  const { city, zone, eventType, triggerStartAt, triggerEndAt, pincode } = params;
  const start = new Date(triggerStartAt);
  const end = triggerEndAt ? new Date(triggerEndAt) : start;
  const from = new Date(start.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const to = new Date(end.getTime() + 2 * 60 * 60 * 1000).toISOString();

  const observations = await getWeatherObservationsWindow({
    city,
    zone,
    from,
    to,
    pincode,
  });

  if (!observations.length) {
    return {
      score: 0.2,
      reasonCodes: ["WEATHER_HISTORY_MISSING"],
      evidence: { city, zone, pincode: pincode ?? null, from, to },
    };
  }

  const isRainClaim = RAIN_EVENT_TYPES.has(eventType);
  const rainValues = observations.map((o) => Number(o.rain_mm ?? 0));
  const maxRain = rainValues.length ? Math.max(...rainValues) : 0;
  const avgRain =
    rainValues.length > 0
      ? rainValues.reduce((s, v) => s + v, 0) / rainValues.length
      : 0;

  const reasonCodes: string[] = [];
  let score = 0;

  if (isRainClaim && maxRain < 1) {
    score = 0.8;
    reasonCodes.push("RAIN_CLAIM_CLEAR_SKY_MISMATCH");
  } else if (isRainClaim && maxRain < 3) {
    score = 0.45;
    reasonCodes.push("RAIN_CLAIM_WEAK_RAIN_MISMATCH");
  } else if (!isRainClaim && maxRain > 20) {
    score = 0.3;
    reasonCodes.push("EVENT_TYPE_WEATHER_INCONSISTENT");
  }

  return {
    score,
    reasonCodes,
    evidence: {
      is_rain_claim: isRainClaim,
      max_rain_mm: maxRain,
      avg_rain_mm: Number(avgRain.toFixed(2)),
      samples: observations.length,
      window_from: from,
      window_to: to,
    },
  };
}
