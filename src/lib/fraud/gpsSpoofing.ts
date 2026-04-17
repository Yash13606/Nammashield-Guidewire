import { getZoneBounds } from "@/lib/db/repositories/weatherRepository";
import { getGpsLogsForFraudWindow } from "@/lib/db/repositories/gpsRepository";

export type GpsFraudSignal = {
  score: number;
  zoneCoherenceScore: number;
  reasonCodes: string[];
  evidence: Record<string, unknown>;
};

const MAX_SPEED_KMH = 120;

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function insideZone(
  lat: number,
  lng: number,
  bounds: {
    lat_min: number;
    lat_max: number;
    lng_min: number;
    lng_max: number;
  }
) {
  return (
    lat >= Number(bounds.lat_min) &&
    lat <= Number(bounds.lat_max) &&
    lng >= Number(bounds.lng_min) &&
    lng <= Number(bounds.lng_max)
  );
}

export async function analyzeGpsSpoofing(params: {
  workerId: string;
  city: string;
  zone: string;
  startAt: string;
  endAt: string;
}): Promise<GpsFraudSignal> {
  const { workerId, city, zone, startAt, endAt } = params;

  const zoneRow = await getZoneBounds(city, zone);

  if (!zoneRow) {
    return {
      score: 0.35,
      zoneCoherenceScore: 0.5,
      reasonCodes: ["ZONE_BOUNDARY_MISSING"],
      evidence: { city, zone },
    };
  }

  const logs = await getGpsLogsForFraudWindow(workerId, startAt, endAt);

  if (!logs.length) {
    return {
      score: 0.3,
      zoneCoherenceScore: 0.4,
      reasonCodes: ["GPS_WINDOW_EMPTY"],
      evidence: { worker_id: workerId, startAt, endAt },
    };
  }

  let outsideCount = 0;
  let jumpCount = 0;
  let comparedJumps = 0;

  for (let i = 0; i < logs.length; i++) {
    const lat = Number(logs[i].lat);
    const lng = Number(logs[i].lng);
    if (!insideZone(lat, lng, zoneRow)) outsideCount += 1;

    if (i === 0) continue;
    const prev = logs[i - 1];
    const prevTs = new Date(prev.logged_at).getTime();
    const currTs = new Date(logs[i].logged_at).getTime();
    const dtHrs = Math.max((currTs - prevTs) / (1000 * 60 * 60), 1 / 3600);
    const km = haversineKm(
      Number(prev.lat),
      Number(prev.lng),
      Number(logs[i].lat),
      Number(logs[i].lng)
    );
    const speed = km / dtHrs;
    comparedJumps += 1;
    if (speed > MAX_SPEED_KMH) jumpCount += 1;
  }

  const total = logs.length;
  const outsideRatio = outsideCount / total;
  const jumpRatio = comparedJumps > 0 ? jumpCount / comparedJumps : 0;
  const zoneCoherenceScore = Math.max(0, 1 - outsideRatio);

  const score = Math.min(1, outsideRatio * 0.6 + jumpRatio * 0.4);
  const reasonCodes: string[] = [];
  if (outsideRatio > 0.2) reasonCodes.push("GPS_OUTSIDE_SERVICE_AREA");
  if (jumpRatio > 0.15) reasonCodes.push("GPS_IMPOSSIBLE_JUMP");
  if (zoneCoherenceScore < 0.65) reasonCodes.push("GPS_ZONE_COHERENCE_LOW");

  return {
    score,
    zoneCoherenceScore,
    reasonCodes,
    evidence: {
      outside_count: outsideCount,
      total_points: total,
      jump_count: jumpCount,
      compared_jumps: comparedJumps,
      outside_ratio: outsideRatio,
      jump_ratio: jumpRatio,
      max_speed_kmh_threshold: MAX_SPEED_KMH,
    },
  };
}
