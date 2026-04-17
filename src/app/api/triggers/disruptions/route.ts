import { NextRequest, NextResponse } from "next/server";
import { getMockAqiSignal, getMockSocialSignal } from "@/lib/triggers/mockFeeds";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  const zone = req.nextUrl.searchParams.get("zone");
  if (!city || !zone) {
    return NextResponse.json(
      { error: "city and zone query params required" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    aqi: getMockAqiSignal(city, zone),
    social: getMockSocialSignal(city, zone),
  });
}
