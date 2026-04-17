# NammaShield

NammaShield is a parametric income protection platform for gig workers. When predefined disruption events occur in a worker's active zone, the platform auto-generates and evaluates claims, then processes payout outcomes without manual claim filing.

## Highlights

- Server-authoritative premium and coverage calculation
- Automated trigger monitoring and policy renewal
- ML-assisted risk and fraud scoring (Flask microservice)
- Worker and admin dashboards with claims and payout visibility
- Event-driven notifications for trigger, fraud, and payout status
- Railway-first deployment with PostgreSQL

## Architecture

- App runtime: Next.js (App Router, TypeScript)
- Database: PostgreSQL on Railway
- ML service: Flask + scikit-learn (deployed separately)
- Scheduler: cron endpoints triggered by Railway Cron or external scheduler

Flow summary:

1. Worker onboarding and zone selection
2. Risk quote generated from backend and ML signal
3. Policy activation with server-calculated premium and coverage
4. Scheduled trigger monitor ingests events and creates claims
5. Fraud scoring classifies claims
6. Payout processor executes success/failure flow and notifications

## Repository Structure

```
Nammashield/
  src/
    app/
      api/
      dashboard/
      onboarding/
    components/
    lib/
  ml/
    api.py
    risk_model.py
    fraud_model.py
  supabase/migrations/
  railway.json
  next.config.ts
  package.json
```

## Tech Stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL + pg
- Python 3.11, Flask, scikit-learn

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create `.env.local` in the project root:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
ML_API_URL=http://127.0.0.1:5000
NEXT_PUBLIC_ML_API_URL=http://127.0.0.1:5000
OPENWEATHERMAP_API_KEY=your_openweather_api_key
MOCK_UPI_FAIL_RATE=0.15
```

### 3) Run SQL migrations

Use Railway Postgres SQL editor and run:

- `supabase/migrations/run_all.sql`

### 4) Start ML service

```bash
cd ml
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python train_data.py
python risk_model.py
python fraud_model.py
python api.py
```

### 5) Start Next.js app

```bash
npm run dev
```

App URL: http://localhost:3000

## Judge Demo Path

Production URL:

- https://nammashield-guidewire-production.up.railway.app

Fast demo options:

- On onboarding, use "Use Demo User (Skip phone + onboarding)"
- Or call `POST /api/auth/demo` to get an onboarded fake profile session

The demo profile is prefilled with:

- Name, partner ID, city/zone
- Active policy context
- Ready-to-simulate claim and payout flows

## Deployment

This repository is configured for Railway-only app deployment.

### Railway (App + Postgres)

1. Create Railway project from this repository
2. Railway build/start from `railway.json`
3. Set env vars:
   - `DATABASE_URL`
   - `ML_API_URL`
   - `OPENWEATHERMAP_API_KEY`
   - `MOCK_UPI_FAIL_RATE`
4. Run migrations on Railway Postgres

### Cron endpoints

- `GET /api/cron/trigger-monitor`
- `GET /api/cron/renew-policies`

Schedule these through Railway Cron (or external scheduler hitting production URLs).

### ML service

Deploy `ml/` as a separate Python service (Render or equivalent), then point:

- `ML_API_URL` (backend)
- `NEXT_PUBLIC_ML_API_URL` (frontend)

## Selected API Endpoints

- `POST /api/auth/demo`
- `POST /api/risk/quote`
- `POST /api/platforms/verify-partner`
- `POST /api/triggers/simulate`
- `GET /api/workers/:workerId/claims`
- `GET /api/admin/summary`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## License

MIT
