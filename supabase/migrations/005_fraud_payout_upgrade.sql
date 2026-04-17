-- NammaShield: Fraud + payout + weather evidence upgrades

-- Claims enrichments for anomaly and payout tracking
ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS anomaly_score NUMERIC,
  ADD COLUMN IF NOT EXISTS fraud_decision TEXT,
  ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS payout_channel TEXT,
  ADD COLUMN IF NOT EXISTS payout_processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_failure_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_claims_payout_status ON claims(payout_status);

-- Weather evidence table used to validate trigger/claim authenticity
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

-- Detailed fraud audit trail with reason codes
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

-- Gateway transaction lifecycle table for simulated payouts
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
