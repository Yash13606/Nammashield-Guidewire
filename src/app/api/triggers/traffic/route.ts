import { NextRequest, NextResponse } from "next/server";
import { getMockTrafficSignal } from "@/lib/triggers/mockFeeds";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  const zone = req.nextUrl.searchParams.get("zone");
  if (!city || !zone) {
    return NextResponse.json(
      { error: "city and zone query params required" },
      { status: 400 }
    );
  }

  const signal = getMockTrafficSignal(city, zone);
  return NextResponse.json(signal);
}
