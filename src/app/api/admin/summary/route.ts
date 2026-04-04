import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: polRows } = await supabaseAdmin
      .from("policies")
      .select("worker_id")
      .eq("status", "active");

    const activeWorkers = new Set((polRows ?? []).map((r) => r.worker_id)).size;

    const { count: activePolicies, error: pErr } = await supabaseAdmin
      .from("policies")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    if (pErr) throw pErr;

    const { data: policies } = await supabaseAdmin
      .from("policies")
      .select("weekly_premium")
      .eq("status", "active");

    const weeklyPremiums = (policies ?? []).reduce(
      (s, r) => s + Number(r.weekly_premium),
      0
    );

    const { data: payouts } = await supabaseAdmin
      .from("payout_log")
      .select("amount");

    const totalPayouts = (payouts ?? []).reduce(
      (s, r) => s + Number(r.amount),
      0
    );

    const lossRatio =
      weeklyPremiums > 0 ? (totalPayouts / weeklyPremiums) * 100 : 0;

    const { data: recentTriggers } = await supabaseAdmin
      .from("trigger_events")
      .select("id, event_type, city, zone, severity, started_at, is_simulated")
      .order("created_at", { ascending: false })
      .limit(10);

    const triggersWithCounts = await Promise.all(
      (recentTriggers ?? []).map(async (t) => {
        const { count } = await supabaseAdmin
          .from("claims")
          .select("*", { count: "exact", head: true })
          .eq("trigger_event_id", t.id);
        return { ...t, claim_count: count ?? 0 };
      })
    );

    const { data: triggerFreq } = await supabaseAdmin
      .from("trigger_events")
      .select("event_type");

    const freqMap: Record<string, number> = {};
    for (const row of triggerFreq ?? []) {
      const k = row.event_type ?? "unknown";
      freqMap[k] = (freqMap[k] ?? 0) + 1;
    }

    return NextResponse.json({
      activeWorkers: activeWorkers ?? 0,
      activePolicies: activePolicies ?? 0,
      weeklyPremiums,
      totalPayouts,
      lossRatio: Math.round(lossRatio * 10) / 10,
      recentTriggers: triggersWithCounts,
      triggerFrequency: Object.entries(freqMap).map(([name, value]) => ({
        name,
        value,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
