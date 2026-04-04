"use client";

import { Logo } from "@/components/namma/Logo";

const footerLinks = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Contact", href: "#" },
  { label: "GitHub", href: "#" },
];

export default function Footer() {
  return (
    <footer
      className="py-12 px-8"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Main content - two columns */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Left: Logo + tagline */}
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
            >
              <Logo size={40} />
            </div>
            <div>
              <p
                className="text-lg font-semibold"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--foreground)",
                }}
              >
                NammaShield
              </p>
              <p
                className="text-sm mt-0.5 max-w-xs"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--muted)",
                }}
              >
                Income protection for the backbone of India&apos;s delivery economy.
              </p>
            </div>
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm transition-colors duration-150 hover:underline"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--muted)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--foreground)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--muted)";
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-8 pt-6 text-center"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p
            className="text-xs"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--muted)",
            }}
          >
            &copy; 2026 NammaShield &middot; Built for Guidewire DEVTrails 2026 &middot; Team Astrax
          </p>
        </div>
      </div>
    </footer>
  );
}
