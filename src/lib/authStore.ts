import { create } from "zustand";
import { apiGetDashboardState, apiLoginAsDemo, apiLoginWithPhone } from "@/lib/api/client";

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

export const useAuthStore = create<AuthState>((set) => ({
  workerId: null,
  workerPhone: null,
  isAuthenticated: false,
  isLoading: true,
  isOnboarded: false,

  loginWithPhone: async (phone: string) => {
    set({ isLoading: true });
    try {
      const session = await apiLoginWithPhone(phone);
      const workerId = session.workerId;
      const onboarded = session.isOnboarded;

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
      const session = await apiLoginAsDemo();
      const workerId = session.workerId;
      const demoPhone = session.phone;

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
      try {
        const { worker } = await apiGetDashboardState(savedId);
        if (worker) {
          set({
            workerId: savedId,
            workerPhone: savedPhone,
            isAuthenticated: true,
            isLoading: false,
            isOnboarded: Boolean(worker.is_onboarded),
          });
          return;
        }
      } catch {
        // handled below by clearing local session
      }

      localStorage.removeItem("nammashield_worker_id");
      localStorage.removeItem("nammashield_worker_phone");
    }

    set({ isLoading: false, isOnboarded: false });
  },
}));
