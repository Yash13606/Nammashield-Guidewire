import { NextRequest, NextResponse } from "next/server";
import { countUnreadWorkerNotifications, listWorkerNotifications } from "@/lib/db/repositories/notificationsRepository";

type Params = { params: { workerId: string } | Promise<{ workerId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { workerId } = await params;
    const limitRaw = Number(req.nextUrl.searchParams.get("limit") ?? "30");
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 30;
    const unreadOnly = req.nextUrl.searchParams.get("unread_only") === "true";

    const [notifications, unreadCount] = await Promise.all([
      listWorkerNotifications({ workerId, limit, unreadOnly }),
      countUnreadWorkerNotifications(workerId),
    ]);

    return NextResponse.json({
      notifications,
      unread_count: unreadCount,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}