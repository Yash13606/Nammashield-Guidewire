"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuthStore } from "@/lib/authStore";
import { apiGetDashboardState } from "@/lib/api/client";
import type { Policy, Worker } from "@/lib/supabase/types";

type DashboardState = {
  worker: Worker | null;
  policy: Policy | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const Ctx = createContext<DashboardState | null>(null);

export function DashboardStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const workerId = useAuthStore((s) => s.workerId);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!workerId) {
      setWorker(null);
      setPolicy(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { worker: w, policy: p } = await apiGetDashboardState(workerId);
      setWorker((w ?? null) as Worker | null);
      setPolicy((p ?? null) as Policy | null);
    } catch (e) {
      console.error(e);
      setError("Could not load profile");
      setWorker(null);
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!workerId) return;
    const id = window.setInterval(() => {
      void refresh();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [workerId, refresh]);

  const value = useMemo(
    () => ({ worker, policy, loading, error, refresh }),
    [worker, policy, loading, error, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboardState() {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useDashboardState outside DashboardStateProvider");
  }
  return v;
}
