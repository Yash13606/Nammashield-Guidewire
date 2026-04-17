import { buildPremiumQuote, type PremiumQuote } from "@/lib/pricing/premiumEngine";

const ML_BASE = (process.env.ML_API_URL ?? process.env.NEXT_PUBLIC_ML_API_URL ?? "").replace(/\/$/, "");

function hashUnit(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) / 0x7fffffff;
}

async function fetchMlRisk(input: {
  city: string;
  zone: string;
  streakWeeks: number;
}): Promise<{ risk_score: number; tier?: string } | null> {
  if (!ML_BASE) return null;

  try {
    const res = await fetch(`${ML_BASE}/ml/risk-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: input.city,
        zone: input.zone,
        streak_weeks: input.streakWeeks,
      }),
    });

    if (!res.ok) return null;

    const body = (await res.json()) as {
      risk_score?: number;
      tier?: string;
    };

    if (body.risk_score === undefined) return null;

    return {
      risk_score: Number(body.risk_score),
      tier: body.tier,
    };
  } catch {
    return null;
  }
}

function fallbackRiskScore(input: { city: string; zone: string; streakWeeks: number }) {
  const seed = `${input.city}|${input.zone}`.toLowerCase();
  const zoneRisk = 35 + Math.round(hashUnit(seed) * 45);
  const streakReduction = Math.min(15, Math.max(0, input.streakWeeks) * 1.5);
  return Math.max(5, Math.min(95, zoneRisk - streakReduction));
}

export async function getRiskQuote(input: {
  city: string;
  zone: string;
  streakWeeks: number;
  preferredTier?: string | null;
}): Promise<PremiumQuote> {
  const ml = await fetchMlRisk(input);
  const riskScore = ml?.risk_score ?? fallbackRiskScore(input);

  return buildPremiumQuote({
    riskScore,
    streakWeeks: input.streakWeeks,
    preferredTier: input.preferredTier ?? ml?.tier,
  });
}
