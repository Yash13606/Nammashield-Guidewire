import { NextRequest, NextResponse } from "next/server";
import { markAllWorkerNotificationsRead, markWorkerNotificationRead } from "@/lib/db/repositories/notificationsRepository";

type Params = { params: { workerId: string } | Promise<{ workerId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { workerId } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      notification_id?: string;
      mark_all?: boolean;
    };

    if (body.mark_all) {
      await markAllWorkerNotificationsRead(workerId);
      return NextResponse.json({ ok: true, message: "All notifications marked as read" });
    }

    if (!body.notification_id) {
      return NextResponse.json(
        { error: "Provide notification_id or set mark_all=true" },
        { status: 400 }
      );
    }

    await markWorkerNotificationRead(workerId, body.notification_id);
    return NextResponse.json({ ok: true, message: "Notification marked as read" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}