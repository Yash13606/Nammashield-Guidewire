import { NextRequest, NextResponse } from "next/server";

function hashUnit(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) / 0x7fffffff;
}

function normalizePlatform(platform: string) {
  const p = platform.trim().toLowerCase();
  if (p.includes("swiggy")) return "Swiggy";
  if (p.includes("zomato")) return "Zomato";
  return "Unknown";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      platform?: string;
      screenshot_name?: string;
    };

    if (!body.platform) {
      return NextResponse.json({ error: "platform is required" }, { status: 400 });
    }

    const platform = normalizePlatform(body.platform);
    if (platform === "Unknown") {
      return NextResponse.json(
        { error: "Only Swiggy or Zomato are supported in this mock" },
        { status: 400 }
      );
    }

    const basis = `${platform}|${body.screenshot_name ?? "upload"}|${new Date().toISOString().slice(0, 10)}`;
    const u = hashUnit(basis);
    const suffix = Math.floor(10000 + u * 89999);
    const prefix = platform === "Swiggy" ? "SWG" : "ZMT";

    return NextResponse.json({
      ok: true,
      platform,
      partnerId: `${prefix}-${suffix}`,
      confidence: Number((0.85 + u * 0.14).toFixed(2)),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
