"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  LayoutDashboard,
  FileText,
  Calculator,
  Scale,
  Wallet,
  Shield,
  User,
  Bell,
} from "lucide-react";
import { Logo } from "@/components/namma/Logo";
import { useAppStore } from "@/lib/navigationStore";
import { useAuthStore } from "@/lib/authStore";
import { useDashboardState } from "@/components/namma/DashboardStateProvider";
import { Skeleton } from "@/components/ui/skeleton";

const WORKER_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, chipClass: "icon-chip-orange" },
  { href: "/dashboard/profile", label: "Profile", icon: User, chipClass: "icon-chip-amber" },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, chipClass: "icon-chip-blue" },
  { href: "/dashboard/policy", label: "Policy", icon: FileText, chipClass: "icon-chip-blue" },
  { href: "/dashboard/claims", label: "Claims", icon: Scale, chipClass: "icon-chip-green" },
  { href: "/dashboard/calculator", label: "Calculator", icon: Calculator, chipClass: "icon-chip-amber" },
];

const ADMIN_NAV = [
  { href: "/dashboard/admin", label: "System Admin", icon: Shield, chipClass: "icon-chip-red" },
];

function initials(name: string | null, phone: string | null) {
  if (name && name.trim().length >= 1) {
    const p = name.trim().split(/\s+/);
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (phone) return phone.replace(/\D/g, "").slice(-2) || "NS";
  return "NS";
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, setRole } = useAppStore();
  const logout = useAuthStore((s) => s.logout);
  const { worker, policy, loading } = useDashboardState();

  const filteredNav = role === "admin" ? ADMIN_NAV : WORKER_NAV;

  const toggleRole = (newRole: "worker" | "admin") => {
    setRole(newRole);
    router.push(newRole === "admin" ? "/dashboard/admin" : "/dashboard");
  };

  const displayName = worker?.name?.trim() || worker?.phone || "Partner";
  const ini = initials(worker?.name ?? null, worker?.phone ?? null);
  const wallet = worker?.wallet_balance ?? 0;
  const premium = policy?.weekly_premium ?? 0;
  const hasWallet = wallet > 0;

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[240px] flex flex-col z-20"
      style={{
        background: "linear-gradient(180deg, #FDFCFA 0%, #F7F3EE 100%)",
        borderRight: "1px solid var(--border)",
        boxShadow: "2px 0 16px rgba(28,24,20,0.04)",
      }}
    >
      {/* Left-edge orange accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px] pointer-events-none"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(232,93,26,0.3) 40%, rgba(232,93,26,0.15) 80%, transparent 100%)",
        }}
      />

      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 px-5 py-5 hover:opacity-80 transition-opacity"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="animate-pulse-glow"
          style={{ borderRadius: "50%" }}
        >
          <Logo size={28} />
        </motion.div>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", lineHeight: 1 }}>
          <span style={{ color: "#E85D1A" }}>Namma</span>
          <span style={{ color: "#1C1814" }}>Shield</span>
        </span>
      </Link>

      {/* Segmented Role Toggle */}
      <div className="px-3 pb-3">
        <div
          className="flex rounded-xl p-0.5 relative"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
        >
          {(["worker", "admin"] as const).map((r) => {
            const isActive = role === r;
            return (
              <button
                key={r}
                onClick={() => toggleRole(r)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative z-10"
                style={{
                  fontFamily: "var(--font-body)",
                  color: isActive ? (r === "admin" ? "var(--primary)" : "#1C1814") : "var(--muted)",
                  background: isActive ? "white" : "transparent",
                  boxShadow: isActive ? "0 1px 6px rgba(28,24,20,0.12)" : "none",
                }}
              >
                {r === "admin" ? <Shield size={11} /> : <LayoutDashboard size={11} />}
                {r === "worker" ? "Worker" : "Admin"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-3" style={{ height: "1px", background: "var(--border)" }} />

      {/* Nav Links */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <p
          className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}
        >
          Navigation
        </p>
        <div className="space-y-0.5">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 relative group"
                style={{
                  fontFamily: "var(--font-body)",
                  color: isActive ? "#1C1814" : "var(--muted)",
                  background: isActive ? "linear-gradient(135deg, #FDE8DA 0%, #FEF0E7 100%)" : "transparent",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {!isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{ background: "var(--secondary)", zIndex: 0 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                    style={{ background: "var(--primary)", zIndex: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center justify-center rounded-lg transition-all duration-150 ${item.chipClass}`}
                  style={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    opacity: isActive ? 1 : 0.65,
                  }}
                >
                  <Icon size={14} />
                </span>
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Wallet + Profile Card */}
      <div className="px-3 pb-4 pt-2">
        <AnimatePresence>
          {hasWallet && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-2 rounded-xl p-3 flex items-center gap-2 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 100%)",
                border: "1px solid rgba(22,163,74,0.2)",
              }}
            >
              {/* subtle glow overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 80% 50%, rgba(22,163,74,0.1), transparent 70%)",
                }}
              />
              <div className="relative w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(22,163,74,0.15)" }}>
                <Wallet size={14} style={{ color: "#16A34A" }} />
              </div>
              <div className="flex-1 min-w-0 relative">
                <p className="text-xs font-semibold" style={{ color: "#166534", fontFamily: "var(--font-mono)" }}>
                  Wallet Balance
                </p>
                <p className="text-sm font-bold" style={{ color: "#14532D", fontFamily: "var(--font-mono)" }}>
                  ₹{Number(wallet).toLocaleString("en-IN")}
                </p>
              </div>
              {/* pulsing green dot */}
              <div className="relative w-2 h-2">
                <div className="absolute inset-0 rounded-full bg-[#16A34A] opacity-30 animate-status-ping" />
                <div className="relative w-2 h-2 rounded-full bg-[#16A34A]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="flex items-center gap-3 p-2.5 rounded-xl"
          style={{
            background: "var(--secondary)",
            border: "1px solid var(--border)",
          }}
        >
          {loading ? (
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : (
            <>
              {/* Avatar with glow ring */}
              <div className="relative shrink-0">
                {hasWallet && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-20"
                    style={{ background: "#16A34A", scale: "1.5" }}
                  />
                )}
                <div
                  className="relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #E85D1A, #F59E0B)",
                    boxShadow: "0 2px 8px rgba(232,93,26,0.3)",
                  }}
                >
                  {ini}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)", fontFamily: "var(--font-body)" }}>
                  {displayName}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                  {premium ? `₹${premium}/wk` : "No active plan"}
                </p>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors shrink-0"
                title="Sign out"
                onClick={() => {
                  logout();
                  router.push("/onboarding");
                }}
              >
                <LogOut size={13} style={{ color: "var(--muted)" }} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
