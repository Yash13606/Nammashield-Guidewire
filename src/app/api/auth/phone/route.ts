import { NextRequest, NextResponse } from "next/server";
import { createWorkerWithPhone, getWorkerByPhone } from "@/lib/db/repositories/workers";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { phone?: string };
    const phone = body.phone?.trim();

    if (!phone) {
      return NextResponse.json({ error: "phone required" }, { status: 400 });
    }

    const existing = await getWorkerByPhone(phone);

    if (existing) {
      return NextResponse.json({
        workerId: existing.id,
        phone: existing.phone,
        isOnboarded: Boolean(existing.is_onboarded),
      });
    }

    const created = await createWorkerWithPhone(phone);
    if (!created) throw new Error("Could not create worker");

    return NextResponse.json({
      workerId: created.id,
      phone: created.phone,
      isOnboarded: Boolean(created.is_onboarded),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
