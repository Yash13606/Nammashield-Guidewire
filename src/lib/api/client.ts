type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function requestJson<T>(input: string, init?: RequestOptions): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });

  if (!res.ok) {
    let message = "Request failed";
    try {
      const err = (await res.json()) as { error?: string };
      message = err.error ?? message;
    } catch {
      // keep fallback message
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export type DashboardStateResponse = {
  worker: import("@/lib/supabase/types").Worker | null;
  policy: import("@/lib/supabase/types").Policy | null;
};

export function apiLoginWithPhone(phone: string) {
  return requestJson<{ workerId: string; phone: string; isOnboarded: boolean }>("/api/auth/phone", {
    method: "POST",
    body: { phone },
  });
}

export function apiLoginAsDemo() {
  return requestJson<{ workerId: string; phone: string; isOnboarded: boolean }>("/api/auth/demo", {
    method: "POST",
  });
}

export function apiGetDashboardState(workerId: string) {
  return requestJson<DashboardStateResponse>(`/api/workers/${workerId}/dashboard`);
}

export function apiUpdateWorker(workerId: string, updates: Record<string, unknown>) {
  return requestJson<{ worker: import("@/lib/supabase/types").Worker }>(`/api/workers/${workerId}`, {
    method: "PATCH",
    body: updates,
  });
}

export type RiskQuoteResponse = {
  risk_score: number;
  tier: "Basic" | "Standard" | "Pro" | "Surge";
  weekly_premium: number;
  coverage_amount: number;
  discount_applied: boolean;
};

export function apiGetRiskQuote(payload: {
  city: string;
  zone: string;
  streak_weeks?: number;
  tier?: string;
}) {
  return requestJson<RiskQuoteResponse>("/api/risk/quote", {
    method: "POST",
    body: payload,
  });
}

export function apiVerifyPartnerMock(payload: {
  platform: string;
  screenshot_name?: string;
}) {
  return requestJson<{
    ok: boolean;
    platform: string;
    partnerId: string;
    confidence: number;
  }>("/api/platforms/verify-partner", {
    method: "POST",
    body: payload,
  });
}

export type DashboardFeedResponse = {
  triggers: Array<{
    id: string;
    event_type: string;
    severity: string;
    city: string;
    zone: string;
    started_at: string;
  }>;
  recentClaims: Array<{
    id: string;
    created_at: string;
    payout_amount: number;
    status: string;
    trigger_events: { event_type: string } | null;
  }>;
  coverageUsed: number;
  lifetimeProtected: number;
};

export function apiGetDashboardFeed(workerId: string, city: string, policyId?: string) {
  const params = new URLSearchParams({ city });
  if (policyId) params.set("policy_id", policyId);
  return requestJson<DashboardFeedResponse>(`/api/workers/${workerId}/dashboard-feed?${params.toString()}`);
}

export type WorkerClaimRow = {
  id: string;
  created_at: string;
  payout_amount: number;
  status: string;
  payout_status: string | null;
  payout_channel: string | null;
  payout_processed_at: string | null;
  payout_failure_reason: string | null;
  covered_hours: number | null;
  active_score: number | null;
  fraud_score: number | null;
  trigger_events: { event_type: string } | null;
};

export function apiGetWorkerClaims(
  workerId: string,
  options?: { limit?: number; since?: string; status?: string }
) {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) params.set("limit", String(options.limit));
  if (options?.since) params.set("since", options.since);
  if (options?.status) params.set("status", options.status);
  const qs = params.toString();
  return requestJson<{ claims: WorkerClaimRow[] }>(
    `/api/workers/${workerId}/claims${qs ? `?${qs}` : ""}`
  );
}

export function apiSwitchActivePolicy(workerId: string, payload: { tier: string }) {
  return requestJson<{ ok: true }>(`/api/workers/${workerId}/policy`, {
    method: "PATCH",
    body: payload,
  });
}

export function apiActivateOnboardingPolicy(
  workerId: string,
  payload: { tier: string }
) {
  return requestJson<{ ok: true }>(`/api/workers/${workerId}/onboarding/activate`, {
    method: "POST",
    body: payload,
  });
}

export type NotificationPreferences = {
  worker_id: string;
  push_enabled: boolean;
  payout_enabled: boolean;
  trigger_enabled: boolean;
  fraud_enabled: boolean;
  profile_updates_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkerNotification = {
  id: string;
  worker_id: string;
  category: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export function apiGetWorkerProfile(workerId: string) {
  return requestJson<{
    worker: import("@/lib/supabase/types").Worker;
    notificationPreferences: NotificationPreferences | null;
  }>(`/api/workers/${workerId}/profile`);
}

export function apiUpdateWorkerProfile(
  workerId: string,
  payload: Record<string, unknown>
) {
  return requestJson<{
    worker: import("@/lib/supabase/types").Worker;
    notificationPreferences: NotificationPreferences | null;
    message: string;
  }>(`/api/workers/${workerId}/profile`, {
    method: "PATCH",
    body: payload,
  });
}

export function apiGetWorkerNotifications(
  workerId: string,
  options?: { limit?: number; unreadOnly?: boolean }
) {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) params.set("limit", String(options.limit));
  if (options?.unreadOnly) params.set("unread_only", "true");
  const qs = params.toString();

  return requestJson<{ notifications: WorkerNotification[]; unread_count: number }>(
    `/api/workers/${workerId}/notifications${qs ? `?${qs}` : ""}`
  );
}

export function apiMarkWorkerNotificationRead(workerId: string, notificationId: string) {
  return requestJson<{ ok: boolean; message: string }>(`/api/workers/${workerId}/notifications/read`, {
    method: "PATCH",
    body: { notification_id: notificationId },
  });
}

export function apiMarkAllWorkerNotificationsRead(workerId: string) {
  return requestJson<{ ok: boolean; message: string }>(`/api/workers/${workerId}/notifications/read`, {
    method: "PATCH",
    body: { mark_all: true },
  });
}
