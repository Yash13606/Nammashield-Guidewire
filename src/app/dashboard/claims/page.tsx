"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Sun,
  CloudRain,
  Thermometer,
  Wind,
  Loader2,
  IndianRupee,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuthStore } from "@/lib/authStore";
import { useDashboardState } from "@/components/namma/DashboardStateProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import Link from "next/link";
import { CountUp } from "@/components/namma/CountUp";
import { apiGetWorkerClaims, type WorkerClaimRow } from "@/lib/api/client";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const cardShadow = "0 2px 12px rgba(28, 24, 20, 0.07), 0 0 0 1px rgba(28, 24, 20, 0.04)";

function Card({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div {...fadeUp(delay)} className={`bg-white rounded-2xl p-6 stat-card ${className}`} style={{ boxShadow: cardShadow }}>
      {children}
    </motion.div>
  );
}

type TriggerIconProps = { label: string | null; size?: number };

function TriggerIcon({ label, size = 18 }: TriggerIconProps) {
  const t = (label ?? "").toLowerCase();
  if (t.includes("rain") || t.includes("flood")) return <CloudRain size={size} className="text-blue-500" />;
  if (t.includes("heat")) return <Thermometer size={size} style={{ color: "#E85D1A" }} />;
  if (t.includes("aqi") || t.includes("air")) return <Wind size={size} style={{ color: "#7C3AED" }} />;
  if (t.includes("shutdown") || t.includes("civil") || t.includes("curfew")) return <AlertTriangle size={size} className="text-red-500" />;
  return <Sun size={size} style={{ color: "var(--muted)" }} />;
}

function claimBorderColor(label: string | null) {
  const t = (label ?? "").toLowerCase();
  if (t.includes("rain") || t.includes("flood")) return "#3B82F6";
  if (t.includes("heat")) return "#E85D1A";
  if (t.includes("aqi")) return "#7C3AED";
  if (t.includes("shutdown") || t.includes("civil")) return "#DC2626";
  return "var(--border)";
}

type ClaimRow = WorkerClaimRow;

// Custom tooltip for area chart
const AreaTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl p-3 border" style={{ borderColor: "var(--border)", boxShadow: cardShadow, fontFamily: "var(--font-body)", fontSize: "0.8125rem" }}>
      <p className="text-xs mb-1" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{label}</p>
      <p className="font-bold" style={{ color: "#16A34A" }}>₹{Number(payload[0]?.value ?? 0).toLocaleString("en-IN")}</p>
    </div>
  );
};

export default function ClaimsPage() {
  const workerId = useAuthStore((s) => s.workerId);
  const { policy, loading: profileLoading } = useDashboardState();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<ClaimRow[]>([]);

  useEffect(() => {
    if (!workerId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { claims: data } = await apiGetWorkerClaims(workerId);
        if (!cancelled) setClaims(data as ClaimRow[]);
      } catch (e) {
        console.error(e);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [workerId]);

  const totalEarned = claims
    .filter((c) => c.status === "auto_approved")
    .reduce((s, c) => s + Number(c.payout_amount ?? 0), 0);
  const pending = claims.filter((c) => c.status === "watchlist").length;
  const paidCount = claims.filter((c) => c.status === "auto_approved").length;

  // Build area chart data from claims (last 10, ascending)
  const chartData = [...claims]
    .filter((c) => c.status === "auto_approved" && Number(c.payout_amount) > 0)
    .slice(0, 10)
    .reverse()
    .map((c) => ({
      date: format(new Date(c.created_at), "dd MMM"),
      amount: Number(c.payout_amount),
    }));

  if (profileLoading || loading) {
    return (
      <div className="max-w-[1200px] mx-auto space-y-6 pb-20">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="max-w-[1200px] mx-auto pb-20">
        <Card>
          <div className="text-center py-12">
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>No active policy — complete onboarding to see claims.</p>
            <Link href="/onboarding" className="inline-flex items-center gap-2 text-[var(--primary)] font-medium text-sm">
              Go to onboarding <ArrowRight size={14} />
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-20">

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card delay={0.05} className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
            style={{ background: "linear-gradient(to right, #16A34A, transparent)" }} />
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem" }}>
              Total Credited
            </p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center icon-chip-green">
              <IndianRupee size={14} />
            </div>
          </div>
          <div className="flex items-end gap-1 text-[var(--accent)]">
            <span className="text-3xl font-bold tracking-tighter" style={{ fontFamily: "var(--font-mono)" }}>
              ₹<CountUp end={totalEarned} />
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
            via UPI (simulated)
          </p>
        </Card>

        <Card delay={0.1} className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
            style={{ background: "linear-gradient(to right, #D97706, transparent)" }} />
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem" }}>
              In Review
            </p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center icon-chip-amber">
              <Loader2 size={14} />
            </div>
          </div>
          <div className="flex items-end gap-1 text-[var(--amber)]">
            <span className="text-3xl font-bold tracking-tighter" style={{ fontFamily: "var(--font-mono)" }}>
              {pending}
            </span>
            <span className="text-sm mb-1" style={{ color: "var(--muted)" }}>claims</span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
            awaiting fraud review
          </p>
        </Card>

        <Card delay={0.15} className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
            style={{ background: "linear-gradient(to right, #E85D1A, transparent)" }} />
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem" }}>
              Auto-Approved
            </p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center icon-chip-orange">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-bold tracking-tighter" style={{ fontFamily: "var(--font-mono)", color: "#E85D1A" }}>
              {paidCount}
            </span>
            <span className="text-sm mb-1" style={{ color: "var(--muted)" }}>claims</span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
            zero-touch payouts
          </p>
        </Card>
      </div>

      {/* ── Payout Area Chart ── */}
      {chartData.length > 0 && (
        <Card delay={0.18}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-medium" style={{ fontFamily: "var(--font-display)" }}>Payout History</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                Auto-approved payouts over time
              </p>
            </div>
          </div>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="payoutGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<AreaTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#16A34A" strokeWidth={2} fill="url(#payoutGradient)" dot={{ fill: "#16A34A", r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── Claims Timeline ── */}
      <div>
        <div className="flex items-baseline justify-between mb-4 px-1">
          <h3 className="text-xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Claim History
          </h3>
          <span className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
            {claims.length} total
          </span>
        </div>

        {claims.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-3xl mb-2">🌤️</div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No claims yet. When a disruption hits your zone, payouts appear here automatically.
              </p>
            </div>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline vertical line */}
            <div className="absolute left-[22px] top-4 bottom-4 w-[2px] rounded-full hidden sm:block"
              style={{ background: "linear-gradient(to bottom, var(--border), transparent)" }} />

            <div className="space-y-4">
              {claims.map((payout, index) => {
                const isCompleted = payout.status === "auto_approved";
                const isProcessing = payout.status === "watchlist" || payout.status === "flagged";
                const isPayoutFailed = payout.status === "payout_failed" || payout.payout_status === "failed";
                const et = payout.trigger_events?.event_type ?? null;
                const label = et?.replace(/_/g, " ") ?? "Disruption";
                const borderColor = claimBorderColor(et);

                return (
                  <motion.div
                    key={payout.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                    className="flex gap-4 sm:gap-6"
                  >
                    {/* Timeline dot */}
                    <div className="hidden sm:flex flex-col items-center pt-5 shrink-0" style={{ width: 44 }}>
                      <div className="relative w-4 h-4 rounded-full border-2 border-white z-10"
                        style={{ background: isCompleted ? "#16A34A" : isProcessing ? "#D97706" : "var(--border)", boxShadow: "0 0 0 3px var(--background)" }} />
                    </div>

                    {/* Claim card */}
                    <div className="flex-1 bg-white rounded-2xl p-5 overflow-hidden stat-card"
                      style={{ boxShadow: cardShadow, borderLeft: `3px solid ${borderColor}` }}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div className="flex-1 flex gap-4">
                          <div className="shrink-0 flex flex-col items-center">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
                              style={{
                                background: isProcessing ? "var(--amber-light)" : "var(--secondary)",
                                border: `1px solid ${isProcessing ? "rgba(217,119,6,0.2)" : "var(--border)"}`,
                              }}>
                              <TriggerIcon label={label} size={20} />
                            </div>
                          </div>
                          <div className="flex-1 py-0.5">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-mono uppercase tracking-wider"
                                style={{ color: "var(--muted)" }}>
                                {format(new Date(payout.created_at), "dd MMM yyyy · HH:mm")}
                              </span>
                              {isProcessing && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                                  style={{ background: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A" }}>
                                  Review
                                </span>
                              )}
                            </div>
                            <h4 className="text-lg font-semibold tracking-tight capitalize mb-1"
                              style={{ fontFamily: "var(--font-display)" }}>
                              {label}
                            </h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                              <p className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
                                <span className="font-medium" style={{ color: "var(--foreground)" }}>Active score</span>
                                {" "}{(Number(payout.active_score ?? 0) * 100).toFixed(0)}%
                              </p>
                              <p className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
                                <span className="font-medium" style={{ color: "var(--foreground)" }}>Fraud</span>
                                {" "}{(Number(payout.fraud_score ?? 0) * 100).toFixed(0)}%
                              </p>
                              {payout.covered_hours !== null && (
                                <p className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
                                  <span className="font-medium" style={{ color: "var(--foreground)" }}>Covered</span>
                                  {" "}{payout.covered_hours}h
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0 md:pl-6 md:border-l"
                          style={{ borderColor: "var(--border)" }}>
                          <span className="text-[10px] font-mono text-[var(--muted)] uppercase">Payout</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>₹</span>
                            <span className="text-[2rem] leading-none font-bold tracking-tighter"
                              style={{ fontFamily: "var(--font-mono)", color: isCompleted ? "#16A34A" : "var(--muted)" }}>
                              {Number(payout.payout_amount).toFixed(1)}
                            </span>
                          </div>
                          {isCompleted && (
                            <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                              style={{ color: "#16A34A", background: "#DCFCE7" }}>
                              <Check size={12} /> Credited via {(payout.payout_channel ?? "UPI").replace(/_/g, " ")}
                            </div>
                          )}
                          {isCompleted && payout.payout_processed_at && (
                            <div className="text-[10px]" style={{ color: "var(--muted)" }}>
                              {format(new Date(payout.payout_processed_at), "dd MMM yyyy · HH:mm")}
                            </div>
                          )}
                          {isProcessing && (
                            <div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                              style={{ color: "#D97706", background: "#FEF3C7" }}>
                              <Loader2 size={12} className="animate-spin" /> Under review
                            </div>
                          )}
                          {isPayoutFailed && (
                            <div className="flex flex-col items-end gap-1">
                              <div className="text-[11px] px-2.5 py-1 rounded-full" style={{ color: "#DC2626", background: "#FEE2E2" }}>
                                Payout failed
                              </div>
                              {payout.payout_failure_reason && (
                                <p className="text-[10px] max-w-[220px] text-right" style={{ color: "var(--muted)" }}>
                                  {payout.payout_failure_reason}
                                </p>
                              )}
                            </div>
                          )}
                          {payout.status === "rejected" && (
                            <div className="text-[11px] px-2.5 py-1 rounded-full" style={{ color: "var(--muted)", background: "var(--secondary)" }}>
                              Rejected
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <motion.div {...fadeUp(0.5)} className="text-center pt-6">
        <p className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
          Parametric payouts use GPS activity and fraud checks. 2-hour deductible applies.
        </p>
      </motion.div>
    </div>
  );
}
