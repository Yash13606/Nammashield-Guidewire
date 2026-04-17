export type RiskTier = "Basic" | "Standard" | "Pro" | "Surge";

export type PremiumQuote = {
  risk_score: number;
  tier: RiskTier;
  weekly_premium: number;
  coverage_amount: number;
  discount_applied: boolean;
};

const TIER_MULTIPLIER: Record<RiskTier, number> = {
  Basic: 0.85,
  Standard: 1,
  Pro: 1.25,
  Surge: 1.55,
};

const MIN_WEEKLY_PREMIUM = 50;
const MAX_WEEKLY_PREMIUM = 400;
const DISCOUNT_THRESHOLD_WEEKS = 4;
const STREAK_DISCOUNT_FACTOR = 0.9;

export function normalizeTier(input?: string | null): RiskTier | null {
  if (!input) return null;
  const t = input.trim().toLowerCase();
  if (t === "basic") return "Basic";
  if (t === "standard") return "Standard";
  if (t === "pro") return "Pro";
  if (t === "surge") return "Surge";
  return null;
}

export function deriveTierFromRisk(riskScore: number): RiskTier {
  if (riskScore <= 30) return "Basic";
  if (riskScore <= 60) return "Standard";
  if (riskScore <= 80) return "Pro";
  return "Surge";
}

export function buildPremiumQuote(input: {
  riskScore: number;
  streakWeeks?: number | null;
  preferredTier?: string | null;
}): PremiumQuote {
  const risk = Math.max(0, Math.min(100, Number(input.riskScore) || 0));
  const streakWeeks = Math.max(0, Number(input.streakWeeks ?? 0) || 0);

  const preferredTier = normalizeTier(input.preferredTier);
  const tier = preferredTier ?? deriveTierFromRisk(risk);

  const riskFactor = 0.75 + (risk / 100) * 0.75;
  const basePremium = 95;

  let weeklyPremium = Math.round(basePremium * riskFactor * TIER_MULTIPLIER[tier]);
  weeklyPremium = Math.max(MIN_WEEKLY_PREMIUM, Math.min(MAX_WEEKLY_PREMIUM, weeklyPremium));

  const discountApplied = streakWeeks >= DISCOUNT_THRESHOLD_WEEKS;
  if (discountApplied) {
    weeklyPremium = Math.round(weeklyPremium * STREAK_DISCOUNT_FACTOR);
  }

  return {
    risk_score: Math.round(risk * 100) / 100,
    tier,
    weekly_premium: weeklyPremium,
    coverage_amount: Math.round(weeklyPremium * 7),
    discount_applied: discountApplied,
  };
}
