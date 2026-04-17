export type AqiSignal = {
  aqi: number;
  source: "cpcb_mock";
  level: "normal" | "elevated" | "severe";
};

export type TrafficSignal = {
  congestion_index: number;
  source: "traffic_mock";
  level: "normal" | "heavy";
};

export type SocialSignal = {
  disruption_index: number;
  source: "social_mock";
  reason: "none" | "curfew" | "strike" | "zone_closure";
};

function hashUnit(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) / 0x7fffffff;
}

export function getMockAqiSignal(city: string, zone: string): AqiSignal {
  const hour = new Date().getHours();
  const base = hashUnit(`aqi|${city}|${zone}`);
  const diurnal = hour >= 7 && hour <= 11 ? 80 : hour >= 17 && hour <= 21 ? 65 : 45;
  const aqi = Math.round(diurnal + base * 280);

  return {
    aqi,
    source: "cpcb_mock",
    level: aqi >= 300 ? "severe" : aqi >= 200 ? "elevated" : "normal",
  };
}

export function getMockTrafficSignal(city: string, zone: string): TrafficSignal {
  const hour = new Date().getHours();
  const peak = hour >= 8 && hour <= 11 ? 72 : hour >= 17 && hour <= 22 ? 78 : 45;
  const jitter = Math.round(hashUnit(`traffic|${city}|${zone}|${hour}`) * 25);
  const congestion = Math.min(100, peak + jitter);

  return {
    congestion_index: congestion,
    source: "traffic_mock",
    level: congestion >= 75 ? "heavy" : "normal",
  };
}

export function getMockSocialSignal(city: string, zone: string): SocialSignal {
  const hour = new Date().getHours();
  const u = hashUnit(`social|${city}|${zone}|${hour}`);
  const disruption_index = Math.round(u * 100);

  let reason: SocialSignal["reason"] = "none";
  if (disruption_index >= 92) reason = "curfew";
  else if (disruption_index >= 86) reason = "strike";
  else if (disruption_index >= 80) reason = "zone_closure";

  return {
    disruption_index,
    source: "social_mock",
    reason,
  };
}
