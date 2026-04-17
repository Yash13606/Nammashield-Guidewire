import { NextRequest, NextResponse } from "next/server";
import { createWorkerNotification, getWorkerNotificationPreferences, updateWorkerNotificationPreferences } from "@/lib/db/repositories/notificationsRepository";
import { getWorkerById, updateWorkerProfile } from "@/lib/db/repositories/workersRepository";

type Params = { params: { workerId: string } | Promise<{ workerId: string }> };

const ALLOWED_PROFILE_FIELDS = new Set([
  "name",
  "city",
  "zone",
  "preferred_language",
  "emergency_contact_name",
  "emergency_contact_phone",
]);

const ALLOWED_PREF_FIELDS = new Set([
  "push_enabled",
  "payout_enabled",
  "trigger_enabled",
  "fraud_enabled",
  "profile_updates_enabled",
]);

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { workerId } = await params;

    const [worker, notificationPreferences] = await Promise.all([
      getWorkerById(workerId),
      getWorkerNotificationPreferences(workerId),
    ]);

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    return NextResponse.json({
      worker,
      notificationPreferences,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { workerId } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    const profileUpdates: Parameters<typeof updateWorkerProfile>[1] = {};
    const preferenceUpdates: Parameters<typeof updateWorkerNotificationPreferences>[1] = {};

    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_PROFILE_FIELDS.has(key)) {
        if (typeof value === "string" || value === null) {
          if (key === "name") profileUpdates.name = value;
          if (key === "city") profileUpdates.city = value;
          if (key === "zone") profileUpdates.zone = value;
          if (key === "preferred_language") profileUpdates.preferred_language = value;
          if (key === "emergency_contact_name") profileUpdates.emergency_contact_name = value;
          if (key === "emergency_contact_phone") profileUpdates.emergency_contact_phone = value;
        }
      }

      if (ALLOWED_PREF_FIELDS.has(key) && typeof value === "boolean") {
        if (key === "push_enabled") preferenceUpdates.push_enabled = value;
        if (key === "payout_enabled") preferenceUpdates.payout_enabled = value;
        if (key === "trigger_enabled") preferenceUpdates.trigger_enabled = value;
        if (key === "fraud_enabled") preferenceUpdates.fraud_enabled = value;
        if (key === "profile_updates_enabled") preferenceUpdates.profile_updates_enabled = value;
      }
    }

    if (Object.keys(profileUpdates).length === 0 && Object.keys(preferenceUpdates).length === 0) {
      return NextResponse.json({ error: "No supported profile fields to update" }, { status: 400 });
    }

    const [worker, notificationPreferences] = await Promise.all([
      updateWorkerProfile(workerId, profileUpdates),
      updateWorkerNotificationPreferences(workerId, preferenceUpdates),
    ]);

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    if (notificationPreferences?.profile_updates_enabled !== false) {
      await createWorkerNotification({
        worker_id: workerId,
        category: "profile",
        title: "Profile updated",
        message: "Your profile details were updated successfully.",
        metadata: {
          updated_fields: Object.keys(profileUpdates),
        },
      });
    }

    return NextResponse.json({
      worker,
      notificationPreferences,
      message: "Profile updated",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}