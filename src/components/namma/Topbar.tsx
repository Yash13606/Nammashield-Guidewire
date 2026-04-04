"use client";

import { usePathname } from "next/navigation";
import { Bell, Wifi } from "lucide-react";
import { useAppStore } from "@/lib/navigationStore";
import { useDashboardState } from "@/components/namma/DashboardStateProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function initials(name: string | null, phone: string | null) {
  if (name && name.trim().length >= 1) {
    const p = name.trim().split(/\s+/);
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (phone) return phone.replace(/\D/g, "").slice(-2) || "NS";
  return "NS";
}

const PAGE_SUBTITLES: Record<string, string> = {
  "/dashboard": "Your live coverage overview",
  "/dashboard/policy": "Manage your plan details",
  "/dashboard/claims": "Payout history & AI decisions",
  "/dashboard/calculator": "Estimate your weekly premium",
  "/dashboard/admin": "System controls & analytics",
};

export function Topbar() {
  const pathname = usePathname() || "";
  const { role } = useAppStore();
  const { worker, loading } = useDashboardState();

  const title = pathname.includes("/policy")
    ? "Policy Management"
    : pathname.includes("/claims")
      ? "Claims & Payouts"
      : pathname.includes("/calculator")
        ? "Risk Calculator"
        : pathname.includes("/admin")
          ? "Admin Dashboard"
          : "Dashboard";

  const subtitle = PAGE_SUBTITLES[pathname] ?? "";
  const wallet = worker?.wallet_balance ?? 0;
  const ini = initials(worker?.name ?? null, worker?.phone ?? null);

  return (
    <header
      className="fixed top-0 left-[240px] right-0 h-16 flex items-center justify-between px-6 z-10"
      style={{
        background: "rgba(247, 243, 238, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 1px 0 rgba(28,24,20,0.04)",
      }}
    >
      {/* Left: Title + Subtitle */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="min-w-0">
          <h1
            className="leading-tight truncate"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-xs truncate hidden sm:block"
              style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Wallet chip */}
        {loading ? (
          <Skeleton className="h-8 w-28 rounded-lg hidden sm:block" />
        ) : (
          <motion.span
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              fontFamily: "var(--font-mono)",
              background: "linear-gradient(135deg, #DCFCE7, #F0FDF4)",
              color: "#16A34A",
              border: "1px solid rgba(22,163,74,0.2)",
              fontSize: "0.8125rem",
            }}
          >
            <span style={{ color: "#16A34A", fontWeight: 600 }}>
              ₹{Number(wallet).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
            <span style={{ color: "#86EFAC", fontWeight: 400 }}>wallet</span>
          </motion.span>
        )}
      </div>

      {/* Right: Role badge + live indicator + bell + avatar */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Live system status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "var(--secondary)" }}>
          <div className="relative w-2 h-2">
            <div className="absolute inset-0 rounded-full bg-[#16A34A] opacity-40 animate-status-ping" />
            <div className="relative w-2 h-2 rounded-full bg-[#16A34A]" />
          </div>
          <span className="text-[10px] font-medium" style={{ color: "#16A34A", fontFamily: "var(--font-mono)" }}>
            Live
          </span>
        </div>

        {/* Role badge */}
        <span
          className="px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: role === "admin"
              ? "linear-gradient(135deg, #FDE8DA, #FEF0E7)"
              : "linear-gradient(135deg, #DCFCE7, #F0FDF4)",
            color: role === "admin" ? "var(--primary)" : "var(--accent)",
            border: role === "admin"
              ? "1px solid rgba(232,93,26,0.2)"
              : "1px solid rgba(22,163,74,0.2)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {role === "admin" ? "Admin Mode" : "Worker"}
        </span>

        {/* Notification bell */}
        <motion.button
          className="relative p-2 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ background: "var(--secondary)" }}
        >
          <Bell size={17} style={{ color: "var(--muted)" }} />
          {/* Notification dot */}
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--primary)" }}
          />
        </motion.button>

        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #E85D1A, #F59E0B)",
            boxShadow: "0 2px 8px rgba(232,93,26,0.3)",
          }}
        >
          {ini}
        </motion.div>
      </div>
    </header>
  );
}
