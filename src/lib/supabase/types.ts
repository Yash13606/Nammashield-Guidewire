// TypeScript interfaces matching Supabase SQL migrations exactly

export interface Worker {
  id: string;
  phone: string;
  name: string | null;
  partner_id: string | null;
  city: string | null;
  zone: string | null;
  preferred_language: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  device_fingerprint: string | null;
  wallet_balance: number;
  streak_weeks: number;
  is_onboarded: boolean;
  created_at: string;
}

export interface Policy {
  id: string;
  worker_id: string;
  tier: string;
  weekly_premium: number;
  coverage_amount: number;
  risk_score: number;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export interface TriggerEvent {
  id: string;
  event_type: string;
  zone: string;
  city: string;
  severity: string;
  threshold_value: number;
  started_at: string;
  ended_at: string | null;
  source: string;
  is_simulated: boolean;
  created_at: string;
}

export interface Claim {
  id: string;
  worker_id: string;
  policy_id: string;
  trigger_event_id: string;
  active_score: number;
  fraud_score: number;
   anomaly_score: number | null;
   fraud_decision: string | null;
  covered_hours: number;
  payout_amount: number;
   payout_status: string | null;
   payout_channel: string | null;
   payout_processed_at: string | null;
   payout_failure_reason: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export interface GpsLog {
  id: string;
  worker_id: string;
  lat: number;
  lng: number;
  is_active: boolean;
  logged_at: string;
}

export interface PayoutLog {
  id: string;
  claim_id: string;
  worker_id: string;
  amount: number;
  wallet_balance_after: number;
  status: string;
  processed_at: string;
}

export interface Zone {
  id: string;
  city: string;
  zone_name: string;
  lat_min: number;
  lat_max: number;
  lng_min: number;
  lng_max: number;
  historical_disruption_freq: number;
  income_band_min: number;
  income_band_max: number;
}

export interface FraudAuditLog {
  id: string;
  claim_id: string;
  worker_id: string;
  reason_code: string;
  severity: string;
  score_impact: number;
  evidence_json: Record<string, unknown>;
  created_at: string;
}

export interface PayoutTransaction {
  id: string;
  claim_id: string;
  worker_id: string;
  gateway: string;
  channel: string;
  amount: number;
  status: string;
  provider_ref: string | null;
  retry_count: number;
  failure_code: string | null;
  failure_message: string | null;
  requested_at: string;
  processed_at: string | null;
}
