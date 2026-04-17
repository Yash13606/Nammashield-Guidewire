<div align="center">

# 🛡️ NammaShield

### AI-Powered Parametric Income Protection for Gig Workers

**Zero-touch. Instant payouts. No paperwork.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?logo=supabase)](https://supabase.com/)
[![Python](https://img.shields.io/badge/Python-3.11-yellow?logo=python)](https://python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1-lightgrey?logo=flask)](https://flask.palletsprojects.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4-orange?logo=scikit-learn)](https://scikit-learn.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)

</div>

---

## 📌 Overview

NammaShield is a **parametric income protection platform** built specifically for delivery partners and gig workers. Traditional insurance is slow, expensive, and paperwork-heavy. NammaShield fixes this by automating the entire insurance lifecycle — from risk evaluation to instant UPI payouts — using machine learning and real-time data.

> When a disruption hits (heavy rain, extreme AQI, civil shutdown), **NammaShield automatically detects it, validates the claim using AI fraud detection, and credits the payout to the worker's wallet — all without the worker lifting a finger.**

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Risk Scoring** | Gradient Boosting model evaluates zone-specific weather & AQI risk to generate personalized weekly premiums |
| 🔍 **AI Fraud Detection** | ML classifier analyzes claim velocity, GPS zone coherence & device cluster data to auto-approve or flag claims |
| ⚡ **Parametric Triggers** | Event-based automatic payouts — no claim filing required |
| 💸 **Instant UPI Payouts** | Auto-approved claims credited directly to worker wallets |
| 📊 **Admin Dashboard** | Real-time zone monitoring, trigger simulation, watchlist management |
| 🔄 **Weekly Premium Engine** | Dynamic pricing with streak-based loyalty discounts |
| 🕐 **Cron Automation** | Automated trigger monitoring (every 15 min) and policy renewal (daily) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NammaShield Platform                     │
│                                                                 │
│  ┌──────────────────────┐     ┌──────────────────────────────┐  │
│  │   Next.js Frontend   │────▶│  Railway PostgreSQL Backend  │  │
│  │  (React 19 + TS)     │     │   (Primary App Database)     │  │
│  │                      │◀────│                              │  │
│  │  • Landing Page      │     └──────────────────────────────┘  │
│  │  • Worker Dashboard  │                                        │
│  │  • Admin Panel       │     ┌──────────────────────────────┐  │
│  │  • Claims View       │────▶│   Flask ML Microservice      │  │
│  │  • Policy Manager    │     │   (Python · scikit-learn)    │  │
│  │  • Risk Calculator   │◀────│                              │  │
│  └──────────────────────┘     │  • Risk Scoring Agent (GBR)  │  │
│             │                 │  • Fraud Detection Agent (GBC)│  │
│             ▼                 └──────────────────────────────┘  │
│  ┌──────────────────────┐                                        │
│  │   Scheduler/Cron     │                                        │
│  │  • Trigger Monitor   │                                        │
│  │  • Policy Renewal    │                                        │
│  └──────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 The Zero-Touch Workflow

NammaShield operates on a **zero-touch parametric model**. Workers never file claims — everything is automatic.

```
1. ONBOARD      →  Worker selects city & zone
       ↓
2. RISK SCORE   →  ML model evaluates zone's weather/AQI risk
       ↓               (Gradient Boosting Regressor)
3. PAY PREMIUM  →  Worker pays weekly premium (₹50–₹175)
       ↓               unlocking parametric coverage
4. MONITOR      →  System monitors zones via cron (every 15 min)
       ↓
5. TRIGGER      →  Disruption event detected in active zone
       ↓               (Heavy Rain / Extreme AQI / Civil Shutdown)
6. FRAUD CHECK  →  AI validates claim_velocity, zone_coherence,
       ↓               device_cluster → auto-approve / flag / review
7. PAYOUT       →  Instant UPI credit, proportional to disruption
```

---

## 🤖 Machine Learning Models

The ML layer is a **standalone Flask microservice** (`/ml`) deployed separately on Render.

### 1. Risk Scoring Agent — `Gradient Boosting Regressor`

Evaluates a worker's environmental exposure and loyalty to generate a risk score (0–100) which maps to a pricing tier.

| Input Feature | Description |
|---|---|
| `weather_risk` | Derived from city/zone historical weather patterns |
| `aqi_risk` | Air quality index exposure score for the zone |
| `streak_weeks` | Number of consecutive active policy weeks |

**Output Tiers:**

| Tier | Weekly Premium | Max Coverage |
|---|---|---|
| Basic | ₹50 | ₹350 |
| Standard | ₹100 | ₹700 |
| Pro | ₹175 | ₹1,200 |
| Surge | Dynamic | Dynamic |

---

### 2. Fraud Detection Agent — `Gradient Boosting Classifier`

Analyzes each claim before payout to prevent abuse.

| Input Feature | Description |
|---|---|
| `claim_velocity` | Number of claims filed in recent rolling window |
| `zone_coherence_score` | Match between claimed zone and GPS footprint |
| `same_device_cluster` | Whether multiple accounts share the same device |

**Decision thresholds:**

```
Fraud Probability < 0.30  →  ✅ Auto-Approved → Instant Payout
Fraud Probability 0.30–0.70  →  ⚠️  Added to Admin Watchlist
Fraud Probability > 0.70  →  🚫 Flagged for Manual Review
```

---

## 🗂️ Project Structure

```
NammaShield/
├── src/
│   ├── app/
│   │   ├── _landing/          # Landing page sections
│   │   ├── api/               # Next.js API routes
│   │   │   └── cron/          # Cron job handlers
│   │   ├── dashboard/
│   │   │   ├── admin/         # Admin panel (trigger simulation, watchlist)
│   │   │   ├── calculator/    # Premium risk calculator
│   │   │   ├── claims/        # Claims history & status
│   │   │   └── policy/        # Policy management
│   │   ├── onboarding/        # Worker onboarding flow
│   │   └── page.tsx           # Landing page
│   ├── components/            # Reusable UI components (shadcn/ui)
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Utilities, Postgres repos, Claims Engine
├── ml/
│   ├── api.py                 # Flask API server
│   ├── risk_model.py          # Risk scoring model
│   ├── fraud_model.py         # Fraud detection model
│   ├── train_data.py          # Synthetic training data generator
│   ├── requirements.txt       # Python dependencies
│   ├── render.yaml            # Render deployment config
│   └── Procfile               # Gunicorn process definition
├── supabase/
│   └── migrations/
│       ├── 001_workers.sql
│       ├── 002_policies.sql
│       ├── 003_core_tables.sql
│       ├── 004_zones.sql
│       ├── 005_fraud_payout_upgrade.sql
│       └── run_all.sql        # Run all migrations at once
├── public/                    # Static assets
├── vercel.json                # Vercel cron job config
├── railway.json               # Railway build/deploy config
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, shadcn/ui, Radix UI, Framer Motion |
| **Database** | Railway PostgreSQL (primary), Supabase (legacy compatibility) |
| **ML Service** | Python 3.11, Flask 3.1, scikit-learn 1.4, Gunicorn |
| **State Management** | Zustand, TanStack Query |
| **Forms** | React Hook Form, Zod |
| **Charts** | Recharts |
| **Deployment** | Railway (Backend + Postgres), Vercel (optional frontend scheduler), Render (ML Service) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **Python** ≥ 3.11
- A **Railway PostgreSQL** database
- (Optional) Supabase keys only for legacy endpoints not yet migrated

---

### 1. Clone the Repository

```bash
git clone https://github.com/Jagadwikyat/Nammashield.git
cd Nammashield
```

---

### 2. Install Frontend Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Railway Postgres (Primary backend DB)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME

# Backend-only ML base URL (recommended for Railway server runtime)
ML_API_URL=http://127.0.0.1:5000

# Public ML URL for browser features (calculator, UI calls)
NEXT_PUBLIC_ML_API_URL=http://127.0.0.1:5000

# Weather + Payout simulation
OPENWEATHERMAP_API_KEY=your_openweather_api_key
MOCK_UPI_FAIL_RATE=0.15

# Legacy Supabase vars (optional during migration window)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

> ✅ Railway cutover env priority:
> 1. `DATABASE_URL` (required for backend APIs + cron routes)
> 2. `ML_API_URL` (server-to-server ML calls from API/cron)
> 3. `NEXT_PUBLIC_ML_API_URL` (browser-facing ML calls)
> 4. Supabase vars only for legacy endpoints still using `supabaseAdmin`

---

### 4. Set Up the Database

Run the migrations in your **Railway Postgres SQL editor/client** in order:

```sql
-- Option A: Run all at once
-- Copy and paste contents of supabase/migrations/run_all.sql

-- Option B: Run individually (in order)
-- 001_workers.sql → 002_policies.sql → 003_core_tables.sql → 004_zones.sql
-- 005_fraud_payout_upgrade.sql
```

Required cutover tables after migrations:
- Core: `workers`, `policies`, `trigger_events`, `claims`, `gps_logs`, `payout_log`, `zones`
- Fraud/Payout upgrades: `weather_observations`, `fraud_audit_logs`, `payout_transactions`

Quick verification query:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'workers','policies','trigger_events','claims','gps_logs','payout_log','zones',
    'weather_observations','fraud_audit_logs','payout_transactions'
  )
ORDER BY table_name;
```

---

### 5. Set Up and Start the ML Microservice

```bash
cd ml

# Create and activate a Python virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Train the ML models (generates .pkl model files)
python train_data.py
python risk_model.py
python fraud_model.py

# Start the Flask API server
python api.py
```

The ML service will be running at `http://127.0.0.1:5000`.

---

### 6. Start the Next.js Application

Open a **new terminal** in the project root:

```bash
npm run dev
```

The app will be available at **`http://localhost:3000`** 🎉

---

## ☁️ Deployment

### Backend + DB → Railway (primary)

1. Create a Railway project for this repository.
2. Railway will use `railway.json`:
   - Build: `npm ci && npm run build`
   - Start: `npm run start`
   - Healthcheck: `GET /api`
3. Provision Railway Postgres and set `DATABASE_URL` on the app service.
4. Set backend env vars on Railway:
   - `DATABASE_URL` (required)
   - `ML_API_URL` (recommended server-side ML base URL)
   - `OPENWEATHERMAP_API_KEY`
   - `MOCK_UPI_FAIL_RATE`
5. Run SQL migrations on Railway Postgres (`run_all.sql` or 001→005 in order).

### Cron wiring for Railway-backed backend

Your cron endpoints live in the Next.js backend:
- `GET /api/cron/trigger-monitor`
- `GET /api/cron/renew-policies`

If backend is on Railway, schedule these URLs via Railway Cron (or any external scheduler).  
`vercel.json` cron config only applies when routes are executed from a Vercel deployment.

---

### ML Service → Render (or any Python host)

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Set the **Root Directory** to `ml/`.
4. Render will auto-detect `render.yaml` and configure the service:
   - **Build**: `pip install -r requirements.txt && python train_data.py && python risk_model.py && python fraud_model.py`
   - **Start**: `gunicorn api:app --bind 0.0.0.0:$PORT`
5. After deployment:
   - Set `ML_API_URL` on Railway backend service
   - Set `NEXT_PUBLIC_ML_API_URL` where browser clients are hosted (Vercel/Railway frontend)

---

## 📡 ML API Reference

Base URL: `http://127.0.0.1:5000` (local) or your Render deployment URL.

### Risk Score

```http
POST /ml/risk-score
Content-Type: application/json

{
  "city": "Bangalore",
  "zone": "Koramangala",
  "streak_weeks": 4
}
```

**Response:**
```json
{
  "risk_score": 62.4,
  "tier": "Standard",
  "weekly_premium": 100,
  "max_coverage": 700
}
```

---

### Fraud Detection

```http
POST /ml/fraud-score
Content-Type: application/json

{
  "claim_velocity": 2,
  "zone_coherence_score": 0.85,
  "same_device_cluster": 0
}
```

**Response:**
```json
{
  "fraud_score": 0.12,
  "decision": "auto_approved"
}
```

---

## 🗄️ Database Schema (Overview)

| Table | Description |
|---|---|
| `workers` | Delivery partner profiles and wallet balances |
| `policies` | Weekly coverage records with status and tier |
| `trigger_events` | Disruption events (Rain, AQI, Shutdown) by zone |
| `claims` | Claim records with payout status, fraud score, and anomaly score |
| `weather_observations` | Weather evidence used by trigger/fraud logic |
| `fraud_audit_logs` | Claim-level fraud reason codes and evidence |
| `payout_transactions` | Payout gateway lifecycle records |
| `zones` | City zone definitions and risk metadata |

---

## 📋 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `python api.py` | Start Flask ML service (inside `ml/`) |

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

Built with ❤️ for India's gig economy — protecting the people who keep our cities moving.

</div>
