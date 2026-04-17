"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, CheckCircle2, CircleAlert, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/authStore";
import {
  apiGetWorkerNotifications,
  apiMarkAllWorkerNotificationsRead,
  apiMarkWorkerNotificationRead,
  type WorkerNotification,
} from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

type FilterMode = "all" | "unread";

function categoryColor(category: string) {
  const c = category.toLowerCase();
  if (c.includes("payout")) return { bg: "#DCFCE7", text: "#166534", badge: "#16A34A" };
  if (c.includes("fraud")) return { bg: "#FEE2E2", text: "#991B1B", badge: "#DC2626" };
  if (c.includes("trigger")) return { bg: "#DBEAFE", text: "#1E3A8A", badge: "#2563EB" };
  return { bg: "#FEF3C7", text: "#92400E", badge: "#D97706" };
}

export default function NotificationsPage() {
  const workerId = useAuthStore((s) => s.workerId);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [items, setItems] = useState<WorkerNotification[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async (mode: FilterMode) => {
    if (!workerId) return;
    setLoading(true);
    try {
      const data = await apiGetWorkerNotifications(workerId, {
        limit: 60,
        unreadOnly: mode === "unread",
      });
      setItems(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not load notifications",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!workerId) return;
    void load(filterMode);
    const interval = window.setInterval(() => {
      void load(filterMode);
    }, 20_000);
    return () => window.clearInterval(interval);
  }, [workerId, filterMode]);

  const markAsRead = async (id: string) => {
    if (!workerId) return;
    try {
      await apiMarkWorkerNotificationRead(workerId, id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not mark notification",
        description: "Try again in a few seconds.",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    if (!workerId) return;
    setMarkingAll(true);
    try {
      await apiMarkAllWorkerNotificationsRead(workerId);
      setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
      toast({ title: "All notifications marked as read" });
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not mark all as read",
        description: "Try again later.",
        variant: "destructive",
      });
    } finally {
      setMarkingAll(false);
    }
  };

  const emptyMessage = useMemo(() => {
    if (filterMode === "unread") return "No unread notifications right now.";
    return "No notifications yet. Trigger and payout events will appear here.";
  }, [filterMode]);

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, #fff 52%, #EFF6FF 100%)",
          border: "1px solid rgba(37,99,235,0.2)",
          boxShadow: "0 8px 26px rgba(37,99,235,0.10)",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell size={18} style={{ color: "#2563EB" }} />
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem" }}>Notification Center</h2>
            </div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Real-time updates for payouts, trigger events, profile changes, and risk checks.
            </p>
          </div>
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: "#DBEAFE", color: "#1D4ED8" }}
          >
            {unreadCount} unread
          </span>
        </div>
      </motion.section>

      <section className="rounded-2xl p-4 bg-white" style={{ border: "1px solid var(--border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={15} style={{ color: "var(--muted)" }} />
            <div className="inline-flex rounded-xl p-1" style={{ background: "var(--secondary)" }}>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: filterMode === "all" ? "white" : "transparent",
                  color: filterMode === "all" ? "var(--foreground)" : "var(--muted)",
                }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("unread")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: filterMode === "unread" ? "white" : "transparent",
                  color: filterMode === "unread" ? "var(--foreground)" : "var(--muted)",
                }}
              >
                Unread
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void markAllAsRead()}
            disabled={markingAll || unreadCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
            style={{ background: "var(--secondary)", color: "var(--foreground)" }}
          >
            <CheckCheck size={14} />
            {markingAll ? "Marking..." : "Mark all as read"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white" style={{ border: "1px solid var(--border)" }}>
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {items.map((item) => {
              const colors = categoryColor(item.category);
              return (
                <div key={item.id} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          {item.category}
                        </span>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                        {!item.is_read && (
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: colors.badge }}
                          />
                        )}
                      </div>

                      <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {item.title}
                      </h3>
                      <p className="text-sm" style={{ color: "var(--muted)" }}>
                        {item.message}
                      </p>
                    </div>

                    {!item.is_read ? (
                      <button
                        type="button"
                        onClick={() => void markAsRead(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ background: "var(--secondary)", color: "var(--foreground)" }}
                      >
                        <CheckCircle2 size={13} /> Read
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                        <CircleAlert size={12} /> Read
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
