-- NammaShield: worker profile extensions + notifications

ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

CREATE TABLE IF NOT EXISTS worker_notification_preferences (
  worker_id UUID PRIMARY KEY REFERENCES workers(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  payout_enabled BOOLEAN NOT NULL DEFAULT true,
  trigger_enabled BOOLEAN NOT NULL DEFAULT true,
  fraud_enabled BOOLEAN NOT NULL DEFAULT true,
  profile_updates_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS worker_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_worker_notifications_worker_time
  ON worker_notifications(worker_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_worker_notifications_unread
  ON worker_notifications(worker_id, is_read, created_at DESC);

ALTER TABLE worker_notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON worker_notification_preferences FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE worker_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON worker_notifications FOR ALL USING (true) WITH CHECK (true);