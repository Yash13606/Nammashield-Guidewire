"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  IndianRupee,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  Check,
  X,
  Zap,
  MapPin,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
} from "recharts";
import { CountUp } from "@/components/namma/CountUp";
import { ZONES, WEEKLY_DATA } from "@/lib/mockData";
import { Skeleton } from "@/components/ui/skeleton";

const cardShadow = "0 2px 12px rgba(28, 24, 20, 0.07), 0 0 0 1px rgba(28, 24, 20, 0.04)";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const EVENT_TYPES = [
  { value: "heavy_rain", label: "Heavy Rain" },
  { value: "extreme_heat", label: "Extreme Heat" },
  { value: "severe_aqi", label: "Severe AQI" },
  { value: "civil_shutdown", label: "Civil Shutdown" },
  { value: "flash_flood", label: "Flash Flood" },
];

const CITIES = Object.keys(ZONES);

const PIE_COLORS = ["#E85D1A", "#D97706", "#7C3AED", "#16A34A", "#3B82F6"];

type Summary = {
  activeWorkers: number;
  activePolicies: number;
  weeklyPremiums: number;
  totalPayouts: number;
  lossRatio: number;
  recentTriggers: Array<{
    id: string;
    event_type: string;
    city: string;
    zone: string;
    severity: string;
    started_at: string;
    claim_count: number;
  }>;
  triggerFrequency: Array<{ name: string; value: number }>;
};

type QueueRow = {
  id: string;
  worker_id: string;
  payout_amount: number;
  fraud_score: number;
  active_score: number;
  status: string;
  created_at: string;
  worker?: { name: string | null; phone: string };
  trigger?: { event_type: string };
};

// KPI Card Component
function KpiCard({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  icon: Icon,
  chipClass,
  accentColor,
  delay = 0,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: React.ElementType;
  chipClass: string;
  accentColor: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-6 relative overflow-hidden stat-card"
      style={{ boxShadow: cardShadow }}
      {...fadeUp(delay)}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }} />
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium uppercase tracking-wider"
          style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", color: "var(--muted)" }}>
          {label}
        </span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${chipClass}`}>
          <Icon size={15} />
        </div>
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "2rem", fontWeight: 600, color: accentColor }}>
        {prefix}<CountUp end={value} duration={800} decimals={decimals} />{suffix}
      </span>
    </motion.div>
  );
}

// Custom Tooltip for weekly chart
const WeeklyTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl p-3 border" style={{ borderColor: "var(--border)", boxShadow: cardShadow, fontFamily: "var(--font-body)", fontSize: "0.8125rem" }}>
      <p className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2">
          <span style={{ color: entry.fill }}>●</span>
          <span style={{ color: "var(--muted)" }}>{entry.name}:</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)" }}>
            ₹{Number(entry.value).toLocaleString("en-IN")}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<Record<string, unknown> | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [eventType, setEventType] = useState("heavy_rain");
  const [city, setCity] = useState("Chennai");
  const [zone, setZone] = useState("");
  const [severity, setSeverity] = useState("severe");
  const [durationHours, setDurationHours] = useState(5);

  const cityZones = city ? ZONES[city as keyof typeof ZONES] ?? [] : [];

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, qRes] = await Promise.all([
        fetch("/api/admin/summary"),
        fetch("/api/admin/queue"),
      ]);
      const sJson = await sRes.json();
      const qJson = await qRes.json();
      if (sRes.ok) setSummary(sJson as Summary);
      if (qRes.ok) setQueue(qJson.claims ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  useEffect(() => {
    if (cityZones.length && !zone) setZone(cityZones[0]);
  }, [city, cityZones, zone]);

  const fireSim = async () => {
    if (!zone) return;
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await fetch("/api/triggers/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_type: eventType, city, zone, severity, duration_hours: durationHours, threshold_value: 1 }),
      });
      const j = await res.json();
      setSimResult(j);
      if (res.ok) void loadAll();
    } catch (e) {
      setSimResult({ error: String(e) });
    } finally {
      setSimLoading(false);
    }
  };

  const seedGps = async () => {
    setGpsLoading(true);
    try { await fetch("/api/gps/simulate", { method: "POST" }); }
    finally { setGpsLoading(false); }
  };

  const approve = async (id: string) => {
    await fetch("/api/claims/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ claim_id: id }) });
    void loadAll();
  };

  const reject = async (id: string) => {
    await fetch("/api/claims/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ claim_id: id, rejection_reason: "Rejected from admin queue" }) });
    void loadAll();
  };

  // Charts data
  const weeklyChartData = WEEKLY_DATA.map((d) => ({
    week: d.week,
    Premiums: d.premiums,
    Payouts: d.payouts,
  }));

  const pieData = (summary?.triggerFrequency ?? []).map((t) => ({
    name: t.name.replace(/_/g, " "),
    value: t.value,
  }));

  const inputClass = "w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E85D1A]/20 focus:border-[#E85D1A] transition-all";

  if (loading && !summary) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">

      {/* ── Page Header ── */}
      <motion.div className="mb-8 flex items-center justify-between flex-wrap gap-4" {...fadeUp(0)}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>
            Admin Dashboard
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Live portfolio metrics and trigger simulation
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAll()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer hover:shadow-md"
          style={{ fontFamily: "var(--font-body)", background: "white", color: "var(--foreground)", border: "1px solid var(--border)", boxShadow: cardShadow }}
        >
          <RefreshCw size={14} style={{ color: "var(--muted)" }} />
          Refresh
        </button>
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Active Workers" value={summary?.activeWorkers ?? 0} icon={Users} chipClass="icon-chip-orange" accentColor="#E85D1A" delay={0.05} />
        <KpiCard label="Active Policies" value={summary?.activePolicies ?? 0} icon={Activity} chipClass="icon-chip-green" accentColor="#16A34A" delay={0.1} />
        <KpiCard label="Total Payouts" value={summary?.totalPayouts ?? 0} prefix="₹" icon={IndianRupee} chipClass="icon-chip-amber" accentColor="#D97706" delay={0.15} />
        <KpiCard label="Loss Ratio" value={summary?.lossRatio ?? 0} suffix="%" decimals={1} icon={TrendingDown} chipClass="icon-chip-red" accentColor="#DC2626" delay={0.2} />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Weekly Premiums vs Payouts — grouped bar chart */}
        <motion.div className="bg-white rounded-2xl p-6 lg:col-span-2" style={{ boxShadow: cardShadow }} {...fadeUp(0.22)}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-body)" }}>
                Weekly Premiums vs Payouts
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                8-week rolling view
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: "#E85D1A", display: "inline-block" }} />Premiums</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: "#16A34A", display: "inline-block" }} />Payouts</span>
            </div>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} barGap={2} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted)", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<WeeklyTooltip />} />
                <Bar dataKey="Premiums" fill="#E85D1A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Payouts" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Trigger Frequency — Pie Chart */}
        <motion.div className="bg-white rounded-2xl p-6" style={{ boxShadow: cardShadow }} {...fadeUp(0.24)}>
          <h3 className="text-sm font-semibold mb-1" style={{ fontFamily: "var(--font-body)" }}>
            Trigger Breakdown
          </h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
            By event type
          </p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--muted)" }}>
              No data yet
            </div>
          ) : (
            <>
              <div style={{ width: "100%", height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip formatter={(value: number, name: string) => [value, name]}
                      contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontFamily: "var(--font-body)", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0, display: "inline-block" }} />
                      <span style={{ color: "var(--foreground)", fontFamily: "var(--font-body)" }}>{entry.name}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontWeight: 500 }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Recent Triggers Table ── */}
      <motion.div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: cardShadow }} {...fadeUp(0.25)}>
        <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-body)" }}>Recent Triggers</h3>
        <div className="overflow-x-auto max-h-[240px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem" }}>
                <th className="text-left pb-2 uppercase tracking-wider">Type</th>
                <th className="text-left pb-2 uppercase tracking-wider">Zone</th>
                <th className="text-right pb-2 uppercase tracking-wider">Claims</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.recentTriggers ?? []).slice(0, 10).map((t) => (
                <tr key={t.id} className="border-t border-[var(--border)]" style={{ fontFamily: "var(--font-body)" }}>
                  <td className="py-2.5 capitalize">{t.event_type.replace(/_/g, " ")}</td>
                  <td className="py-2.5 text-xs" style={{ color: "var(--muted)" }}>{t.city} · {t.zone}</td>
                  <td className="py-2.5 text-right" style={{ fontFamily: "var(--font-mono)" }}>
                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: t.claim_count > 0 ? "#FDE8DA" : "var(--secondary)", color: t.claim_count > 0 ? "#E85D1A" : "var(--muted)" }}>
                      {t.claim_count}
                    </span>
                  </td>
                </tr>
              ))}
              {(summary?.recentTriggers ?? []).length === 0 && (
                <tr><td colSpan={3} className="py-8 text-center text-sm" style={{ color: "var(--muted)" }}>No triggers yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Simulate Disruption ── */}
      <motion.div className="bg-white rounded-2xl p-6 mb-6" style={{ boxShadow: cardShadow }} {...fadeUp(0.26)}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center icon-chip-orange">
            <Zap size={15} />
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Simulate Disruption
            </h3>
            <p className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
              Fire a parametric trigger and watch the claims engine run
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          {[
            { label: "Event Type", el: (
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputClass}>
                {EVENT_TYPES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            )},
            { label: "City", el: (
              <select value={city} onChange={(e) => { setCity(e.target.value); setZone(""); }} className={inputClass}>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )},
            { label: "Zone", el: (
              <select value={zone} onChange={(e) => setZone(e.target.value)} className={inputClass}>
                {cityZones.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            )},
            { label: "Severity", el: (
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={inputClass}>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="extreme">Extreme</option>
              </select>
            )},
            { label: "Duration (hours)", el: (
              <input type="number" min={0.5} step={0.5} value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className={inputClass} />
            )},
          ].map(({ label, el }) => (
            <div key={label}>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.6875rem" }}>
                {label}
              </label>
              {el}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={simLoading || !zone}
            onClick={() => void fireSim()}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 btn-shimmer transition-all"
            style={{ background: "linear-gradient(135deg,#E85D1A,#F07030)", boxShadow: "0 4px 14px rgba(232,93,26,0.3)" }}
          >
            {simLoading ? "Running…" : "🔥 Fire Trigger"}
          </button>
          <button
            type="button"
            disabled={gpsLoading}
            onClick={() => void seedGps()}
            className="px-5 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <MapPin size={16} />
            {gpsLoading ? "Seeding…" : "Simulate GPS for all workers"}
          </button>
        </div>

        {/* Styled simulation result */}
        {simResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-xl p-4"
            style={{
              background: "error" in simResult ? "#FEF2F2" : "linear-gradient(135deg,#DCFCE7,#F0FDF4)",
              border: "1px solid " + ("error" in simResult ? "#FECACA" : "rgba(22,163,74,0.2)"),
            }}
          >
            {"error" in simResult ? (
              <div>
                <p className="text-sm font-semibold text-red-600 mb-1">Simulation Error</p>
                <p className="text-xs text-red-500">{String(simResult.error)}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "Workers Affected", value: String((simResult as { affected_workers?: unknown }).affected_workers ?? (simResult as { workers_found?: unknown }).workers_found ?? "—") },
                  { label: "Claims Created", value: String((simResult as { claims_created?: unknown }).claims_created ?? "—") },
                  { label: "Total Payout", value: (simResult as { total_payout?: unknown }).total_payout ? `₹${Number((simResult as { total_payout?: unknown }).total_payout).toLocaleString("en-IN")}` : "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "#166534", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.625rem" }}>{label}</p>
                    <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: "#14532D" }}>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ── Claims Review Queue ── */}
      <motion.div className="bg-white rounded-2xl p-6" style={{ boxShadow: cardShadow }} {...fadeUp(0.28)}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center icon-chip-amber">
            <AlertTriangle size={15} />
          </div>
          <div>
            <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Claims Review Queue
            </h3>
            <p className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
              Watchlisted & flagged claims requiring manual decision
            </p>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>No claims in watchlist or flagged.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "0.6875rem" }}>
                  <th className="text-left pb-3 uppercase tracking-wider">Worker</th>
                  <th className="text-left pb-3 uppercase tracking-wider">Trigger</th>
                  <th className="text-center pb-3 uppercase tracking-wider">Fraud Score</th>
                  <th className="text-center pb-3 uppercase tracking-wider">Active Score</th>
                  <th className="text-right pb-3 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((row) => {
                  const fraudPct = Math.round(Number(row.fraud_score) * 100);
                  const activePct = Math.round(Number(row.active_score) * 100);
                  const fraudColor = fraudPct > 70 ? "#DC2626" : fraudPct > 40 ? "#D97706" : "#16A34A";
                  return (
                    <tr key={row.id} className="border-t border-[var(--border)]">
                      <td className="py-3.5 font-medium">
                        {row.worker?.name ?? row.worker?.phone ?? row.worker_id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 text-xs capitalize" style={{ color: "var(--muted)" }}>
                        {row.trigger?.event_type?.replace(/_/g, " ") ?? "—"}
                      </td>
                      <td className="py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: fraudColor }}>
                            {fraudPct}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full overflow-hidden bg-[var(--border)]">
                            <div className="h-full rounded-full" style={{ width: `${fraudPct}%`, background: fraudColor }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: "#16A34A" }}>
                            {activePct}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full overflow-hidden bg-[var(--border)]">
                            <div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${activePct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 text-right">
                        <button type="button" onClick={() => void approve(row.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold mr-2 transition-all hover:shadow-md"
                          style={{ background: "#DCFCE7", color: "#16A34A", border: "1px solid rgba(22,163,74,0.2)" }}>
                          <Check size={12} /> Approve
                        </button>
                        <button type="button" onClick={() => void reject(row.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-md"
                          style={{ background: "var(--secondary)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                          <X size={12} /> Reject
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
