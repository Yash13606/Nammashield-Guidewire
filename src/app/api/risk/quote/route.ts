import { NextRequest, NextResponse } from "next/server";
import { getRiskQuote } from "@/lib/risk/riskQuote";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      city?: string;
      zone?: string;
      streak_weeks?: number;
      tier?: string;
    };

    if (!body.city || !body.zone) {
      return NextResponse.json(
        { error: "city and zone are required" },
        { status: 400 }
      );
    }

    const quote = await getRiskQuote({
      city: body.city,
      zone: body.zone,
      streakWeeks: Number(body.streak_weeks ?? 0),
      preferredTier: body.tier,
    });

    return NextResponse.json(quote);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
