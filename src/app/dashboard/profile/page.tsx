"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Save, User, Bell, ShieldAlert, HandCoins, RadioTower } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useDashboardState } from "@/components/namma/DashboardStateProvider";
import {
  apiGetWorkerProfile,
  apiUpdateWorkerProfile,
  type NotificationPreferences,
} from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

type ProfileFormState = {
  name: string;
  city: string;
  zone: string;
  preferred_language: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

const defaultPrefs: NotificationPreferences = {
  worker_id: "",
  push_enabled: true,
  payout_enabled: true,
  trigger_enabled: true,
  fraud_enabled: true,
  profile_updates_enabled: true,
  created_at: "",
  updated_at: "",
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 p-3 rounded-xl"
      style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="mt-0.5" style={{ color: "var(--primary)" }}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {label}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className="relative h-6 w-11 rounded-full transition-colors"
        style={{ background: checked ? "var(--primary)" : "#D1D5DB" }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? "22px" : "2px" }}
        />
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const workerId = useAuthStore((s) => s.workerId);
  const { refresh } = useDashboardState();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileFormState>({
    name: "",
    city: "",
    zone: "",
    preferred_language: "en",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs);

  useEffect(() => {
    if (!workerId) return;
    let stopped = false;
    async function load() {
      setLoading(true);
      try {
        const data = await apiGetWorkerProfile(workerId);
        if (stopped) return;
        setForm({
          name: data.worker.name ?? "",
          city: data.worker.city ?? "",
          zone: data.worker.zone ?? "",
          preferred_language: data.worker.preferred_language ?? "en",
          emergency_contact_name: data.worker.emergency_contact_name ?? "",
          emergency_contact_phone: data.worker.emergency_contact_phone ?? "",
        });
        setPrefs(data.notificationPreferences ?? defaultPrefs);
      } catch (e) {
        console.error(e);
        if (!stopped) {
          toast({
            title: "Could not load profile",
            description: "Please refresh and try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!stopped) setLoading(false);
      }
    }
    void load();
    return () => {
      stopped = true;
    };
  }, [workerId]);

  const languageLabel = useMemo(() => {
    if (form.preferred_language === "ta") return "Tamil";
    if (form.preferred_language === "hi") return "Hindi";
    return "English";
  }, [form.preferred_language]);

  const setField = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setPref = (key: keyof NotificationPreferences, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    if (!workerId) return;
    setSaving(true);
    try {
      const data = await apiUpdateWorkerProfile(workerId, {
        name: form.name.trim() || null,
        city: form.city.trim() || null,
        zone: form.zone.trim() || null,
        preferred_language: form.preferred_language,
        emergency_contact_name: form.emergency_contact_name.trim() || null,
        emergency_contact_phone: form.emergency_contact_phone.trim() || null,
        push_enabled: prefs.push_enabled,
        payout_enabled: prefs.payout_enabled,
        trigger_enabled: prefs.trigger_enabled,
        fraud_enabled: prefs.fraud_enabled,
        profile_updates_enabled: prefs.profile_updates_enabled,
      });

      setPrefs(data.notificationPreferences ?? prefs);
      await refresh();
      toast({
        title: "Profile saved",
        description: `Your details were updated. Preferred language: ${languageLabel}.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Could not save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto space-y-6">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, #fff 55%, #FEF0E7 100%)",
          border: "1px solid rgba(232,93,26,0.18)",
          boxShadow: "0 8px 28px rgba(232,93,26,0.10)",
        }}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <User size={18} style={{ color: "var(--primary)" }} />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem" }}>Profile Center</h2>
        </div>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Manage worker identity, emergency contact, and alert preferences in one place.
        </p>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="lg:col-span-3 rounded-2xl p-6 bg-white"
          style={{ border: "1px solid var(--border)" }}
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: "var(--foreground)" }}>
            Personal & Location Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Full Name</span>
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl"
                style={{ border: "1px solid var(--border)", background: "white" }}
                placeholder="Enter your name"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Preferred Language</span>
              <select
                value={form.preferred_language}
                onChange={(e) => setField("preferred_language", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl"
                style={{ border: "1px solid var(--border)", background: "white" }}
              >
                <option value="en">English</option>
                <option value="ta">Tamil</option>
                <option value="hi">Hindi</option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>City</span>
              <input
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl"
                style={{ border: "1px solid var(--border)", background: "white" }}
                placeholder="e.g. Chennai"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Zone</span>
              <input
                value={form.zone}
                onChange={(e) => setField("zone", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl"
                style={{ border: "1px solid var(--border)", background: "white" }}
                placeholder="e.g. Zone 3 - T Nagar"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Emergency Contact Name</span>
              <input
                value={form.emergency_contact_name}
                onChange={(e) => setField("emergency_contact_name", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl"
                style={{ border: "1px solid var(--border)", background: "white" }}
                placeholder="Who should we contact?"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Emergency Contact Phone</span>
              <input
                value={form.emergency_contact_phone}
                onChange={(e) => setField("emergency_contact_phone", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl"
                style={{ border: "1px solid var(--border)", background: "white" }}
                placeholder="10-digit phone"
              />
            </label>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl p-6 bg-white space-y-3"
          style={{ border: "1px solid var(--border)" }}
        >
          <h3 className="text-base font-semibold mb-1" style={{ color: "var(--foreground)" }}>
            Notification Preferences
          </h3>

          <ToggleRow
            label="Push notifications"
            description="Master switch for all real-time alerts."
            checked={prefs.push_enabled}
            onChange={(value) => setPref("push_enabled", value)}
            icon={<Bell size={16} />}
          />
          <ToggleRow
            label="Payout updates"
            description="Get alerts when payout is credited or fails."
            checked={prefs.payout_enabled}
            onChange={(value) => setPref("payout_enabled", value)}
            icon={<HandCoins size={16} />}
          />
          <ToggleRow
            label="Trigger alerts"
            description="Notify when new disruption claims are generated."
            checked={prefs.trigger_enabled}
            onChange={(value) => setPref("trigger_enabled", value)}
            icon={<RadioTower size={16} />}
          />
          <ToggleRow
            label="Fraud review alerts"
            description="Notify if claims are watchlisted, flagged, or rejected."
            checked={prefs.fraud_enabled}
            onChange={(value) => setPref("fraud_enabled", value)}
            icon={<ShieldAlert size={16} />}
          />
        </motion.section>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
          style={{ background: "var(--primary)" }}
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
