import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";

interface AuthState {
  workerId: string | null;
  workerPhone: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;

  loginWithPhone: (phone: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  rehydrate: () => Promise<void>;
  setOnboardingComplete: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  workerId: null,
  workerPhone: null,
  isAuthenticated: false,
  isLoading: true,
  isOnboarded: false,

  loginWithPhone: async (phone: string) => {
    set({ isLoading: true });
    try {
      // Check if worker already exists
      const { data: existing, error: fetchError } = await supabase
        .from("workers")
        .select("id, phone, is_onboarded")
        .eq("phone", phone)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let workerId: string;
      let onboarded = false;

      if (existing) {
        workerId = existing.id;
        onboarded = Boolean(existing.is_onboarded);
      } else {
        const { data: newWorker, error: insertError } = await supabase
          .from("workers")
          .insert({ phone })
          .select("id, is_onboarded")
          .single();

        if (insertError) throw insertError;
        workerId = newWorker.id;
        onboarded = Boolean(newWorker.is_onboarded);
      }

      localStorage.setItem("nammashield_worker_id", workerId);
      localStorage.setItem("nammashield_worker_phone", phone);

      set({
        workerId,
        workerPhone: phone,
        isAuthenticated: true,
        isLoading: false,
        isOnboarded: onboarded,
      });
    } catch (error) {
      console.error("Login failed:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  loginAsDemo: async () => {
    set({ isLoading: true });
    try {
      const demoPhone = "+91 00000 00000";
      const demoCity = "Chennai";
      const demoZone = "Zone 4 — T. Nagar";

      // 1. Ensure demo worker exists
      const { data: worker, error: workerErr } = await supabase
        .from("workers")
        .upsert(
          {
            phone: demoPhone,
            name: "Demo Partner",
            city: demoCity,
            zone: demoZone,
            is_onboarded: true,
            streak_weeks: 3,
          },
          { onConflict: "phone" }
        )
        .select("id")
        .single();

      if (workerErr) throw workerErr;

      const workerId = worker.id;

      // 2. Check if a policy already exists for this demo worker
      const { data: existingPolicy } = await supabase
        .from("policies")
        .select("id")
        .eq("worker_id", workerId)
        .eq("status", "active")
        .maybeSingle();

      // 3. If no policy, call ML API for risk score and create one
      if (!existingPolicy) {
        let riskScore = 67;
        let tier = "Standard";
        let weeklyPremium = 100;
        let coverageAmount = 700;

        try {
          const mlBase = process.env.NEXT_PUBLIC_ML_API_URL ?? "http://localhost:5000";
          const mlRes = await fetch(`${mlBase}/ml/risk-score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ city: demoCity, zone: demoZone, streak_weeks: 3 }),
          });
          if (mlRes.ok) {
            const ml = await mlRes.json() as { risk_score: number; tier: string; weekly_premium: number };
            riskScore = ml.risk_score;
            tier = ml.tier;
            weeklyPremium = ml.weekly_premium;
            coverageAmount = weeklyPremium * 7;
          }
        } catch {
          // fall back to defaults above
        }

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Monday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        await supabase.from("policies").insert({
          worker_id: workerId,
          tier,
          weekly_premium: weeklyPremium,
          coverage_amount: coverageAmount,
          risk_score: riskScore,
          status: "active",
          week_start: weekStart.toISOString().split("T")[0],
          week_end: weekEnd.toISOString().split("T")[0],
        });
      }

      localStorage.setItem("nammashield_worker_id", workerId);
      localStorage.setItem("nammashield_worker_phone", demoPhone);

      set({
        workerId,
        workerPhone: demoPhone,
        isAuthenticated: true,
        isLoading: false,
        isOnboarded: true,
      });
    } catch (error) {
      console.error("Demo login failed:", error);
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("nammashield_worker_id");
    localStorage.removeItem("nammashield_worker_phone");
    set({
      workerId: null,
      workerPhone: null,
      isAuthenticated: false,
      isLoading: false,
      isOnboarded: false,
    });
  },

  setOnboardingComplete: () => set({ isOnboarded: true }),

  rehydrate: async () => {
    const savedId = localStorage.getItem("nammashield_worker_id");
    const savedPhone = localStorage.getItem("nammashield_worker_phone");

    if (savedId && savedPhone) {
      const { data, error } = await supabase
        .from("workers")
        .select("id, is_onboarded")
        .eq("id", savedId)
        .maybeSingle();

      if (data && !error) {
        set({
          workerId: savedId,
          workerPhone: savedPhone,
          isAuthenticated: true,
          isLoading: false,
          isOnboarded: Boolean(data.is_onboarded),
        });
        return;
      }

      localStorage.removeItem("nammashield_worker_id");
      localStorage.removeItem("nammashield_worker_phone");
    }

    set({ isLoading: false, isOnboarded: false });
  },
}));
