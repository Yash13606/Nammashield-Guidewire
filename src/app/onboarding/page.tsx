"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Phone,
  MapPin,
  CreditCard,
  Check,
  ChevronRight,
  Zap,
  Upload,
} from "lucide-react";
import { Logo } from "@/components/namma/Logo";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase/client";
import { ZONES, PLANS } from "@/lib/mockData";
import { useRouter } from "next/navigation";

/* ─── Animation Config ─── */
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -32 : 32, opacity: 0 }),
};
const slideTransition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as any };

/* ─── Shared Styles ─── */
const cardShadow =
  "0 2px 12px rgba(28, 24, 20, 0.07), 0 0 0 1px rgba(28, 24, 20, 0.04)";

const premiumShadow =
  "0 10px 40px rgba(232, 93, 26, 0.12), 0 0 0 1px rgba(232, 93, 26, 0.08)";

const CITIES = Object.keys(ZONES);

/* ─── Grain Overlay ─── */
function GrainOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.06]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
      }}
    />
  );
}

/* ─── Shield SVG Decoration ─── */
function ShieldDecoration() {
  return (
    <svg
      viewBox="0 0 200 240"
      fill="none"
      className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-[320px] h-[380px] opacity-[0.08]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M100 10 L185 55 L185 130 C185 190 100 230 100 230 C100 230 15 190 15 130 L15 55 Z"
        stroke="white"
        strokeWidth="2.5"
      />
      <path
        d="M100 45 L155 75 L155 125 C155 165 100 195 100 195 C100 195 45 165 45 125 L45 75 Z"
        stroke="white"
        strokeWidth="1.5"
      />
      <path
        d="M100 80 L125 95 L125 120 C125 140 100 115 100 155 C100 155 75 140 75 120 L75 95 Z"
        stroke="white"
        strokeWidth="1"
      />
    </svg>
  );
}

/* ─── Left Brand Panel ─── */
function BrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between relative overflow-hidden"
      style={{
        width: "45%",
        background: "linear-gradient(135deg, #1C1814 0%, var(--primary) 100%)",
        padding: "4rem 3.5rem",
      }}
    >
      <GrainOverlay />
      <ShieldDecoration />

      {/* Top */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 36,
            height: 36,
          }}
        >
          <Logo size={48} />
        </div>
        <span
          className="text-white font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem" }}
        >
          NammaShield
        </span>
      </div>

      {/* Center copy */}
      <div className="relative z-10 max-w-[380px]">
        <h2
          className="text-white leading-[1.1] mb-5"
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "3.25rem",
          }}
        >
          Your income.{" "}
          <span className="not-italic">Protected.</span>
        </h2>
        <p
          className="leading-relaxed"
          style={{
            color: "rgba(255,255,255,0.75)",
            fontFamily: "var(--font-body)",
            fontSize: "0.9375rem",
            maxWidth: 320,
          }}
        >
          NammaShield pays you when rain, heat, or disruptions cut your
          earnings.
        </p>
      </div>

      {/* Bottom stat pills */}
      <div className="relative z-10 flex gap-3 flex-wrap">
        {[
          { icon: "💰", label: "₹127 avg payout" },
          { icon: "⚡", label: "< 5 min onboarding" },
          { icon: "📋", label: "0 paperwork" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="text-sm">{stat.icon}</span>
            <span
              className="text-white"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Progress Bar ─── */
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2.5 mb-4 px-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-2 flex-1 rounded-full transition-all duration-500 overflow-hidden relative"
          style={{
            background: "var(--border)",
            opacity: i < current ? 1 : 0.4,
          }}
        >
          {i < current && (
            <motion.div
              className="absolute inset-0"
              style={{ background: "linear-gradient(90deg, var(--primary), #F07030)" }}
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Step 1: Phone OTP ─── */
function StepPhone({
  onNext,
}: {
  onNext: (data: { phone: string }) => void;
}) {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const loginWithPhone = useAuthStore((s) => s.loginWithPhone);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(val);
    setError(null);
  };

  const handleSendOtp = () => {
    if (phone.length === 10) {
      setSending(true);
      setTimeout(() => {
        setSending(false);
        setOtpSent(true);
      }, 1200);
    }
  };

  const completeLogin = async () => {
    setVerifying(true);
    setError(null);
    try {
      await loginWithPhone(`+91${phone}`);
      setVerifying(false);
      onNext({ phone: `+91${phone}` });
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
      setVerifying(false);
    }
  };

  const handleOtpChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (val && newOtp.every((c) => c !== "")) {
      completeLogin();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <motion.div
      key="step-phone"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={slideTransition}
      className="w-full"
    >
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.75rem",
          color: "var(--foreground)",
          marginBottom: "0.5rem",
        }}
      >
        Enter your WhatsApp number
      </h3>
      <p
        className="text-sm mb-8"
        style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}
      >
        We&apos;ll send a one-time verification code
      </p>

      <div className="flex gap-2 mb-6">
        <div
          className="flex items-center gap-1.5 px-4 rounded-lg border shrink-0"
          style={{
            borderColor: "var(--border)",
            background: "var(--secondary)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.875rem",
            color: "var(--foreground)",
            height: 48,
          }}
        >
          <span>🇮🇳</span>
          <span>+91</span>
        </div>
        <input
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="10-digit number"
          className="flex-1 px-4 rounded-lg border text-sm outline-none transition-all duration-150"
          style={{
            borderColor: "var(--border)",
            background: "white",
            fontFamily: "var(--font-mono)",
            fontSize: "1rem",
            color: "var(--foreground)",
            height: 48,
          }}
          maxLength={10}
        />
      </div>

      {!otpSent ? (
        <button
          onClick={handleSendOtp}
          disabled={phone.length !== 10 || sending}
          className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${phone.length === 10 ? "btn-shimmer" : ""}`}
          style={{
            background:
              phone.length === 10 && !sending
                ? "linear-gradient(135deg, var(--primary), #F07030)"
                : "var(--muted)",
            fontFamily: "var(--font-body)",
            border: "none",
            cursor: phone.length === 10 ? "pointer" : "default",
          }}
        >
          {sending ? "Sending..." : "Send OTP"}
        </button>
      ) : (
        <div>
          <div className="flex gap-2.5 mb-4">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(i, e)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-full h-12 text-center rounded-lg border text-lg font-bold"
                style={{ borderColor: "var(--border)" }}
                maxLength={1}
              />
            ))}
          </div>
          {verifying && <p className="text-xs text-center text-muted">Verifying...</p>}
          {error && <p className="text-xs text-center text-red-500 mt-2">{error}</p>}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Step 2: Platform ID Upload ─── */
function StepPlatformId({
  onNext,
}: {
  onNext: (data: { platform: string; partnerId: string }) => void;
}) {
  const workerId = useAuthStore((s) => s.workerId);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<"upload" | "scanning" | "verified">("upload");
  const [platform, setPlatform] = useState("");

  const handleUpload = () => {
    setState("scanning");
    setPlatform("Swiggy");
    setTimeout(() => setState("verified"), 2000);
  };

  return (
    <motion.div
      key="step-platform"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={slideTransition}
      className="w-full"
    >
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", marginBottom: "0.5rem" }}>
        Partner ID
      </h3>
      <p className="text-sm mb-8 text-muted">Upload your delivery platform ID screenshot</p>

      {state === "upload" && (
        <button
          onClick={handleUpload}
          className="w-full border-2 border-dashed rounded-2xl py-12 flex flex-col items-center gap-3"
          style={{ borderColor: "var(--border)", background: "white" }}
        >
          <Upload className="text-primary" size={32} />
          <span className="font-medium">Tap to upload screenshot</span>
        </button>
      )}

      {state === "scanning" && (
        <div className="w-full p-8 border rounded-2xl text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block mb-4">
             <Zap size={32} className="text-primary" />
          </motion.div>
          <p>Analyzing profile details...</p>
        </div>
      )}

      {state === "verified" && (
        <div className="space-y-6">
          <div className="p-6 bg-accent-light rounded-2xl border border-accent flex items-center gap-4">
             <Check className="text-accent" />
             <div>
               <p className="font-bold">Verified: {platform}</p>
               <p className="text-xs opacity-70">Partner ID: SWG-48721</p>
             </div>
          </div>
          <button
            onClick={async () => {
              if (!workerId) return;
              setSaving(true);
              await supabase.from("workers").update({ partner_id: "SWG-48721", name: platform }).eq("id", workerId);
              setSaving(false);
              onNext({ platform, partnerId: "SWG-48721" });
            }}
            disabled={saving}
            className="w-full py-4 rounded-xl bg-primary text-white font-bold"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Step 3: UPI Verification ─── */
function StepUPI({ onNext }: { onNext: (data: { upi: string }) => void }) {
  const [upi, setUpi] = useState("");
  const [state, setState] = useState<"input" | "verifying" | "verified">("input");

  const handleVerify = () => {
    setState("verifying");
    setTimeout(() => setState("verified"), 1500);
  };

  return (
    <motion.div
      key="step-upi"
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={slideTransition}
      className="w-full"
    >
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", marginBottom: "0.5rem" }}>
        Payment Setup
      </h3>
      <p className="text-sm mb-8 text-muted">Where should we send your payouts?</p>

      <div className="space-y-4">
        <input
          type="text"
          value={upi}
          onChange={(e) => setUpi(e.target.value)}
          placeholder="yourname@upi"
          className="w-full p-4 rounded-xl border"
        />
        {state === "input" && (
          <button onClick={handleVerify} disabled={!upi.includes("@")} className="w-full py-4 rounded-xl bg-primary text-white font-bold">
            Verify UPI
          </button>
        )}
        {state === "verifying" && <p className="text-center">Verifying...</p>}
        {state === "verified" && (
          <div className="space-y-4">
             <div className="p-4 bg-accent-light rounded-xl flex items-center gap-3">
               <Check className="text-accent" /> <span className="font-medium">UPI ID Linked</span>
             </div>
             <button onClick={() => onNext({ upi })} className="w-full py-4 rounded-xl bg-primary text-white font-bold">
               Continue
             </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Step 4: Location & Risk ─── */
function StepLocation({ onNext }: { onNext: (data: { city: string; zone: string; riskScore: number }) => void }) {
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [mlLoading, setMlLoading] = useState(false);

  const cityZones = city ? (ZONES as Record<string, string[]>)[city] || [] : [];

  const handleCalculate = () => {
    if (!city || !zone) return;
    setMlLoading(true);
    setTimeout(() => {
      const score = Math.floor(Math.random() * 40) + 40;
      setMlLoading(false);
      onNext({ city, zone, riskScore: score });
    }, 2000);
  };

  return (
    <motion.div key="step-location" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} className="w-full">
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", marginBottom: "0.5rem" }}>
        Service Area
      </h3>
      <p className="text-sm mb-8 text-muted">
        We use ML to calculate your area risk score to suggest the best protection.
      </p>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-2">
          {CITIES.map(c => (
            <button key={c} onClick={() => { setCity(c); setZone(""); }} className={`p-3 rounded-xl border transition-all ${city === c ? "border-primary bg-primary-light text-primary" : "bg-white"}`}>
              {c}
            </button>
          ))}
        </div>
        {city && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted">SELECT ZONE</label>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {cityZones.map(z => (
                <button key={z} onClick={() => setZone(z)} className={`w-full text-left p-3 rounded-xl border transition-all ${zone === z ? "border-primary bg-primary-light text-primary" : "bg-white"}`}>
                  {z}
                </button>
              ))}
            </div>
          </div>
        )}
        {zone && (
          <button onClick={handleCalculate} disabled={mlLoading} className="w-full py-4 rounded-xl bg-primary text-white font-bold shadow-lg">
            {mlLoading ? "Calculating Risk..." : "Check Area Risk"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Step 5: Choose Protection ─── */
function StepPlanSelection({
  riskScore,
  onNext,
}: {
  riskScore: number;
  onNext: (data: { tier: string; weeklyPremium: number; coverageAmount: number }) => void;
}) {
  const [selectedTier, setSelectedTier] = useState("Standard");

  return (
    <motion.div key="step-plan" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} className="w-full">
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", marginBottom: "0.5rem" }}>
        Choose Protection
      </h3>
      <p className="text-sm mb-8 text-muted">
        Based on your risk score, we recommend the tier that covers most earnings.
      </p>

      <div className="space-y-6">
        <div className="p-5 bg-white border rounded-2xl flex items-center justify-between" style={{ boxShadow: premiumShadow }}>
          <div>
            <p className="text-xs font-bold text-muted">LOCAL RISK SCORE</p>
            <p className="text-4xl font-mono font-bold" style={{ color: riskScore > 60 ? "var(--primary)" : "var(--accent)" }}>
              {riskScore}<span className="text-sm opacity-50">/100</span>
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${riskScore > 60 ? "bg-amber-light text-amber" : "bg-accent-light text-accent"}`}>
            {riskScore > 60 ? "HIGH RISK" : "MODERATE"}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-muted tracking-widest px-1">AVAILABLE PLANS</label>
          <div className="space-y-2">
            {PLANS.map(plan => {
              const isSel = selectedTier === plan.name;
              const isRecommended =
                (riskScore > 70 && plan.name === "Pro") ||
                (riskScore <= 70 && riskScore >= 45 && plan.name === "Standard") ||
                (riskScore < 45 && plan.name === "Basic");

              return (
                <button
                  key={plan.name}
                  onClick={() => setSelectedTier(plan.name)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all relative ${isSel ? "border-primary bg-primary-light" : "bg-white border-border"}`}
                >
                  {isRecommended && (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-white text-[8px] font-bold rounded-bl-lg">
                      RECOMMENDED
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`font-bold ${isSel ? "text-primary" : ""}`}>{plan.name} Plan</p>
                      <p className="text-xs text-muted">Up to ₹{plan.maxCoverage.toLocaleString()} cover</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold">₹{plan.premium}</p>
                      <p className="text-[10px] text-muted">/ WEEK</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => {
            const p = PLANS.find(x => x.name === selectedTier)!;
            onNext({ tier: p.name, weeklyPremium: p.premium, coverageAmount: p.maxCoverage });
          }}
          className="w-full py-4 rounded-xl bg-primary text-white font-bold shadow-lg"
        >
          Review & Activate
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Step 6: Activate Policy ─── */
function StepActivate({ data }: { data: any }) {
  const [activating, setActivating] = useState(false);
  const router = useRouter();
  const workerId = useAuthStore(s => s.workerId);
  const setOnboardingComplete = useAuthStore(s => s.setOnboardingComplete);

  const handleActivate = async () => {
    if (!workerId) return;
    setActivating(true);
    try {
      const { error: polErr } = await supabase.from("policies").insert({
        worker_id: workerId,
        tier: data.tier,
        weekly_premium: data.weeklyPremium,
        coverage_amount: data.coverageAmount,
        risk_score: data.riskScore,
        status: "active",
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 604800000).toISOString().split("T")[0]
      });
      if (polErr) throw polErr;
      await supabase.from("workers").update({ is_onboarded: true }).eq("id", workerId);
      setOnboardingComplete();
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
    } finally {
      setActivating(false);
    }
  };

  return (
    <motion.div key="step-activate" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} className="w-full">
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", marginBottom: "0.5rem" }}>
        Review & Activate
      </h3>
      <div className="space-y-4 mb-8">
        <div className="p-5 bg-white border rounded-2xl space-y-3" style={{ boxShadow: premiumShadow }}>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Plan selected:</span>
            <span className="font-bold">{data.tier}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Weekly Premium:</span>
            <span className="font-bold font-mono">₹{data.weeklyPremium}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Coverage Limit:</span>
            <span className="font-bold text-primary font-mono">₹{data.coverageAmount}</span>
          </div>
          <hr className="border-border" />
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Delivery Area:</span>
            <span className="font-medium">{data.zone}, {data.city}</span>
          </div>
        </div>
      </div>
      <button onClick={handleActivate} className="w-full py-5 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl">
        {activating ? "Activating..." : "Confirm & Activate"}
      </button>
    </motion.div>
  );
}

/* ─── Main Onboarding Component ─── */
export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: "",
    platform: "",
    partnerId: "",
    upi: "",
    city: "",
    zone: "",
    riskScore: 0,
    tier: "Standard",
    weeklyPremium: 100,
    coverageAmount: 700,
  });

  const totalSteps = 6;

  const goNext = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(s => s + 1);
  };

  const stepHeadings: Record<number, string> = {
    1: "Phone Verification",
    2: "Platform Setup",
    3: "Payment Link",
    4: "Location & Risk",
    5: "Choose Protection",
    6: "Final Review",
  };

  return (
    <div className="flex min-h-screen">
      <BrandPanel />
      <div className="flex-1 p-8 lg:p-24 bg-background">
        <div className="max-w-md mx-auto h-full flex flex-col">
          <ProgressBar current={step} total={totalSteps} />
          <div className="px-1 mb-6 flex justify-between">
            <p className="text-[10px] font-mono text-muted uppercase tracking-widest">Step {step} of {totalSteps}</p>
            <p className="text-[10px] font-mono text-muted uppercase tracking-widest">{stepHeadings[step]}</p>
          </div>
          <div className="flex-1 flex items-center">
            <AnimatePresence mode="wait">
              {step === 1 && <StepPhone onNext={goNext} />}
              {step === 2 && <StepPlatformId onNext={goNext} />}
              {step === 3 && <StepUPI onNext={goNext} />}
              {step === 4 && <StepLocation onNext={goNext} />}
              {step === 5 && <StepPlanSelection riskScore={formData.riskScore} onNext={goNext} />}
              {step === 6 && <StepActivate data={formData} />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
