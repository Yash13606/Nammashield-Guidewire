"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as any },
});

function useCountUp(end: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(eased * end);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { value, ref };
}

const stats = [
  { prefix: "\u20B9", value: 127, decimals: 0, label: "avg payout" },
  { prefix: "< ", value: 5, decimals: 0, label: "min to receive" },
  { prefix: "", value: 2800, decimals: 0, label: "workers protected", suffix: "+" },
  { prefix: "", value: 0, decimals: 0, label: "forms to fill" },
];

function StatItem({
  prefix,
  value,
  decimals,
  label,
  suffix,
  index,
}: {
  prefix: string;
  value: number;
  decimals: number;
  label: string;
  suffix?: string;
  index: number;
}) {
  const { value: count, ref } = useCountUp(value, 1500);
  const display = decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString("en-IN");

  return (
    <div ref={ref} className="relative flex flex-col items-center gap-2 px-4 sm:px-8">
      {/* Divider on desktop (not last) */}
      {index < stats.length - 1 && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-px bg-white/20 hidden lg:block" />
      )}
      <div className="flex items-baseline">
        {prefix && (
          <span className="text-white text-[32px] sm:text-[44px] md:text-[56px] leading-none" style={{ fontFamily: "var(--font-mono)" }}>
            {prefix}
          </span>
        )}
        <span className="text-white text-[32px] sm:text-[44px] md:text-[56px] leading-none" style={{ fontFamily: "var(--font-mono)" }}>
          {display}
        </span>
        {suffix && (
          <span className="text-white text-[32px] sm:text-[44px] md:text-[56px] leading-none" style={{ fontFamily: "var(--font-mono)" }}>
            {suffix}
          </span>
        )}
      </div>
      <span
        className="text-sm"
        style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.7)" }}
      >
        {label}
      </span>
    </div>
  );
}

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

export default function StatsSection() {
  return (
    <section
      className="py-20 md:py-32 px-6 relative overflow-hidden"
      style={{ backgroundColor: "var(--primary)" }}
    >
      <GrainOverlay />
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Stats row */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-0 justify-items-center"
          {...fadeUp(0)}
        >
          {stats.map((stat, i) => (
            <StatItem key={stat.label} {...stat} index={i} />
          ))}
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="mt-16 md:mt-24 text-center text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            color: "rgba(255,255,255,0.9)",
            opacity: 0.8,
          }}
          {...fadeUp(0.3)}
        >
          &ldquo;We don&apos;t just insure accidents. We insure effort.&rdquo;
        </motion.p>
      </div>
    </section>
  );
}
