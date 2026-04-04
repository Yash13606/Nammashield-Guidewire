"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown, ArrowRight, Shield, Star, Zap, Loader2 } from "lucide-react";
import { Logo } from "@/components/namma/Logo";
import { PLANS } from "@/lib/mockData";
import { useDashboardState } from "@/components/namma/DashboardStateProvider";
import { RiskRing } from "@/components/namma/RiskRing";
import { CountUp } from "@/components/namma/CountUp";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/authStore";
import { useToast } from "@/hooks/use-toast";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";

/* ─── Shared Styles ─── */
const cardShadow = "0 2px 12px rgba(28, 24, 20, 0.07), 0 0 0 1px rgba(28, 24, 20, 0.04)";

const PLAN_GRADIENTS: Record<string, string> = {
  Basic: "linear-gradient(135deg, #9C8C7A, #C4B5A5)",
  Standard: "linear-gradient(135deg, #E85D1A, #F07030)",
  Pro: "linear-gradient(135deg, #16A34A, #22C55E)",
  Surge: "linear-gradient(135deg, #1C1814, #374151)",
};

const PLAN_ACCENT: Record<string, string> = {
  Basic: "#9C8C7A",
  Standard: "#E85D1A",
  Pro: "#16A34A",
  Surge: "#1C1814",
};

/* ─── FAQ Data ─── */
const FAQ_ITEMS = [
  {
    question: "What's included in Pro?",
    answer: "Higher coverage limits, priority payout processing, and access to all trigger types including civil shutdowns.",
  },
  {
    question: "Can I downgrade later?",
    answer: "Yes, you can switch plans at the start of any new coverage week.",
  },
  {
    question: "How does streak discount work?",
    answer: "Maintain 4+ consecutive clean weeks (no payouts) for a 10% discount on your premium.",
  },
];

/* ─── FAQ Accordion Item ─── */
function FAQItem({ item, isOpen, onToggle }: { item: { question: string; answer: string }; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "white" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors"
        style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: "0.875rem", color: "var(--foreground)", background: "transparent", border: "none", cursor: "pointer" }}
      >
        <span>{item.question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 text-sm leading-relaxed" style={{ fontFamily: "var(--font-body)", color: "var(--muted)", fontSize: "0.8125rem", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Left Column: Active Policy Card ─── */
function ActivePolicyCard() {
  const [autoRenew, setAutoRenew] = useState(true);
  const { worker, policy, loading } = useDashboardState();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 h-fit sticky top-6" style={{ boxShadow: cardShadow }}>
        <Skeleton className="h-8 w-40 mb-4" />
        <Skeleton className="h-12 w-full mb-6" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!worker || !policy) {
    return (
      <div className="bg-white rounded-2xl p-6 h-fit sticky top-6" style={{ boxShadow: cardShadow }}>
        <h2 className="text-lg mb-2" style={{ fontFamily: "var(--font-display)" }}>No active policy</h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Complete onboarding to view and manage your coverage.</p>
        <Link href="/onboarding" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium btn-shimmer" style={{ background: "var(--primary)" }}>
          Complete onboarding <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const riskScore = Math.round(Number(policy.risk_score));
  const maxCoverage = Number(policy.coverage_amount);
  const coverageUsedPct = 0; // Default, ideally pulled from state
  const startLabel = policy.start_date ? format(new Date(policy.start_date), "MMM d, yyyy") : "—";
  const endLabel = policy.end_date ? format(new Date(policy.end_date), "MMM d, yyyy") : "—";

  const tierGradient = PLAN_GRADIENTS[policy.tier] ?? PLAN_GRADIENTS.Standard;
  const tierAccent = PLAN_ACCENT[policy.tier] ?? "#E85D1A";

  // Donut chart data
  const donutData = [
    { name: "Used", value: coverageUsedPct, fill: tierAccent },
    { name: "Remaining", value: 100 - coverageUsedPct, fill: "var(--border)" },
  ];

  return (
    <div className="bg-white rounded-2xl overflow-hidden h-fit sticky top-6" style={{ boxShadow: cardShadow }}>
      {/* Gradient header */}
      <div className="relative p-6 pb-8" style={{ background: tierGradient }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white, transparent 60%)" }} />
        <div className="relative z-10">
          <p className="text-xs font-medium mb-1 text-white/60 uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
            Current Plan
          </p>
          <h2 className="text-3xl text-white" style={{ fontFamily: "var(--font-display)" }}>{policy.tier}</h2>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-4xl font-bold text-white" style={{ fontFamily: "var(--font-mono)" }}>
              <CountUp prefix="₹" end={Number(policy.weekly_premium)} />
            </span>
            <span className="text-white/60 text-sm" style={{ fontFamily: "var(--font-mono)" }}>/wk</span>
          </div>
        </div>
        {/* Logo watermark */}
        <div className="absolute right-4 bottom-0 translate-y-1/2 opacity-10">
          <Logo size={90} arrowColor="white" />
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Coverage donut + details */}
        <div className="flex items-center gap-5">
          <div style={{ width: 80, height: 80, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" startAngle={90} endAngle={-270} data={donutData} barSize={8}>
                <RadialBar dataKey="value" cornerRadius={4} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.6875rem" }}>
              Max Coverage
            </p>
            <p className="font-bold text-lg" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
              <CountUp prefix="₹" end={maxCoverage} />
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
              {startLabel} → {endLabel}
            </p>
          </div>
        </div>

        {/* Risk Score */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <RiskRing score={riskScore} size={52} strokeWidth={5} showLabel={false} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)" }}>{riskScore}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.6875rem" }}>
              Risk Score
            </p>
            <p className="font-semibold text-sm" style={{ fontFamily: "var(--font-body)" }}>
              {riskScore}/100 — {riskScore < 35 ? "Low Risk" : riskScore < 70 ? "Standard Risk" : "High Risk"}
            </p>
          </div>
        </div>

        {/* Info pills */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--amber-light)", borderLeft: "3px solid var(--amber)" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--amber)", flexShrink: 0 }}>!</div>
            <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#92400E" }}>
              <strong>Deductible:</strong> First 2 hours not covered
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--accent-light)", borderLeft: "3px solid var(--accent)" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ background: "var(--accent)", flexShrink: 0 }}>🔥</div>
            <div>
              <p className="text-xs font-medium" style={{ fontFamily: "var(--font-body)", color: "#166534" }}>
                {worker.streak_weeks ?? 0} weeks clean
              </p>
              <p className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "#166534" }}>
                10% discount at week 4
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid var(--border)" }} />

        {/* Auto-renew */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>Auto-renew</p>
            <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}>{autoRenew ? "Enabled" : "Disabled"}</p>
          </div>
          <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
        </div>

        {/* Next debit */}
        <div className="rounded-xl p-3.5" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <p className="text-[11px] font-medium mb-0.5" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Next Debit</p>
          <p className="font-semibold text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
            ₹{Number(policy.weekly_premium)} — renews {endLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Plan Card Component ─── */
function PlanCard({
  plan,
  isActive,
  onSelect,
  isSwitching,
}: {
  plan: (typeof PLANS)[0];
  isActive: boolean;
  onSelect: () => void;
  isSwitching: boolean;
}) {
  const gradient = PLAN_GRADIENTS[plan.name] ?? PLAN_GRADIENTS.Standard;
  const accent = PLAN_ACCENT[plan.name] ?? "#E85D1A";

  return (
    <motion.div
      whileHover={!isActive && !isSwitching ? { y: -4, scale: 1.02 } : {}}
      transition={{ duration: 0.2 }}
      onClick={!isActive && !isSwitching ? onSelect : undefined}
      className={`rounded-2xl overflow-hidden relative ${
        !isActive && !isSwitching ? "cursor-pointer" : ""
      }`}
      style={{
        boxShadow: isActive
          ? `0 8px 32px ${accent}25, 0 0 0 2px ${accent}`
          : cardShadow,
        background: "white",
        opacity: isSwitching && !isActive ? 0.6 : 1,
      }}
    >
      {isActive && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white"
            style={{ color: accent, boxShadow: `0 2px 8px ${accent}30` }}>
            <Star size={10} fill={accent} strokeWidth={0} /> Current
          </span>
        </div>
      )}

      {/* Card gradient header */}
      <div className="p-5 relative" style={{ background: gradient, minHeight: 100 }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white, transparent 60%)" }} />
        <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-0.5" style={{ fontFamily: "var(--font-mono)" }}>
          {plan.name}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-mono)" }}>
            ₹{plan.premium}
          </span>
          <span className="text-white/60 text-sm" style={{ fontFamily: "var(--font-mono)" }}>/wk</span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>Max Coverage</span>
          <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
            ₹{plan.maxCoverage.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>Risk Range</span>
          <span className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)", color: accent }}>
            {plan.riskRange}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>Streak Discount</span>
          {plan.streakDiscount
            ? <Check size={14} style={{ color: "#16A34A" }} />
            : <X size={14} style={{ color: "var(--border)" }} />
          }
        </div>
        <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
            {plan.recommended}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Right Column: Plan Comparison ─── */
function PlanComparison() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const { policy, refresh } = useDashboardState();
  const workerId = useAuthStore((s) => s.workerId);
  const { toast } = useToast();

  const tierIdx = PLANS.findIndex((p) => p.name === policy?.tier);
  const activeIndex = tierIdx >= 0 ? tierIdx : 0;

  const handleSwitchPlan = async (planName: string) => {
    if (!workerId || isSwitching) return;
    const plan = PLANS.find((p) => p.name === planName);
    if (!plan) return;

    setIsSwitching(true);
    try {
      const { error } = await supabase
        .from("policies")
        .update({
          tier: plan.name,
          weekly_premium: plan.premium,
          coverage_amount: plan.maxCoverage,
        })
        .eq("worker_id", workerId)
        .eq("status", "active");

      if (error) throw error;

      await refresh();
      toast({
        title: "Plan Updated",
        description: `Successfully switched to the ${planName} plan.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Update Failed",
        description: "Could not switch policies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div>
      {/* Plan Cards Grid */}
      <div className="mb-6">
        <h3
          className="text-xl font-semibold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
        >
          Compare Plans
        </h3>
        <p
          className="text-sm mb-5"
          style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}
        >
          Choose the coverage that fits your work schedule
        </p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map((plan, i) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              isActive={i === activeIndex}
              isSwitching={isSwitching}
              onSelect={() => handleSwitchPlan(plan.name)}
            />
          ))}
        </div>
      </div>

      {/* Upgrade Button */}
      <motion.button
        onClick={() => handleSwitchPlan("Pro")}
        disabled={isSwitching || policy?.tier === "Pro" || policy?.tier === "Surge"}
        className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 mb-6 cursor-pointer btn-shimmer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg,#E85D1A,#F07030)",
          boxShadow: "0 4px 18px rgba(232,93,26,0.35)",
          fontFamily: "var(--font-body)",
          border: "none",
        }}
        whileHover={
          !isSwitching && policy?.tier !== "Pro" && policy?.tier !== "Surge"
            ? { scale: 1.01, boxShadow: "0 6px 24px rgba(232,93,26,0.45)" }
            : {}
        }
        whileTap={
          !isSwitching && policy?.tier !== "Pro" && policy?.tier !== "Surge"
            ? { scale: 0.99 }
            : {}
        }
      >
        {isSwitching ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Zap size={16} />
        )}
        {policy?.tier === "Pro" || policy?.tier === "Surge"
          ? "Already on Pro or Higher"
          : "Upgrade to Pro"}
        {!isSwitching && <ArrowRight size={16} />}
      </motion.button>

      {/* FAQ Section */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}>
          Why upgrade?
        </h4>
        <div className="flex flex-col gap-2">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={i} item={item} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Policy Page ─── */
export default function PolicyPage() {
  return (
    <div className="max-w-[1200px] mx-auto pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <ActivePolicyCard />
        </motion.div>
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
          <PlanComparison />
        </motion.div>
      </div>
    </div>
  );
}
