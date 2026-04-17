-- ═══════════════════════════════════════════════════
-- NAMMASHIELD: FULL DATABASE SETUP
-- Run this entire script in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- ─── 001: Workers ───────────────────────────────────
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  partner_id TEXT,
  city TEXT,
  zone TEXT,
  device_fingerprint TEXT,
  wallet_balance NUMERIC DEFAULT 0,
  streak_weeks INTEGER DEFAULT 0,
  is_onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workers_phone ON workers(phone);

-- ─── 002: Policies ──────────────────────────────────
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  weekly_premium NUMERIC NOT NULL,
  coverage_amount NUMERIC NOT NULL,
  risk_score NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policies_worker ON policies(worker_id, status);

-- ─── 003: Core Tables ──────────────────────────────
CREATE TABLE IF NOT EXISTS trigger_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  zone TEXT NOT NULL,
  city TEXT NOT NULL,
  severity TEXT NOT NULL,
  threshold_value NUMERIC,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  source TEXT,
  is_simulated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trigger_events_city_zone ON trigger_events(city, zone);

CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
  trigger_event_id UUID REFERENCES trigger_events(id) ON DELETE CASCADE,
  active_score NUMERIC,
  fraud_score NUMERIC,
  covered_hours NUMERIC,
  payout_amount NUMERIC,
  status TEXT NOT NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_worker ON claims(worker_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);

CREATE TABLE IF NOT EXISTS gps_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  logged_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gps_logs_worker ON gps_logs(worker_id, logged_at);

CREATE TABLE IF NOT EXISTS payout_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  wallet_balance_after NUMERIC NOT NULL,
  status TEXT DEFAULT 'completed',
  processed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_log_worker ON payout_log(worker_id);

-- ─── 004: Zones + Seed Data ────────────────────────
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  zone_name TEXT NOT NULL,
  lat_min NUMERIC NOT NULL,
  lat_max NUMERIC NOT NULL,
  lng_min NUMERIC NOT NULL,
  lng_max NUMERIC NOT NULL,
  historical_disruption_freq NUMERIC DEFAULT 0.5,
  income_band_min NUMERIC NOT NULL,
  income_band_max NUMERIC NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_zones_city ON zones(city);

-- Chennai zones
INSERT INTO zones (city, zone_name, lat_min, lat_max, lng_min, lng_max, historical_disruption_freq, income_band_min, income_band_max) VALUES
  ('Chennai', 'Zone 1 — Adyar',       13.0000, 13.0120, 80.2400, 80.2600, 0.72, 3000, 3800),
  ('Chennai', 'Zone 2 — Anna Nagar',   13.0800, 13.0950, 80.2000, 80.2200, 0.68, 3000, 3800),
  ('Chennai', 'Zone 3 — T. Nagar',     13.0300, 13.0450, 80.2200, 80.2400, 0.75, 3000, 3800);

-- Mumbai zones
INSERT INTO zones (city, zone_name, lat_min, lat_max, lng_min, lng_max, historical_disruption_freq, income_band_min, income_band_max) VALUES
  ('Mumbai', 'Zone 4 — Andheri',    19.1100, 19.1300, 72.8400, 72.8700, 0.65, 3500, 4500),
  ('Mumbai', 'Zone 5 — Bandra',     19.0500, 19.0700, 72.8200, 72.8500, 0.70, 3500, 4500),
  ('Mumbai', 'Zone 6 — Juhu',       19.0900, 19.1100, 72.8200, 72.8400, 0.62, 3500, 4500);

-- Delhi zones
INSERT INTO zones (city, zone_name, lat_min, lat_max, lng_min, lng_max, historical_disruption_freq, income_band_min, income_band_max) VALUES
  ('Delhi', 'Zone 7 — Connaught Place',  28.6280, 28.6400, 77.2100, 77.2300, 0.58, 3200, 4200),
  ('Delhi', 'Zone 8 — Dwarka',           28.5700, 28.5900, 77.0300, 77.0600, 0.52, 3200, 4200),
  ('Delhi', 'Zone 9 — Nehru Place',      28.5400, 28.5600, 77.2400, 77.2600, 0.55, 3200, 4200);

-- Bengaluru zones
INSERT INTO zones (city, zone_name, lat_min, lat_max, lng_min, lng_max, historical_disruption_freq, income_band_min, income_band_max) VALUES
  ('Bengaluru', 'Zone 10 — Koramangala',   12.9300, 12.9450, 77.6100, 77.6350, 0.42, 3800, 5000),
  ('Bengaluru', 'Zone 11 — Indiranagar',   12.9700, 12.9850, 77.6300, 77.6500, 0.38, 3800, 5000),
  ('Bengaluru', 'Zone 12 — HSR Layout',    12.9050, 12.9250, 77.6300, 77.6550, 0.45, 3800, 5000);

-- ─── Row Level Security (permissive for demo) ──────
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON workers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON policies FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE trigger_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON trigger_events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON claims FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE gps_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON gps_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE payout_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON payout_log FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON zones FOR ALL USING (true) WITH CHECK (true);

-- ─── 005: Fraud + Payout Upgrades ────────────────────
ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS anomaly_score NUMERIC,
  ADD COLUMN IF NOT EXISTS fraud_decision TEXT,
  ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS payout_channel TEXT,
  ADD COLUMN IF NOT EXISTS payout_processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_failure_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_claims_payout_status ON claims(payout_status);

CREATE TABLE IF NOT EXISTS weather_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  zone TEXT NOT NULL,
  pincode TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  rain_mm NUMERIC DEFAULT 0,
  condition_text TEXT,
  source TEXT DEFAULT 'openweather',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weather_obs_zone_time
  ON weather_observations(city, zone, observed_at);

CREATE TABLE IF NOT EXISTS fraud_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  reason_code TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  score_impact NUMERIC DEFAULT 0,
  evidence_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fraud_audit_claim ON fraud_audit_logs(claim_id);
CREATE INDEX IF NOT EXISTS idx_fraud_audit_reason ON fraud_audit_logs(reason_code);

CREATE TABLE IF NOT EXISTS payout_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL DEFAULT 'upi_simulator',
  channel TEXT NOT NULL DEFAULT 'UPI_SIM',
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_ref TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  failure_code TEXT,
  failure_message TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payout_tx_claim ON payout_transactions(claim_id);
CREATE INDEX IF NOT EXISTS idx_payout_tx_status ON payout_transactions(status);

ALTER TABLE weather_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON weather_observations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE fraud_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON fraud_audit_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE payout_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON payout_transactions FOR ALL USING (true) WITH CHECK (true);
