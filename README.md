# NammaShield

Parametric income protection for gig workers — combining a Next.js frontend, Supabase realtime database, and a Flask-based Machine Learning microservice.

## The Zero-Touch Workflow

NammaShield operates on a **zero-touch** parametric model. Delivery partners do not need to file claims; payouts are automatic when a disruption occurs. 

1. **Onboarding & Risk Evaluation**: Workers select their operating city and zone. The **Active Risk ML model** evaluates the zone's historical weather and AQI risks to generate a personalized weekly premium.
2. **Policy Activation**: Workers pay their weekly premium, unlocking parametric coverage for that week.
3. **Trigger Detection**: The system monitors zones for disruptions. Our admin panel simulates detecting events like `Heavy Rain`, `Extreme Heat`, `Severe AQI`, and `Civil Shutdown`. 
4. **Automated Claims**: When a trigger occurs in an active zone, the Claims Engine calculates the disruption duration and loss of earning potential.
5. **AI Fraud Detection**: Before payout, the **Fraud ML model** analyzes the worker's recent claim velocity, zone coherence (GPS footprint), and device cluster data. High-confidence claims are auto-approved.
6. **Instant Payout**: Auto-approved claims are instantly processed and credited directly to the worker's wallet via **UPI (Simulated)**. No paperwork, no wait times.

## AI Usage & Machine Learning

The NammaShield backend utilizes a dedicated Python `Flask` microservice (`/ml`) powered by `scikit-learn`.

- **Risk Scoring Agent (Gradient Boosting Regressor)**: Uses deterministic hashing of the worker's city/zone to simulate real-world environmental exposure (`weather_risk`, `aqi_risk`) alongside their continuous `streak_weeks`. It generates a risk score out of 100, placing the worker into a pricing tier.
- **Fraud Detection Agent (Gradient Boosting Classifier)**: Uses synthetic features like `claim_velocity`, `zone_coherence_score`, and `same_device_cluster`. If the fraud probability is `<0.3`, it is auto-approved. If `0.3–0.7`, it enters the admin Watchlist. `>0.7` flags it for manual review.

## Trigger & Claim Logic

The parametric engine (`claimsEngine.ts`) evaluates any trigger event (Rain, AQI, Shutdown) hitting a specific city/zone boundary. 
- It identifies all workers with an `active` policy in that zone.
- It calculates an **Active Score** (a simulated GPS activity score to ensure the worker was actively online during the disruption).
- If the active score is `>0.35`, and the Fraud checks pass, a payout proportional to the disruption's duration is calculated and dispatched instantly.

## Weekly Pricing Model

Premiums are recalculated weekly to adjust to seasonal risks and reward consistency. 
- **Tiers**: `Basic` (₹50/week, up to ₹350 coverage), `Standard` (₹100/week, up to ₹700 coverage), `Pro` (₹175/week, up to ₹1200 coverage), and `Surge`.
- **Streak Discount**: Workers maintaining active policies consecutively receive lower normalized risk scores, ultimately unlocking more protective capability for lesser cost.

---

## Local Development Checklist

1. Clone the repo and install JS dependencies: `npm install`
2. Copy `.env.local.example` to `.env.local` or create it with your database variables.
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_db_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_db_key
   NEXT_PUBLIC_ML_API_URL=http://127.0.0.1:5000
   ```
3. Run SQL migrations in the Supabase SQL editor (`supabase/migrations/`)
4. **Start ML service**: 
   ```bash
   cd ml
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python train_data.py && python risk_model.py && python fraud_model.py
   python api.py
   ```
5. **Start the Next.js app**: `npm run dev` → `http://localhost:3000`
