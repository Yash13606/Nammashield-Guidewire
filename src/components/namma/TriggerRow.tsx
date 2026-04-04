"use client";

import { motion } from "framer-motion";
import { CloudRain, Thermometer, Wind, AlertTriangle, Sun, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Props = {
  event: {
    id: string;
    event_type: string;
    city: string;
    zone: string;
    started_at: string;
    status?: string;
  };
  index?: number;
};

function getEventConfig(type: string) {
  const t = type.toLowerCase();
  if (t.includes("rain")) return { icon: CloudRain, color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", label: "Heavy Rain" };
  if (t.includes("heat")) return { icon: Thermometer, color: "#E85D1A", bg: "#FFF7ED", border: "#FDBA74", label: "Extreme Heat" };
  if (t.includes("aqi") || t.includes("air")) return { icon: Wind, color: "#8B5CF6", bg: "#F5F3FF", border: "#C4B5FD", label: "Severe AQI" };
  if (t.includes("shutdown") || t.includes("civil") || t.includes("curfew")) return { icon: AlertTriangle, color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", label: "Civil Shutdown" };
  if (t.includes("storm") || t.includes("lightning")) return { icon: Zap, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "Storm" };
  return { icon: Sun, color: "#9C8C7A", bg: "#F9FAFB", border: "#E5E7EB", label: type.replace(/_/g, " ") };
}

export function TriggerRow({ event, index = 0 }: Props) {
  const cfg = getEventConfig(event.event_type);
  const Icon = cfg.icon;
  const timeAgo = formatDistanceToNow(new Date(event.started_at), { addSuffix: true });
  const isActive = event.status === "active" || !event.status;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 p-3 rounded-xl transition-colors duration-150 hover:bg-[var(--secondary)] group"
      style={{
        borderLeft: `3px solid ${cfg.color}`,
        background: "white",
        marginBottom: 4,
      }}
    >
      {/* Icon Badge */}
      <div
        className="flex items-center justify-center rounded-lg shrink-0 w-9 h-9"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <Icon size={16} style={{ color: cfg.color }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ fontFamily: "var(--font-body)", color: "var(--foreground)" }}
        >
          {cfg.label}
        </p>
        <p
          className="text-xs truncate"
          style={{ fontFamily: "var(--font-body)", color: "var(--muted)" }}
        >
          {event.city} · {event.zone}
        </p>
      </div>

      {/* Right side: status + time */}
      <div className="text-right shrink-0">
        {isActive && (
          <div className="flex items-center gap-1.5 justify-end mb-0.5">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: cfg.color }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] font-semibold" style={{ color: cfg.color, fontFamily: "var(--font-mono)" }}>
              LIVE
            </span>
          </div>
        )}
        <p
          className="text-[10px]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
        >
          {timeAgo}
        </p>
      </div>
    </motion.div>
  );
}
