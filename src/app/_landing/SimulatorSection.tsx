"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CloudRain, Thermometer, Wind, Ban, Check } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as any },
});

const premiumShadow =
  "0 10px 40px rgba(232, 93, 26, 0.12), 0 0 0 1px rgba(232, 93, 26, 0.08)";

const CITIES = ["Chennai", "Mumbai", "Delhi", "Bengaluru"] as const;
const TIERS = [
  { label: "Basic", amount: 50 },
  { label: "Standard", amount: 100 },
  { label: "Pro", amount: 150 },
] as const;
const TRIGGERS = [
  { key: "rain", label: "Heavy Rain", icon: CloudRain },
  { key: "heat", label: "Extreme Heat", icon: Thermometer },
  { key: "aqi", label: "AQI Alert", icon: Wind },
  { key: "curfew", label: "Curfew", icon: Ban },
] as const;

export default function SimulatorSection() {
  const [city, setCity] = useState<string>("Chennai");
  const [tierIdx, setTierIdx] = useState(1);
  const [hours, setHours] = useState(4);
  const [triggerKey, setTriggerKey] = useState<string>("rain");

  const premium = TIERS[tierIdx].amount;

  const calculation = useMemo(() => {
    const deductible = 2;
    const coveredHours = Math.max(0, hours - deductible);
    const hourlyRate = premium / 1.647;
    const rawPayout = coveredHours * hourlyRate * 0.7;
    const cap = premium * 1.5;
    const finalPayout = Math.min(rawPayout, cap);
    return { hours, deductible, coveredHours, hourlyRate, rawPayout, cap, finalPayout };
  }, [hours, premium]);

  const selectedTrigger = TRIGGERS.find((t) => t.key === triggerKey) ?? TRIGGERS[0];
  const TriggerIcon = selectedTrigger.icon;

  return (
    <section id="simulator" className="py-16 md:py-32 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div className="text-center mb-12" {...fadeUp(0)}>
          <p
            className="text-xs tracking-[0.2em] uppercase mb-4"
            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
          >
            TRY IT
          </p>
          <h2
            className="text-4xl md:text-5xl mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            See what you&apos;d earn.
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>
            Simulate a disruption in your zone and see your payout calculated in real time.
          </p>
        </motion.div>

        {/* Widget Card */}
        <motion.div
          className="rounded-3xl p-5 sm:p-10 premium-card"
          style={{
            backgroundColor: "white",
            boxShadow: premiumShadow,
          }}
          {...fadeUp(0.15)}
        >
          {/* Inputs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {/* City Select */}
            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-medium tracking-wide uppercase"
                style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
              >
                City
              </label>
              <div className="flex rounded-xl overflow-hidden border overflow-x-auto no-scrollbar" style={{ borderColor: "var(--border)" }}>
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className="flex-1 py-2.5 px-3 min-w-[70px] text-sm font-medium transition-colors duration-150"
                    style={{
                      fontFamily: "var(--font-mono)",
                      backgroundColor: city === c ? "var(--primary)" : "transparent",
                      color: city === c ? "#fff" : "var(--muted)",
                      fontSize: "0.75rem",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Premium Tier */}
            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-medium tracking-wide uppercase"
                style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
              >
                Weekly Premium
              </label>
              <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                {TIERS.map((tier, idx) => (
                  <button
                    key={tier.label}
                    onClick={() => setTierIdx(idx)}
                    className="flex-1 py-2.5 text-xs font-medium transition-colors duration-150"
                    style={{
                      fontFamily: "var(--font-mono)",
                      backgroundColor: tierIdx === idx ? "var(--primary)" : "transparent",
                      color: tierIdx === idx ? "#fff" : "var(--muted)",
                    }}
                  >
                    {tier.label}
                    <br />
                    <span className="opacity-80">&#8377;{tier.amount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Disruption Hours Slider */}
            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-medium tracking-wide uppercase"
                style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
              >
                Disruption Hours
              </label>
              <div className="flex items-center gap-3 px-1">
                <input
                  type="range"
                  min={2}
                  max={8}
                  step={1}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="ns-range-slider flex-1 h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--primary) ${(hours - 2) / 6 * 100}%, var(--border) ${(hours - 2) / 6 * 100}%)`,
                  }}
                />
                <span
                  className="text-lg font-medium min-w-[3ch] text-right"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}
                >
                  {hours}
                </span>
              </div>
              <style dangerouslySetInnerHTML={{ __html: `
                .ns-range-slider::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: var(--primary);
                  border: 3px solid #fff;
                  box-shadow: 0 2px 6px rgba(232, 93, 26, 0.35);
                  cursor: pointer;
                }
                .ns-range-slider::-moz-range-thumb {
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: var(--primary);
                  border: 3px solid #fff;
                  box-shadow: 0 2px 6px rgba(232, 93, 26, 0.35);
                  cursor: pointer;
                }
              `}} />
            </div>
          </div>

          {/* Trigger Type Toggle Pills */}
          <div className="flex flex-wrap gap-3 mb-8">
            {TRIGGERS.map((trigger) => {
              const Icon = trigger.icon;
              const isActive = triggerKey === trigger.key;
              return (
                <button
                  key={trigger.key}
                  onClick={() => setTriggerKey(trigger.key)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                  style={{
                    fontFamily: "var(--font-body)",
                    backgroundColor: isActive ? "var(--primary)" : "var(--primary-light)",
                    color: isActive ? "#fff" : "var(--primary)",
                  }}
                >
                  <Icon size={16} />
                  {trigger.label}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-px w-full mb-8" style={{ backgroundColor: "var(--border)" }} />

          {/* Live Result Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
            <ResultRow label="Disruption Hours" value={`${calculation.hours} hrs`} />
            <ResultRow label="Deductible (2 hrs)" value={`\u2212 2 hrs`} muted />
            <ResultRow label="Covered Hours" value={`${calculation.coveredHours} hrs`} highlight />
            <ResultRow label="Hourly Rate" value={`\u20B9${calculation.hourlyRate.toFixed(2)}`} />
            <ResultRow label="Protection Rate" value={`\u00D7 70%`} />
            <ResultRow label="Raw Payout" value={`\u20B9${calculation.rawPayout.toFixed(2)}`} />
            <ResultRow label={`Cap (1.5\u00D7 premium)`} value={`\u20B9${calculation.cap.toFixed(2)}`} />
            <ResultRow label="" value="" />

            {/* Final Payout */}
            <div className="sm:col-span-2 pt-2">
              <div
                className="rounded-2xl p-6 text-center"
                style={{ backgroundColor: "var(--accent-light)" }}
              >
                <p
                  className="text-xs tracking-[0.15em] uppercase mb-2"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}
                >
                  Your Payout
                </p>
                <motion.p
                   key={calculation.finalPayout}
                   initial={{ scale: 0.9, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   transition={{ type: "spring", stiffness: 300, damping: 20 }}
                   className="text-[28px] md:text-[36px] font-medium"
                   style={{
                     fontFamily: "var(--font-mono)",
                     color: "var(--accent)",
                   }}
                 >
                   &#8377;{calculation.finalPayout.toFixed(2)}
                 </motion.p>
              </div>
            </div>
          </div>

          {/* UPI Mock Notification */}
          <motion.div
            className="mt-6 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center sm:items-start gap-3"
            style={{ backgroundColor: "var(--accent-light)" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Check size={14} color="#fff" />
            </div>
            <p className="text-sm text-center sm:text-left leading-relaxed" style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
              &#10003; &#8377;{calculation.finalPayout.toFixed(2)} sent to your UPI &middot; Ref: NS-SIM-0001 &middot; Just now
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function ResultRow({
  label,
  value,
  highlight,
  muted: isMuted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  if (!label && !value) return <div />;

  return (
    <div className="flex items-center justify-between py-1">
      <span
        className="text-sm"
        style={{
          fontFamily: "var(--font-body)",
          color: isMuted ? "var(--muted)" : "var(--foreground)",
          opacity: isMuted ? 0.7 : 1,
        }}
      >
        {label}
      </span>
      <span
        className="text-sm font-medium"
        style={{
          fontFamily: "var(--font-mono)",
          color: highlight ? "var(--foreground)" : "var(--muted)",
          fontWeight: highlight ? 600 : 400,
        }}
      >
        {value}
      </span>
    </div>
  );
}
