"use client";

import { useState, useEffect, useRef } from "react";
import WhisperText from "@/components/ui/whisper-text";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Menu,
  ChevronRight,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  Play,
  Pause,
  RefreshCw,
  TrendingUp,
  MapPin,
  Check,
  Plus,
  Info,
  Shield,
  ArrowUpRight,
  X,
  ChevronDown,
  CloudRain,
  Thermometer,
  Wind,
  Ban,
  Smartphone,
  Banknote,
  Bot,
  Lock,
} from "lucide-react";
import { Logo } from "@/components/namma/Logo";
import { useAppStore } from "@/lib/navigationStore";
import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";
import StatsSection from "./_landing/StatsSection";
import SimulatorSection from "./_landing/SimulatorSection";
import CTASection from "./_landing/CTASection";
import Footer from "./_landing/Footer";

/* ─── Animation Helpers ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as any },
});

const stagger = {
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true },
};

const scaleIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.88 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: "easeOut" },
});

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

/* ─── Anchor Scroll Helper ─── */
function scrollToAnchor(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ═══════════════════════════════════════════
   SECTION 1 — Navbar
   ═══════════════════════════════════════════ */
function Navbar() {
  const [visible, setVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isOnboarded } = useAppStore();
  const router = useRouter();
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "How It Works", target: "how-it-works" },
    { label: "Features", target: "features" },
    { label: "For Workers", target: "problem" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: visible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(247, 243, 238, 0.82)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottomColor: "var(--border)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-5 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Logo size={24} />
            <span
              className="tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.25rem",
                color: "var(--foreground)",
              }}
            >
              NammaShield
            </span>
          </div>

          {/* Center Nav Links (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.target}
                onClick={() => scrollToAnchor(link.target)}
                className="transition-colors duration-150 cursor-pointer bg-transparent border-none hover:text-[var(--foreground)]"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  color: "var(--muted)",
                }}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(isOnboarded ? "/dashboard" : "/onboarding")}
              className="px-4 md:px-5 py-2 rounded-full text-sm font-medium text-white transition-all duration-150 cursor-pointer"
              style={{
                fontFamily: "var(--font-body)",
                background: "var(--primary)",
                border: "none",
                boxShadow: "0 2px 8px rgba(232,93,26,0.3)",
              }}
            >
              {isOnboarded ? "Dashboard" : "Get Protected"}
            </button>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-1 text-[var(--foreground)]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <motion.div
        initial={false}
        animate={isMenuOpen ? "open" : "closed"}
        variants={{
          open: { opacity: 1, visibility: "visible", y: 0 },
          closed: { opacity: 0, visibility: "hidden", y: -20 },
        }}
        className="fixed inset-0 z-40 md:hidden bg-[var(--bg)] px-6 pt-24 pb-12 overflow-y-auto"
      >
        <div className="flex flex-col gap-6 items-center text-center">
          {navLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => {
                scrollToAnchor(link.target);
                setIsMenuOpen(false);
              }}
              className="text-2xl font-medium"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              {link.label}
            </button>
          ))}
          <div className="w-full h-px bg-[var(--border)] my-4" />
          <button
              onClick={() => {
                router.push(isOnboarded ? "/dashboard" : "/onboarding");
                setIsMenuOpen(false);
              }}
              className="w-full py-4 rounded-2xl text-lg font-semibold text-white"
              style={{ background: "var(--primary)" }}
            >
              {isOnboarded ? "Go to Dashboard" : "Get Started"}
            </button>
        </div>
      </motion.div>
    </>
  );
}

/* ═══════════════════════════════════════════
   SECTION 2 — Hero
   ═══════════════════════════════════════════ */
function HeroSection() {
  const { scrollYProgress } = useScroll();
  const { isOnboarded } = useAppStore();
  const router = useRouter();
  const shieldOpacity = useTransform(scrollYProgress, [0, 0.25], [0.04, 0]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      <GrainOverlay />

      {/* Background shield outline */}
      <motion.svg
        viewBox="0 0 200 240"
        fill="none"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] md:w-[600px] h-auto pointer-events-none"
        style={{ opacity: shieldOpacity }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 10 L185 55 L185 130 C185 190 100 230 100 230 C100 230 15 190 15 130 L15 55 Z"
          stroke="var(--foreground)"
          strokeWidth="1.5"
        />
        <path
          d="M100 45 L155 75 L155 125 C155 165 100 195 100 195 C100 195 45 165 45 125 L45 75 Z"
          stroke="var(--foreground)"
          strokeWidth="1"
        />
        <path
          d="M100 80 L125 95 L125 120 C125 140 100 155 100 155 C100 155 75 140 75 120 L75 95 Z"
          stroke="var(--foreground)"
          strokeWidth="0.75"
        />
      </motion.svg>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <motion.div {...fadeUp(0)} className="mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{
              background: "var(--primary-light)",
              borderColor: "rgba(232,93,26,0.2)",
              color: "var(--primary)",
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              fontWeight: 500,
            }}
          >
            <Shield size={14} />
            Income Protection for Delivery Workers
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.1)}
          className="mb-6"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.75rem, 6vw, 4.25rem)",
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            color: "var(--foreground)",
            maxWidth: 780,
          }}
        >
          Rain stops the orders.
          <br />
          We make sure it doesn&apos;t{" "}
          <em
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--primary)",
            }}
          >
            stop your income.
          </em>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          {...fadeUp(0.2)}
          className="mb-10"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "1.125rem",
            lineHeight: 1.65,
            color: "var(--muted)",
            maxWidth: 560,
          }}
        >
          NammaShield detects heavy rain, extreme heat, and civic disruptions in
          your zone and pays you automatically. No claim needed. No waiting.
        </motion.p>

        {/* CTA Row */}
        <motion.div
          {...fadeUp(0.3)}
          className="flex flex-col sm:flex-row items-center gap-4 mb-12"
        >
          <button
            onClick={() => router.push(isOnboarded ? "/dashboard" : "/onboarding")}
            className="px-8 py-4 rounded-full text-white font-semibold text-base transition-all duration-200 cursor-pointer"
            style={{
              fontFamily: "var(--font-body)",
              background: "var(--primary)",
              border: "none",
              boxShadow: "0 4px 24px rgba(232,93,26,0.4)",
            }}
          >
            {isOnboarded ? "Go to Dashboard" : "Start Free This Week"}
          </button>

          {!isOnboarded && (
            <button
              onClick={async () => {
                const { loginAsDemo } = useAuthStore.getState();
                await loginAsDemo();
                router.push("/dashboard");
              }}
              className="px-8 py-4 rounded-full font-semibold text-base transition-all duration-200 cursor-pointer border backdrop-blur-md"
              style={{
                fontFamily: "var(--font-body)",
                background: "rgba(255, 255, 255, 0.4)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              Try Demo Experience
            </button>
          )}
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          {...fadeUp(0.4)}
          className="flex items-center gap-3"
        >
          {/* Overlapping avatar circles */}
          <div className="flex -space-x-2.5">
            {[
              "linear-gradient(135deg, #E85D1A, #F59E0B)",
              "linear-gradient(135deg, #16A34A, #22D3EE)",
              "linear-gradient(135deg, #7C3AED, #EC4899)",
            ].map((gradient, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full border-2"
                style={{
                  background: gradient,
                  borderColor: "var(--bg)",
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              color: "var(--muted)",
            }}
          >
            Trusted by{" "}
            <strong style={{ color: "var(--foreground)" }}>2,800+</strong>{" "}
            delivery partners in Chennai, Mumbai &amp; Delhi
          </span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown size={24} style={{ color: "var(--border)" }} />
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 3 — Problem
   ═══════════════════════════════════════════ */
const DISRUPTIONS = [
  {
    icon: CloudRain,
    title: "Heavy Rain",
    subtitle: "Orders drop to zero as streets flood.",
    accentBase: "from-blue-500/10 to-transparent",
    iconBase: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    borderBase: "border-blue-500/10 hover:border-blue-500/30",
  },
  {
    icon: Thermometer,
    title: "Extreme Heat",
    subtitle: "Platforms restrict daytime rides.",
    accentBase: "from-orange-500/10 to-transparent",
    iconBase: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    borderBase: "border-orange-500/10 hover:border-orange-500/30",
  },
  {
    icon: Wind,
    title: "Severe AQI",
    subtitle: "Dangerous to work outdoors.",
    accentBase: "from-purple-500/10 to-transparent",
    iconBase: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    borderBase: "border-purple-500/10 hover:border-purple-500/30",
  },
  {
    icon: Ban,
    title: "Civic Shutdown",
    subtitle: "Complete zone access blocked.",
    accentBase: "from-red-500/10 to-transparent",
    iconBase: "bg-red-500/10 text-red-500 border-red-500/20",
    borderBase: "border-red-500/10 hover:border-red-500/30",
  },
];

function ProblemSection() {
  return (
    <section id="problem" className="py-16 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <motion.p
          {...fadeUp(0)}
          className="mb-4"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "1rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--primary)",
            fontWeight: 600,
          }}
        >
          THE PROBLEM
        </motion.p>

        {/* Heading */}
        <motion.h2
          {...fadeUp(0.05)}
          className="mb-12"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            color: "var(--foreground)",
          }}
        >
          You show up. The rain doesn&apos;t care.
        </motion.h2>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          {/* Left: Prose */}
          <motion.div {...fadeUp(0.1)} className="flex flex-col justify-center">
            <div
              className="flex flex-col gap-8"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1.125rem",
                lineHeight: 1.65,
              }}
            >
              <WhisperText
                text="Every day, delivery workers across India lose income to things beyond their control. A sudden downpour. A heatwave. A civic curfew."
                className="text-[var(--muted)] font-medium"
                delay={20}
                duration={0.6}
                x={-10}
              />
              <WhisperText
                text="Platforms don't pay you for downtime. Insurance doesn't cover 'no orders.' Your rent doesn't pause because the sky opened up."
                className="text-[var(--foreground)] font-semibold text-[1.25rem] tracking-tight"
                delay={25}
                duration={0.7}
                x={-12}
              />
              <div className="relative p-6 rounded-2xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 mt-2">
                <WhisperText
                  text="On average, a delivery worker in Chennai loses ₹400–₹800 per disruption event. That's groceries. Medicine. School fees."
                  className="text-[var(--primary)] font-bold text-[1.125rem]"
                  delay={30}
                  duration={0.6}
                  x={-10}
                />
              </div>
            </div>
          </motion.div>

          {/* Right: 2x2 Disruption Cards */}
          <motion.div
            {...stagger}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {DISRUPTIONS.map((d, i) => (
              <motion.div
                key={d.title}
                {...scaleIn(0.15 + i * 0.1)}
                whileHover={{ scale: 0.96 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`group relative overflow-hidden rounded-[1.5rem] p-6 border transition-colors duration-500 cursor-default ${d.borderBase}`}
                style={{
                  background: "var(--surface)",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                }}
              >
                {/* Hazard Gradient Glow */}
                <div 
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${d.accentBase} rounded-bl-full opacity-60 pointer-events-none transition-transform duration-700 group-hover:scale-110`} 
                />

                <div
                  className={`flex items-center justify-center rounded-xl mb-5 w-12 h-12 border backdrop-blur-sm transition-transform duration-500 group-hover:-translate-y-1 ${d.iconBase}`}
                >
                  <d.icon size={22} className="stroke-[1.5]" />
                </div>
                
                <h3
                  className="font-medium text-[1.0625rem] mb-1.5"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "var(--foreground)",
                  }}
                >
                  {d.title}
                </h3>
                
                <p
                  className="text-[0.875rem] leading-relaxed"
                  style={{
                    fontFamily: "var(--font-body)",
                    color: "var(--muted)",
                  }}
                >
                  {d.subtitle}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom callout */}
        <motion.div
          {...fadeUp(0.3)}
          className="mt-16 text-center"
        >
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
              lineHeight: 1.4,
              color: "var(--primary)",
            }}
          >
            When disruption hits, workers bear 100% of the loss.
            <br className="hidden sm:block" /> NammaShield changes that.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 4 — How It Works
   ═══════════════════════════════════════════ */
const STEPS = [
  {
    num: "01",
    title: "We monitor the atmosphere.",
    body: "Our system continuously polls OpenWeatherMap and CPCB APIs, tracking hyper-local rain, heat, and AQI levels in your designated zone 24/7.",
  },
  {
    num: "02",
    title: "Threshold is breached.",
    body: "The moment environmental conditions statistically exceed the danger threshold, your parametric policy automatically triggers. No human intervention required.",
  },
  {
    num: "03",
    title: "Algorithmic validation.",
    body: "Your device GPS authenticates that you were online, active, and attempting to work in the affected zone with an Active Score ≥ 35%.",
  },
  {
    num: "04",
    title: "Instant UPI settlement.",
    body: "A fixed ₹127 payout immediately drops into your linked bank account. You receive a WhatsApp notification. Zero paperwork. Zero waiting.",
  },
];

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-16 md:py-32 px-6 relative"
      style={{ background: "var(--surface)" }} // Premium light surface
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-3xl">
            {/* Section label */}
            <motion.p
              {...fadeUp(0)}
              className="mb-4"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--primary)",
                fontWeight: 600,
              }}
            >
              THE PIPELINE
            </motion.p>

            {/* Heading */}
            <motion.h2
              {...fadeUp(0.05)}
              className="text-[var(--foreground)]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.5rem, 6vw, 4rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
              }}
            >
              From disruption to payout.<br/>
              <span className="text-[var(--muted)] italic" style={{ fontFamily: "var(--font-serif)" }}>In under 5 minutes.</span>
            </motion.h2>
          </div>
        </div>

        {/* Sticky Card Stack */}
        <div className="relative pb-32">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
              className="sticky flex flex-col md:flex-row group overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] border p-6 md:p-14 mb-8"
              style={{
                top: `calc(100px + ${i * 12}px)`,
                background: "var(--background)",
                borderColor: "var(--border)",
                boxShadow: "0 -20px 40px rgba(0,0,0,0.03)",
                zIndex: i + 10,
              }}
            >


              {/* Content */}
              <div className="relative z-10 flex flex-col md:flex-row gap-8 md:gap-16 items-start md:items-center w-full">
                {/* Step badge */}
                <div 
                  className="flex items-center justify-center shrink-0 rounded-full border bg-white"
                  style={{
                    borderColor: "var(--border)",
                    width: "clamp(60px, 10vw, 80px)",
                    height: "clamp(60px, 10vw, 80px)",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                  }}
                >
                  <span 
                    style={{
                      color: "var(--foreground)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
                      fontWeight: 600,
                    }}
                  >
                    {step.num}
                  </span>
                </div>

                <div className="flex flex-col gap-4 max-w-2xl">
                  <h3 
                    style={{
                      color: "var(--foreground)",
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                      lineHeight: 1.1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p 
                    className="leading-relaxed"
                    style={{
                      color: "var(--muted)",
                      fontFamily: "var(--font-body)",
                      fontSize: "clamp(1rem, 1.5vw, 1.125rem)",
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              </div>
              
              {/* Minimalist animated progress bar on hover */}
              <div className="absolute bottom-0 left-0 h-1 bg-[var(--primary)] w-0 group-hover:w-full transition-all duration-1000 ease-in-out" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 5 — Features / Benefits
   ═══════════════════════════════════════════ */
const FEATURES = [
  {
    icon: Zap,
    title: "No Claims, No Forms",
    body: "The moment a trigger threshold is crossed in your zone, payout is initiated. We never ask for proof of loss.",
  },
  {
    icon: Smartphone,
    title: "Weekly Pricing",
    body: "₹50–₹200/week. Structured parallel to your earnings cycle, ensuring optimal cash flow without monthly burdens.",
  },
  {
    icon: Banknote,
    title: "Instant Payout",
    body: "Automated UPI transfers settle directly in your linked account in under 5 minutes of a trigger event.",
  },
  {
    icon: ShieldCheck,
    title: "Comprehensive Coverage",
    body: "Every policy universally covers Heavy Rain, Extreme Heat, Severe AQI, and unexpected Civic Curfews.",
  },
  {
    icon: Bot,
    title: "AI Risk Scoring",
    body: "Your premium directly reflects your specific zone's historical and forecasted real-world disruption risk.",
  },
  {
    icon: Lock,
    title: "Fraud-Proof Network",
    body: "Real-time GPS validation combined with collective activity thresholds ensures payouts are completely accurate.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            {/* Section label */}
            <motion.p
              {...fadeUp(0)}
              className="mb-4"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "1rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--primary)",
                fontWeight: 600,
              }}
            >
              PLATFORM CAPABILITIES
            </motion.p>

            {/* Heading */}
            <motion.h2
              {...fadeUp(0.05)}
              className="mb-6"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "var(--foreground)",
              }}
            >
              Engineered for absolute reliability.
            </motion.h2>
            <motion.p
              {...fadeUp(0.1)}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1.125rem",
                lineHeight: 1.65,
                color: "var(--muted)",
              }}
            >
              We discarded the legacy insurance model. NammaShield is built on transparent, real-world data specifically to protect your weekly baseline.
            </motion.p>
          </div>
          
          <motion.div {...fadeUp(0.2)}>
            <button 
              className="group flex items-center gap-2 pb-1 text-sm font-medium transition-colors hover:text-[var(--primary)]"
              style={{ 
                fontFamily: "var(--font-body)",
                color: "var(--foreground)",
                borderBottom: "1px solid var(--border)"
              }}
            >
              View technical architecture
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>

        {/* 3x2 Grid */}
        <motion.div
          {...stagger}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp(0.1 + i * 0.05)}
              className="group flex flex-col relative"
            >
              <div 
                className="w-12 h-12 flex items-center justify-center rounded-xl mb-6 transition-all duration-300"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                }}
              >
                <f.icon 
                  size={20} 
                  className="transition-colors duration-300"
                  style={{ color: "var(--foreground)" }} 
                />
              </div>
              
              <h3
                className="mb-3 font-semibold transition-colors duration-300 group-hover:text-[var(--primary)]"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1.125rem",
                  color: "var(--foreground)",
                }}
              >
                {f.title}
              </h3>
              
              <p
                className="leading-relaxed"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.9375rem",
                  color: "var(--muted)",
                }}
              >
                {f.body}
              </p>
              
              {/* Subtle hover line effect */}
              <div 
                className="absolute -left-4 top-0 w-1 h-0 bg-[var(--primary)] transition-all duration-300 opacity-0 group-hover:h-full group-hover:opacity-100 rounded-full" 
                style={{ content: '""' }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   LANDING PAGE — Main Export
   ═══════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <StatsSection />
      <SimulatorSection />
      <CTASection />
      <Footer />
    </div>
  );
}
