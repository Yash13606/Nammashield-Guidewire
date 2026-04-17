import { createTriggerEvent, hasRecentTriggerByTypeAndZone } from "@/lib/db/repositories/triggersRepository";
import {
  getMockAqiSignal,
  getMockSocialSignal,
  getMockTrafficSignal,
} from "@/lib/triggers/mockFeeds";

export async function checkDisruptionFeedsAndMaybeInsert(city: string, zone: string) {
  const inserted: Array<{ id: string; event_type: string }> = [];

  const [aqi, traffic, social] = [
    getMockAqiSignal(city, zone),
    getMockTrafficSignal(city, zone),
    getMockSocialSignal(city, zone),
  ];

  const start = new Date();
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);

  if (aqi.level === "severe") {
    const hasRecent = await hasRecentTriggerByTypeAndZone({
      city,
      zone,
      eventType: "severe_aqi",
      windowMinutes: 180,
    });
    if (!hasRecent) {
      const row = await createTriggerEvent({
        event_type: "severe_aqi",
        city,
        zone,
        severity: "severe",
        threshold_value: aqi.aqi,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        source: aqi.source,
        is_simulated: false,
      });
      if (row?.id) inserted.push({ id: row.id, event_type: "severe_aqi" });
    }
  }

  if (traffic.level === "heavy") {
    const hasRecent = await hasRecentTriggerByTypeAndZone({
      city,
      zone,
      eventType: "traffic_gridlock",
      windowMinutes: 120,
    });
    if (!hasRecent) {
      const row = await createTriggerEvent({
        event_type: "traffic_gridlock",
        city,
        zone,
        severity: "moderate",
        threshold_value: traffic.congestion_index,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        source: traffic.source,
        is_simulated: false,
      });
      if (row?.id) inserted.push({ id: row.id, event_type: "traffic_gridlock" });
    }
  }

  if (social.reason !== "none") {
    const hasRecent = await hasRecentTriggerByTypeAndZone({
      city,
      zone,
      eventType: "civil_shutdown",
      windowMinutes: 360,
    });
    if (!hasRecent) {
      const row = await createTriggerEvent({
        event_type: "civil_shutdown",
        city,
        zone,
        severity: "severe",
        threshold_value: social.disruption_index,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        source: social.source,
        is_simulated: false,
      });
      if (row?.id) inserted.push({ id: row.id, event_type: "civil_shutdown" });
    }
  }

  return {
    inserted,
    feeds: {
      aqi,
      traffic,
      social,
    },
  };
}
