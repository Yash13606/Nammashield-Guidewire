import { NextRequest, NextResponse } from "next/server";
import { updateWorkerProfile } from "@/lib/db/repositories/workersRepository";

const ALLOWED_FIELDS = new Set([
  "name",
  "partner_id",
  "city",
  "zone",
  "is_onboarded",
  "streak_weeks",
]);

type Params = { params: { workerId: string } | Promise<{ workerId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { workerId } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    const updates: Parameters<typeof updateWorkerProfile>[1] = {};
    for (const [key, value] of Object.entries(body)) {
      if (!ALLOWED_FIELDS.has(key) || value === undefined) continue;
      if (key === "name" && (typeof value === "string" || value === null)) updates.name = value;
      if (key === "partner_id" && (typeof value === "string" || value === null))
        updates.partner_id = value;
      if (key === "city" && (typeof value === "string" || value === null)) updates.city = value;
      if (key === "zone" && (typeof value === "string" || value === null)) updates.zone = value;
      if (key === "is_onboarded" && typeof value === "boolean") {
        updates.is_onboarded = value;
      }
      if (key === "streak_weeks" && typeof value === "number" && Number.isFinite(value)) {
        updates.streak_weeks = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No supported fields to update" }, { status: 400 });
    }

    const data = await updateWorkerProfile(workerId, updates);
    if (!data) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    return NextResponse.json({ worker: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
