# NammaShield Project Context

NammaShield is a next-generation insurance platform for delivery partners, providing parametric protection against weather disruptions and surge events.

## 🛠 Tech Stack

### Frontend

- **Framework**: [Next.js 16.1.1 (App Router)](https://nextjs.org/)
- **Core**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4.x](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/), [GSAP](https://greensock.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

### Backend & Database

- **Database**: SQLite (local development)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: NextAuth.js (configured, but core flow is session-less for MVP)

---

## 🛣 Routing Structure (App Router)

The application uses a URL-based routing architecture for stability and deep-linking.

### Public Routes

- `/`: **Landing Page** - Multi-section high-fidelity hero, features, and CTA.
- `/onboarding`: **User Onboarding** - Step-by-step account activation flow.

### Dashboard Routes (Protected Layer)

All dashboard routes are wrapped in a persistent layout (`src/app/dashboard/layout.tsx`) that mounts the Sidebar and Topbar once.

- `/dashboard`: **Main Overview** - Real-time risk status, active coverage, and recent activity.
- `/dashboard/policy`: **Policy Management** - Plan comparison, premium details, and coverage window.
- `/dashboard/claims`: **Claims & Payouts** - Parametric trigger timeline and automatic payout history.
- `/dashboard/calculator`: **Risk Calculator** - Interactive tool to estimate premiums based on city zones and clean-history streaks.
- `/dashboard/admin`: **Admin Portal** - System-level controls and user management.

---

## 🎨 Design System

### Visual Identity

- **Primary Color**: `#E85D1A` (Namma Orange)
- **Secondary Color**: `var(--secondary)` (Soft Neutral)
- **Typography**:
  - **Display**: High-contrast Serif for impact.
  - **Body**: Clean Sans-Serif for readability.
  - **Mono**: Precise Sans for numbers and codes.

### Key Shared Components

Located in `src/components/namma/`:

- **RiskRing**: Circular SVG status indicator.
- **SegmentBar**: Multi-segmented progress bar for coverage capacity.
- **CountUp**: Animated numerical transitions for financial data.
- **TriggerRow**: Status list for weather/surge events.

---

## 💾 State Management

The application uses **Zustand** for global state (`src/lib/navigationStore.ts`):

- **User Role**: Controls access to the Admin portal.
- **Onboarding Status**: Managed via `isOnboarded` flag to handle entry-point redirects.
- **Navigation Logic**: While URLs drive the pages, the store tracks session-level user context.

---

## 📊 Data Flow

- **Mock Data**: Located in `src/lib/mockData.ts` for consistent UI development.
- **Database Entry**: Prisma is initialized for future persistence integration.
- **Redirects**: The root page (`/`) automatically redirects onboarded users to `/dashboard` to prioritize utility.

---

## 🏗 Admin & Meta

*Last Updated: 2026-04-03*
