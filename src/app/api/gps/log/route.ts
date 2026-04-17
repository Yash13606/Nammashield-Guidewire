import { NextRequest, NextResponse } from "next/server";
import { insertGpsLog } from "@/lib/db/repositories/gpsRepository";

const lastLogByWorker = new Map<string, number>();
const RATE_MS = 60_000;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      worker_id?: string;
      lat?: number;
      lng?: number;
      is_active?: boolean;
    };

    const { worker_id, lat, lng, is_active = true } = body;
    if (!worker_id || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: "worker_id, lat, lng required" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const last = lastLogByWorker.get(worker_id) ?? 0;
    if (now - last < RATE_MS) {
      return NextResponse.json({ ok: true, rate_limited: true });
    }
    lastLogByWorker.set(worker_id, now);

    try {
      await insertGpsLog({
        worker_id,
        lat,
        lng,
        is_active,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "failed to insert GPS log";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
