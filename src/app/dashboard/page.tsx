"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  FileText,
  Calculator,
  Scale,
  TrendingUp,
  ArrowRight,
  Zap,
  CloudRain,
  Thermometer,
  Wind,
  AlertTriangle,
} from "lucide-react";
import { Logo } from "@/components/namma/Logo";
import { useAuthStore } from "@/lib/authStore";
import { useDashboardState } from "@/components/namma/DashboardStateProvider";
import { toast } from "@/hooks/use-toast";
import { CountUp } from "@/components/namma/CountUp";
import { RiskRing } from "@/components/namma/RiskRing";
import { TriggerRow } from "@/components/namma/TriggerRow";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { apiGetDashboardFeed, apiGetWorkerClaims } from "@/lib/api/client";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
});

function Card({
  children,
  className = "",
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className={`bg-white rounded-2xl p-6 stat-card ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function triggerDisplay(ev: {
  event_type: string;
  severity?: string;
  started_at?: string;
}) {
  const t = ev.event_type.toLowerCase();
  let icon = "📋";
  let name = ev.event_type.replace(/_/g, " ");
  if (t.includes("rain")) { icon = "🌧️"; name = "Heavy Rain"; }
  else if (t.includes("heat")) { icon = "🌡️"; name = "Extreme Heat"; }
  else if (t.includes("aqi")) { icon = "💨"; name = "AQI Alert"; }
  else if (t.includes("shutdown") || t.includes("civil")) { icon = "🚫"; name = "Civil Shutdown"; }
  else if (t.includes("flood")) { icon = "🌊"; name = "Flash Flood"; }
  const status =
    ev.severity === "extreme"
      ? ("active" as const)
      : ev.severity === "severe"
        ? ("elevated" as const)
        : ("normal" as const);
  return {
    icon,
    name,
    current: ev.started_at ? format(new Date(ev.started_at), "dd MMM, HH:mm") : "—",
    threshold: "Parametric",
    status,
  };
}

function TriggerTypeIcon({ type, size = 16 }: { type: string; size?: number }) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("rain") || t.includes("flood")) return <CloudRain size={size} className="text-blue-500" />;
  if (t.includes("heat")) return <Thermometer size={size} className="text-orange-500" />;
  if (t.includes("aqi")) return <Wind size={size} style={{ color: "#7C3AED" }} />;
  if (t.includes("shutdown") || t.includes("civil")) return <AlertTriangle size={size} className="text-red-500" />;
  return <Zap size={size} style={{ color: "var(--muted)" }} />;
}

function claimBorderColor(eventType: string | null) {
  const t = (eventType ?? "").toLowerCase();
  if (t.includes("rain") || t.includes("flood")) return "#3B82F6";
  if (t.includes("heat")) return "#E85D1A";
  if (t.includes("aqi")) return "#7C3AED";
  if (t.includes("shutdown") || t.includes("civil")) return "#DC2626";
  return "var(--border)";
}

export default function DashboardPage() {
  const router = useRouter();
  const workerId = useAuthStore((s) => s.workerId);
  const { worker, policy, loading: profileLoading, refresh } = useDashboardState();

  const [feedLoading, setFeedLoading] = useState(true);
  const [triggers, setTriggers] = useState<
    Array<{
      id: string;
      event_type: string;
      severity: string;
      city: string;
      zone: string;
      started_at: string;
    }>
  >([]);
  const [recentClaims, setRecentClaims] = useState<
    Array<{
      id: string;
      created_at: string;
      payout_amount: number;
      status: string;
      trigger_events: { event_type: string } | null;
    }>
  >([]);
  const [coverageUsed, setCoverageUsed] = useState(0);
  const [lifetimeProtected, setLifetimeProtected] = useState(0);
  const toastSeenClaimIds = useRef<Set<string>>(new Set());
  const toastCursorRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    if (!workerId || !worker?.city) { setFeedLoading(false); return; }
    let cancelled = false;
    async function load() {
      setFeedLoading(true);
      try {
        const feed = await apiGetDashboardFeed(workerId, worker!.city!, policy?.id);
        if (cancelled) return;
        setTriggers(feed.triggers as typeof triggers);
        setRecentClaims(feed.recentClaims as typeof recentClaims);
        setCoverageUsed(feed.coverageUsed);
        setLifetimeProtected(feed.lifetimeProtected ?? 0);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setTriggers([]);
          setRecentClaims([]);
          setCoverageUsed(0);
          setLifetimeProtected(0);
        }
      }
      if (cancelled) return;
      setFeedLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [workerId, worker?.city, policy?.id]);

  useEffect(() => {
    if (!workerId) return;
    toastSeenClaimIds.current.clear();
    toastCursorRef.current = new Date().toISOString();
    let stopped = false;
    const poll = async () => {
      try {
        const since = toastCursorRef.current;
        const { claims } = await apiGetWorkerClaims(workerId, {
          since,
          limit: 20,
        });
        if (stopped || claims.length === 0) return;

        const sorted = [...claims].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        for (const row of sorted) {
          if (toastSeenClaimIds.current.has(row.id)) continue;
          toastSeenClaimIds.current.add(row.id);
          const label = (row.trigger_events?.event_type ?? "Disruption").replace(/_/g, " ");

          if (row.status === "auto_approved" && Number(row.payout_amount) > 0) {
            toast({
              title: `Money received: ₹${Number(row.payout_amount).toLocaleString("en-IN")}`,
              description: `Credited via ${(row.payout_channel ?? "UPI_SIM").replace(/_/g, " ")} for ${label}.`,
            });
            continue;
          }

          if (row.status === "payout_failed" || row.payout_status === "failed") {
            toast({
              title: "Payout failed",
              description: row.payout_failure_reason ?? `Payment for ${label} could not be processed.`,
              variant: "destructive",
            });
          }
        }

        toastCursorRef.current = sorted[sorted.length - 1]!.created_at;
        void refresh();
      } catch (e) {
        if (!stopped) console.error(e);
      }
    };

    void poll();
    const id = window.setInterval(() => {
      void poll();
    }, 15_000);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [workerId, refresh]);

  const displayName = worker?.name?.trim() || worker?.phone || "Partner";
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const riskScore = policy ? Math.round(Number(policy.risk_score)) : 0;
  const maxCoverage = policy ? Number(policy.coverage_amount) : 0;
  const premium = policy ? Number(policy.weekly_premium) : 0;
  const streak = worker?.streak_weeks ?? 0;
  const coverageUsedPct = maxCoverage > 0 ? Math.min(100, Math.round((coverageUsed / maxCoverage) * 100)) : 0;
  const remaining = Math.max(0, maxCoverage - coverageUsed);
  const tierLabel = policy?.tier ?? "—";
  const riskBand = riskScore < 35 ? "Low Risk" : riskScore < 70 ? "Standard Risk" : "High Risk";
  const riskColor = riskScore < 35 ? "#16A34A" : riskScore < 70 ? "#D97706" : "#DC2626";
  const tableRows = recentClaims.slice(0, 3);
  const upcomingCoverageStart = policy
    ? new Date(new Date(policy.end_date).getTime() + 24 * 60 * 60 * 1000)
    : null;

  if (profileLoading) {
    return (
      <div className="max-w-[1200px] mx-auto space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <Card>
          <div className="text-center py-10 px-4">
            <div className="w-16 h-16 rounded-2xl icon-chip-orange flex items-center justify-center mx-auto mb-4">
              <Shield size={28} />
            </div>
            <h2 className="text-xl mb-2" style={{ fontFamily: "var(--font-display)" }}>No active policy</h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Complete onboarding to activate coverage and see your live dashboard.</p>
            <Link href="/onboarding" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium btn-shimmer" style={{ background: "var(--primary)" }}>
              Go to onboarding <ArrowRight size={16} />
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">

      {/* ── Hero Card ── */}
      <motion.div
        {...fadeUp(0)}
        className="relative overflow-hidden rounded-2xl p-7"
        style={{
          background: "linear-gradient(135deg, #fff 50%, #FDE8DA 100%)",
          boxShadow: "0 4px 32px rgba(232,93,26,0.12), 0 0 0 1px rgba(232,93,26,0.08)",
        }}
      >
        {/* Decorative glow blobs */}
        <div className="absolute right-0 top-0 w-72 h-72 pointer-events-none"
          style={{ background: "radial-gradient(circle at 80% 20%, rgba(232,93,26,0.10) 0%, transparent 65%)" }} />
        <div className="absolute left-1/3 bottom-0 w-48 h-32 pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 100%, rgba(232,93,26,0.05) 0%, transparent 70%)" }} />

        <div className="flex items-center justify-between gap-6 relative z-10">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-[28px] leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {greeting}, {displayName.split(" ")[0]}.
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                Active Coverage
              </span>
            </div>

            <p className="text-sm" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
              Your <strong style={{ color: "var(--foreground)" }}>{tierLabel} Plan</strong> is active for this week
              {worker?.city ? ` · ${worker.city}${worker.zone ? `, ${worker.zone}` : ""}` : ""}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
              Total earnings protected to date: ₹{Math.round(lifetimeProtected).toLocaleString("en-IN")}
            </p>
            {upcomingCoverageStart && (
              <p className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                Upcoming coverage period starts {format(upcomingCoverageStart, "dd MMM yyyy")}
              </p>
            )}

            {/* Coverage bar */}
            <div className="space-y-1.5 max-w-md">
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                  Coverage used: ₹{coverageUsed.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>
                  ₹{maxCoverage.toLocaleString("en-IN")} max
                </span>
              </div>
              <div className="h-2 rounded-full w-full overflow-hidden" style={{ background: "rgba(28,24,20,0.08)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(to right, #16A34A, #22C55E)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${coverageUsedPct}%` }}
                  transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="text-xs text-right" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                {coverageUsedPct}% used
              </p>
            </div>
          </div>

          {/* Logo */}
          <div className="hidden sm:flex items-center justify-center shrink-0">
            <Logo size={80} />
          </div>
        </div>
      </motion.div>

      {/* ── Stats Cards Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Risk Card */}
        <Card delay={0.05}>
          {/* Top accent stripe */}
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
            style={{ background: `linear-gradient(to right, ${riskColor}, transparent)` }} />
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-0.5"
                style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem" }}>
                This Week&apos;s Risk
              </p>
              <p className="text-sm font-medium" style={{ color: riskColor }}>
                {riskBand}
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: riskColor + "18", color: riskColor }}>
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <RiskRing score={riskScore} size={80} strokeWidth={6} showLabel={false} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 600, color: riskColor }}>
                  {riskScore}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: riskColor }}>
                {riskScore}<span className="text-sm font-normal" style={{ color: "var(--muted)" }}>/100</span>
              </p>
              <p className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
                {tierLabel} · {worker?.city}
              </p>
              <p className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
                {worker?.zone}
              </p>
            </div>
          </div>
        </Card>

        {/* Premium Card */}
        <Card delay={0.1}>
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
            style={{ background: "linear-gradient(to right, #E85D1A, transparent)" }} />
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem" }}>
              Premium Paid
            </p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center icon-chip-orange">
              <FileText size={13} />
            </div>
          </div>
          <div className="flex items-end gap-2 mb-4">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "2.25rem", fontWeight: 600, color: "#E85D1A", lineHeight: 1 }}>
              <CountUp prefix="₹" end={premium} />
            </span>
            <span className="text-sm mb-1" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
              / week
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "linear-gradient(135deg,#FEF3C7,#FDE68A)", color: "#D97706", border: "1px solid rgba(217,119,6,0.2)" }}>
              🔥 {streak} week streak
            </span>
            {streak >= 4 && (
              <span className="text-xs px-2 py-1 rounded-full"
                style={{ background: "#DCFCE7", color: "#16A34A", fontFamily: "var(--font-mono)", fontSize: "0.6875rem" }}>
                −10%
              </span>
            )}
          </div>
        </Card>

        {/* Coverage Remaining Card */}
        <Card delay={0.15}>
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
            style={{ background: "linear-gradient(to right, #16A34A, transparent)" }} />
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem" }}>
              Coverage Remaining
            </p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center icon-chip-green">
              <Shield size={13} />
            </div>
          </div>
          <div className="flex items-end gap-2 mb-4">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "2.25rem", fontWeight: 600, color: "#16A34A", lineHeight: 1 }}>
              ₹<CountUp end={remaining} />
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              <span>₹{coverageUsed.toLocaleString("en-IN")} used</span>
              <span>{coverageUsedPct}%</span>
            </div>
            <div className="h-2 rounded-full w-full bg-[var(--border)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(to right, #16A34A, #22C55E)" }}
                initial={{ width: 0 }}
                animate={{ width: `${coverageUsedPct}%` }}
                transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full"
                  style={{ background: i < Math.round(coverageUsedPct / 10) ? "#16A34A" : "var(--border)" }} />
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Live Feed + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" delay={0.2}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 rounded-full bg-[#E85D1A] opacity-30 animate-status-ping" />
                <div className="relative w-2 h-2 rounded-full bg-[#E85D1A]" />
              </div>
              <h3 className="text-base font-medium" style={{ fontFamily: "var(--font-display)" }}>
                Live Trigger Feed
              </h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: "var(--secondary)", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
              {worker?.city} metro
            </span>
          </div>
          {feedLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : triggers.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-3xl mb-2">🌤️</div>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Your zone is calm</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>No recent triggers in {worker?.city}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {triggers.map((t, idx) => (
                <TriggerRow key={t.id} event={t} index={idx} />
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card delay={0.25}>
          <h3 className="text-base font-medium mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Quick Actions
          </h3>
          <div className="flex flex-col gap-2">
            {[
              { icon: FileText, label: "View Policy", sub: "Coverage details", href: "/dashboard/policy", chipClass: "icon-chip-blue" },
              { icon: TrendingUp, label: "Payout History", sub: "All your claims", href: "/dashboard/claims", chipClass: "icon-chip-green" },
              { icon: Scale, label: "Upgrade Plan", sub: "Get more coverage", href: "/dashboard/policy", primary: true },
              { icon: Calculator, label: "Risk Calculator", sub: "Estimate premium", href: "/dashboard/calculator", chipClass: "icon-chip-amber" },
            ].map(({ icon: Icon, label, sub, href, primary, chipClass }) => (
              <motion.button
                key={label}
                type="button"
                onClick={() => router.push(href)}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-left transition-all duration-150 btn-shimmer"
                style={{
                  background: primary ? "linear-gradient(135deg, #E85D1A, #F07030)" : "var(--secondary)",
                  color: primary ? "white" : "var(--foreground)",
                  border: primary ? "none" : "1px solid var(--border)",
                  boxShadow: primary ? "0 4px 14px rgba(232,93,26,0.3)" : "none",
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${primary ? "" : chipClass}`}
                  style={primary ? { background: "rgba(255,255,255,0.2)" } : {}}>
                  <Icon size={15} style={primary ? { color: "white" } : {}} />
                </div>
                <div>
                  <p className="leading-none text-xs font-semibold">{label}</p>
                  <p className="text-[10px] mt-0.5 opacity-60">{sub}</p>
                </div>
                <ArrowRight size={14} className="ml-auto opacity-40" />
              </motion.button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Recent Claims ── */}
      <Card delay={0.3}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-medium" style={{ fontFamily: "var(--font-display)" }}>
            Recent Claims
          </h3>
          <button
            type="button"
            onClick={() => router.push("/dashboard/claims")}
            className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:underline"
            style={{ color: "#E85D1A", fontFamily: "var(--font-body)" }}
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {feedLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : tableRows.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>No claims yet — you&apos;re all clear this week.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Trigger</th>
                  <th className="pb-3 pr-4 font-medium">Payout</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => {
                  const et = row.trigger_events?.event_type ?? null;
                  const etLabel = et?.replace(/_/g, " ") ?? "—";
                  const st = row.status;
                  const borderColor = claimBorderColor(et);
                  return (
                    <tr
                      key={row.id}
                      className={i < tableRows.length - 1 ? "border-b border-[var(--border)]" : ""}
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <td className="py-3.5 pr-4 font-medium">
                        {format(new Date(row.created_at), "dd MMM yyyy")}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2">
                          <TriggerTypeIcon type={et ?? ""} size={14} />
                          <span className="capitalize">{etLabel}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 font-medium"
                        style={{ fontFamily: "var(--font-mono)", color: Number(row.payout_amount) > 0 ? "#16A34A" : "var(--muted)" }}>
                        {Number(row.payout_amount) > 0 ? `₹${Number(row.payout_amount).toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="py-3.5 text-right">
                        {st === "auto_approved" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: "#DCFCE7", color: "#16A34A" }}>Paid</span>
                        )}
                        {st === "watchlist" && (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: "#FEF3C7", color: "#D97706" }}>Review</span>
                        )}
                        {st === "flagged" && (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">Flagged</span>
                        )}
                        {st === "rejected" && (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: "var(--secondary)", color: "var(--muted)" }}>Rejected</span>
                        )}
                        {!["auto_approved", "watchlist", "flagged", "rejected"].includes(st) && (
                          <span className="text-xs" style={{ color: "var(--muted)" }}>{st}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
