"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator as CalculatorIcon,
  MapPin,
  Truck,
  Flame,
  Wind,
  Shield,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ZONES, CITY_RISK } from "@/lib/mockData";
import { Loader2 } from "lucide-react";

/* ─── Constants ─── */
const CITIES = Object.keys(ZONES);

const CONTRIBUTING_FACTORS = [
  { label: "Weather Risk", icon: Flame, baseValue: 0.72, color: "#E85D1A" },
  { label: "AQI Risk", icon: Wind, baseValue: 0.45, color: "#D97706" },
  { label: "Zone Exposure", icon: MapPin, baseValue: 0.61, color: "#E85D1A" },
  {
    label: "Claim-Free Streak Bonus",
    icon: Shield,
    baseValue: -0.20,
    color: "#16A34A",
  },
];

/* ─── Calculation Helpers ─── */
function computeRiskScore(
  city: string,
  zoneIndex: number,
  platform: string,
  weeksClean: number
) {
  const baseScore = (CITY_RISK[city] || 0) * 100;
  const zoneModifier = zoneIndex * 3;
  const platformModifier = platform === "Zomato" ? 2 : 0;
  const streakBonus = Math.min(weeksClean * 0.5, 15);
  return Math.max(
    0,
    Math.min(100, Math.round(baseScore + zoneModifier + platformModifier - streakBonus))
  );
}

function computePremium(score: number, weeksClean: number) {
  let tier: string;
  let premium: number;
  let coverage: number;

  if (score < 35) {
    tier = "Basic";
    premium = 50;
    coverage = 350;
  } else if (score < 70) {
    tier = "Standard";
    premium = 100;
    coverage = 700;
  } else if (score < 85) {
    tier = "Pro";
    premium = 175;
    coverage = 1200;
  } else {
    tier = "Surge";
    premium = 250;
    coverage = 2000;
  }

  const originalPremium = premium;
  const hasDiscount = weeksClean >= 4;
  if (hasDiscount) {
    premium = Math.round(premium * 0.9);
  }

  return { tier, premium, originalPremium, coverage, hasDiscount };
}

function getScoreColor(score: number) {
  if (score < 35) return "#16A34A";
  if (score < 70) return "#D97706";
  return "#DC2626";
}

function getScoreLabel(score: number) {
  if (score < 35) return "Low Risk";
  if (score < 70) return "Standard Risk";
  return "High Risk";
}

function getTierColor(tier: string) {
  switch (tier) {
    case "Basic":
      return "#9C8C7A";
    case "Standard":
      return "#E85D1A";
    case "Pro":
      return "#16A34A";
    case "Surge":
      return "#DC2626";
    default:
      return "#E85D1A";
  }
}

/* ─── Shared Styles ─── */
const cardShadow =
  "0 2px 12px rgba(28, 24, 20, 0.07), 0 0 0 1px rgba(28, 24, 20, 0.04)";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-[#E2D9CF] bg-white text-sm text-[#1C1814] placeholder:text-[#9C8C7A] focus:outline-none focus:ring-2 focus:ring-[#E85D1A]/30 focus:border-[#E85D1A] transition-all duration-150";

const TIER_GRADIENTS: Record<string, string> = {
  Basic: "linear-gradient(135deg, #9C8C7A, #C4B5A5)",
  Standard: "linear-gradient(135deg, #E85D1A, #F07030)",
  Pro: "linear-gradient(135deg, #16A34A, #22C55E)",
  Surge: "linear-gradient(135deg, #1C1814, #374151)",
};

/* ─── Fade-Up Animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

/* ─── Risk Score Gradient Bar ─── */
function RiskGradientBar({ score }: { score: number }) {
  const position = Math.max(0, Math.min(100, score));
  const scoreColor = getScoreColor(score);

  return (
    <div className="w-full mt-2 mb-1">
      {/* Gradient track */}
      <div className="relative w-full h-2 rounded-full overflow-visible">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(to right, #16A34A, #EAB308, #E85D1A, #DC2626)",
          }}
        />
        {/* Needle */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
          initial={{ left: "0%" }}
          animate={{ left: `${position}%` }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{ marginLeft: -8 }}
        >
          <svg
            width="16"
            height="12"
            viewBox="0 0 16 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 12L0 0H16L8 12Z" fill={scoreColor} />
          </svg>
          <div
            className="w-3 h-3 rounded-full border-2 border-white mt-[-1px]"
            style={{ background: scoreColor, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
          />
        </motion.div>
      </div>
      {/* Scale labels */}
      <div className="flex justify-between mt-3">
        <span
          className="text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.6875rem" }}
        >
          0
        </span>
        <span
          className="text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.6875rem" }}
        >
          25
        </span>
        <span
          className="text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.6875rem" }}
        >
          50
        </span>
        <span
          className="text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.6875rem" }}
        >
          75
        </span>
        <span
          className="text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.6875rem" }}
        >
          100
        </span>
      </div>
    </div>
  );
}

/* ─── Contributing Factor Bar ─── */
function FactorBar({
  factor,
  index,
  score,
  weeksClean,
}: {
  factor: (typeof CONTRIBUTING_FACTORS)[0];
  index: number;
  score: number;
  weeksClean: number;
}) {
  const Icon = factor.icon;
  const isNegative = factor.baseValue < 0;

  // Adjust values slightly based on score and inputs
  let displayValue = factor.baseValue;
  if (index === 2) {
    // Zone exposure scales with score
    displayValue = Math.min(1, Math.max(0.2, score / 120));
  }
  if (index === 3) {
    // Streak bonus scales with weeks
    displayValue = -Math.min(0.4, weeksClean * 0.008);
  }

  const barWidth = Math.abs(displayValue) * 100;
  const barColor = isNegative ? "#16A34A" : factor.color;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-md"
            style={{
              width: 28,
              height: 28,
              background: isNegative
                ? "var(--accent-light)"
                : "rgba(232, 93, 26, 0.1)",
            }}
          >
            <Icon size={14} style={{ color: barColor }} />
          </div>
          <span
            className="text-sm font-medium"
            style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
          >
            {factor.label}
          </span>
        </div>
        <span
          className="text-sm font-medium"
          style={{
            fontFamily: "var(--font-mono)",
            color: barColor,
            fontSize: "0.875rem",
          }}
        >
          {isNegative ? "" : "+"}
          {displayValue.toFixed(2)}
        </span>
      </div>
      {/* Bar track */}
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background: "#E2D9CF" }}
      >
        {isNegative ? (
          <motion.div
            className="h-full rounded-full"
            style={{
              background: barColor,
              marginLeft: "auto",
              width: 0,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] as any }}
          />
        ) : (
          <motion.div
            className="h-full rounded-full"
            style={{ background: barColor }}
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] as any }}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Main Calculator Component ─── */
export default function CalculatorPage() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [platform, setPlatform] = useState("");
  const [weeksClean, setWeeksClean] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [mlResult, setMlResult] = useState<{
    risk_score: number;
    tier: string;
    weekly_premium: number;
  } | null>(null);
  const [mlLoading, setMlLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cityZones = city ? ZONES[city] || [] : [];

  const isFormComplete = city !== "" && zone !== "" && platform !== "";

  const zoneIndex = useMemo(
    () => (zone ? cityZones.indexOf(zone) : -1),
    [zone, cityZones]
  );

  useEffect(() => {
    if (!city || !zone) {
      setMlResult(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setMlLoading(true);
      const base =
        process.env.NEXT_PUBLIC_ML_API_URL?.replace(/\/$/, "") ?? "";
      try {
        if (!base) {
          setMlResult(null);
          return;
        }
        const res = await fetch(`${base}/ml/risk-score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city,
            zone,
            streak_weeks: weeksClean,
          }),
        });
        if (res.ok) {
          const j = (await res.json()) as {
            risk_score: number;
            tier: string;
            weekly_premium: number;
          };
          setMlResult(j);
        } else {
          setMlResult(null);
        }
      } catch {
        setMlResult(null);
      } finally {
        setMlLoading(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [city, zone, weeksClean]);

  const score = useMemo(() => {
    if (!isFormComplete) return 0;
    if (mlResult) return Math.round(mlResult.risk_score);
    return computeRiskScore(city, zoneIndex, platform, weeksClean);
  }, [
    isFormComplete,
    mlResult,
    city,
    zoneIndex,
    platform,
    weeksClean,
  ]);

  const premium = useMemo(() => {
    if (!isFormComplete) return null;
    if (mlResult) {
      let p = Number(mlResult.weekly_premium);
      const originalPremium = p;
      const hasDiscount = weeksClean >= 4;
      if (hasDiscount) p = Math.round(p * 0.9);
      const coverage = Math.round(Number(mlResult.weekly_premium) * 7);
      return {
        tier: mlResult.tier,
        premium: p,
        originalPremium,
        coverage,
        hasDiscount,
      };
    }
    return computePremium(score, weeksClean);
  }, [isFormComplete, mlResult, score, weeksClean]);

  const handleCalculate = () => {
    if (isFormComplete) {
      setShowResults(true);
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCity(e.target.value);
    setZone("");
    setShowResults(false);
  };

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setZone(e.target.value);
    setShowResults(false);
  };

  const handlePlatformSelect = (p: string) => {
    setPlatform(p);
    setShowResults(false);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeeksClean(parseInt(e.target.value, 10));
  };

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col items-center pb-20">
      <div className="w-full" style={{ maxWidth: 680 }}>
        {/* ─── Header ─── */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="inline-flex items-center justify-center rounded-xl mb-5"
            style={{
              width: 52,
              height: 52,
              background: "var(--primary-light)",
            }}
          >
            <CalculatorIcon size={26} style={{ color: "var(--primary)" }} />
          </div>
          <h1
            className="mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.25rem",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              color: "var(--foreground)",
            }}
          >
            Calculate Your Risk &amp; Premium
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: "var(--muted)",
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            See how your location, platform, and history affect your protection
            cost.
          </p>
        </motion.div>

        {/* ─── Form Card ─── */}
        <motion.div
          className="bg-white rounded-2xl p-6 stat-card"
          style={{ boxShadow: cardShadow }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="space-y-6">
            {/* 1. City Dropdown */}
            <div>
              <label
                className="block text-xs mb-2 font-medium"
                style={{
                  color: "var(--muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                City
              </label>
              <select
                value={city}
                onChange={handleCityChange}
                className={inputClass}
                style={{
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239C8C7A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                }}
              >
                <option value="">Select your city</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Zone Dropdown */}
            <AnimatePresence>
              {city && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label
                    className="block text-xs mb-2 font-medium"
                    style={{
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Zone
                  </label>
                  <select
                    value={zone}
                    onChange={handleZoneChange}
                    className={inputClass}
                    style={{
                      fontFamily: "var(--font-body)",
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239C8C7A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 16px center",
                    }}
                  >
                    <option value="">Select your zone</option>
                    {cityZones.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3. Platform Selection (radio cards) */}
            <div>
              <label
                className="block text-xs mb-2 font-medium"
                style={{
                  color: "var(--muted)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Delivery Platform
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["Swiggy", "Zomato"].map((p) => {
                  const isSelected = platform === p;
                  return (
                    <button
                      key={p}
                      onClick={() => handlePlatformSelect(p)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-lg border text-sm transition-all duration-150 cursor-pointer"
                      style={{
                        borderColor: isSelected
                          ? "var(--primary)"
                          : "var(--border)",
                        background: isSelected
                          ? "var(--primary-light)"
                          : "white",
                        fontFamily: "var(--font-body)",
                        color: isSelected
                          ? "var(--primary)"
                          : "var(--foreground)",
                        fontWeight: isSelected ? 600 : 400,
                        boxShadow: isSelected
                          ? "0 0 0 3px rgba(232, 93, 26, 0.12)"
                          : "none",
                      }}
                    >
                      <Truck size={16} />
                      <span className="flex-1 text-left">{p}</span>
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150"
                        style={{
                          borderColor: isSelected
                            ? "var(--primary)"
                            : "var(--border)",
                        }}
                      >
                        {isSelected && (
                          <motion.div
                            className="w-2 h-2 rounded-full"
                            style={{ background: "var(--primary)" }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Weeks Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="block text-xs font-medium"
                  style={{
                    color: "var(--muted)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Weeks of Clean History
                </label>
                <span
                  className="text-sm font-medium"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.875rem",
                    color: weeksClean >= 4 ? "var(--accent)" : "var(--foreground)",
                  }}
                >
                  {weeksClean} week{weeksClean !== 1 ? "s" : ""}
                  {weeksClean >= 4 && (
                    <span
                      className="ml-2 text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--accent-light)",
                        color: "var(--accent)",
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                      }}
                    >
                      10% discount!
                    </span>
                  )}
                </span>
              </div>
              <div className="relative w-full">
                <input
                  type="range"
                  min={0}
                  max={52}
                  step={1}
                  value={weeksClean}
                  onChange={handleSliderChange}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${
                      (weeksClean / 52) * 100
                    }%, #E2D9CF ${(weeksClean / 52) * 100}%, #E2D9CF 100%)`,
                  }}
                />
                {/* Custom thumb */}
                <style>{`
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: white;
                    border: 2.5px solid var(--primary);
                    box-shadow: 0 1px 6px rgba(0,0,0,0.12);
                    cursor: pointer;
                    transition: box-shadow 0.15s;
                  }
                  input[type="range"]::-webkit-slider-thumb:hover {
                    box-shadow: 0 1px 8px rgba(232, 93, 26, 0.3);
                  }
                  input[type="range"]::-moz-range-thumb {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    background: white;
                    border: 2.5px solid var(--primary);
                    box-shadow: 0 1px 6px rgba(0,0,0,0.12);
                    cursor: pointer;
                  }
                `}</style>
              </div>
              <div className="flex justify-between mt-1.5">
                <span
                  className="text-xs"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--muted)",
                  }}
                >
                  0
                </span>
                <span
                  className="text-xs"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--muted)",
                  }}
                >
                  52 weeks
                </span>
              </div>
            </div>

            {mlLoading && city && zone && (
              <p
                className="text-xs flex items-center gap-2 justify-center"
                style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}
              >
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                Updating live estimate from ML…
              </p>
            )}

            {/* Calculate Button */}
            <motion.button
              onClick={handleCalculate}
              disabled={!isFormComplete}
              className="w-full py-3.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-150"
              style={{
                background: isFormComplete
                  ? "var(--primary)"
                  : "var(--muted)",
                boxShadow: isFormComplete
                  ? "0 2px 8px rgba(232,93,26,0.35)"
                  : "none",
                fontFamily: "var(--font-body)",
                opacity: isFormComplete ? 1 : 0.4,
                cursor: isFormComplete ? "pointer" : "not-allowed",
              }}
              whileTap={isFormComplete ? { scale: 0.98 } : undefined}
            >
              Calculate My Premium
              <ArrowRight size={16} />
            </motion.button>
          </div>
        </motion.div>

        {/* ─── Results Section ─── */}
        <AnimatePresence>
          {showResults && premium && (
            <motion.div
              className="mt-8 space-y-6"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* ── Risk Score Card ── */}
              <div className="bg-white rounded-2xl p-6 stat-card" style={{ boxShadow: cardShadow }}>
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                  style={{ background: `linear-gradient(to right, ${getScoreColor(score)}, transparent)` }} />
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-medium" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Your Risk Score
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: score < 35 ? "var(--accent-light)" : score < 70 ? "var(--amber-light)" : "#FEE2E2", color: getScoreColor(score), fontFamily: "var(--font-mono)" }}>
                    {getScoreLabel(score)}
                  </span>
                </div>
                <div className="flex items-end gap-2 mb-4">
                  <motion.span
                    style={{ fontFamily: "var(--font-mono)", fontSize: "2.5rem", fontWeight: 700, color: getScoreColor(score), lineHeight: 1 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {score}
                  </motion.span>
                  <span className="mb-1" style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", color: "var(--muted)" }}>
                    / 100
                  </span>
                </div>
                <RiskGradientBar score={score} />
              </div>

              {/* ── Contributing Factors Card ── */}
              <div className="bg-white rounded-2xl p-6 stat-card" style={{ boxShadow: cardShadow }}>
                <h3 className="mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--foreground)", letterSpacing: "-0.015em" }}>
                  What&apos;s driving your score
                </h3>
                <div className="space-y-5">
                  {CONTRIBUTING_FACTORS.map((factor, i) => (
                    <FactorBar key={factor.label} factor={factor} index={i} score={score} weeksClean={weeksClean} />
                  ))}
                </div>
              </div>

              {/* ── Premium Output Card ── */}
              <motion.div
                className="rounded-2xl overflow-hidden relative"
                style={{ boxShadow: "0 8px 40px rgba(232,93,26,0.15), 0 0 0 1px rgba(232,93,26,0.1)" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {/* Gradient Header */}
                <div className="relative p-6 pb-8"
                  style={{ background: TIER_GRADIENTS[premium.tier] ?? "linear-gradient(135deg, #E85D1A, #F07030)" }}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white, transparent 60%)" }} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/70 text-xs font-medium uppercase tracking-widest" style={{ fontFamily: "var(--font-mono)" }}>
                        Recommended Plan
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                        {premium.tier}
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "3rem", fontWeight: 700, color: "white", lineHeight: 1, letterSpacing: "-0.03em" }}>
                        ₹{premium.premium}
                      </span>
                      <span className="mb-2 text-white/60" style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>/week</span>
                    </div>
                    {premium.hasDiscount && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm line-through text-white/50" style={{ fontFamily: "var(--font-mono)" }}>₹{premium.originalPremium}/wk</span>
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-white/20 text-white border border-white/20">
                          🔥 −10% streak bonus
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Body */}
                <div className="bg-white p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.6875rem" }}>Max Coverage</p>
                      <p className="text-xl font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>₹{premium.coverage.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center icon-chip-orange">
                      <Shield size={18} />
                    </div>
                  </div>

                  {/* CTA */}
                  <motion.button
                    onClick={() => router.push("/onboarding")}
                    className="w-full py-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 btn-shimmer"
                    style={{ background: "linear-gradient(135deg,#E85D1A,#F07030)", boxShadow: "0 4px 18px rgba(232,93,26,0.35)", fontFamily: "var(--font-body)", cursor: "pointer", border: "none" }}
                    whileHover={{ scale: 1.01, boxShadow: "0 6px 24px rgba(232,93,26,0.45)" }}
                    whileTap={{ scale: 0.99 }}
                  >
                    Activate This Plan
                    <ArrowRight size={16} />
                  </motion.button>
                  <p className="text-center text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
                    Premium auto-deducted weekly. Cancel anytime.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom spacer */}
        <div className="h-16" />
      </div>
    </div>
  );
}
