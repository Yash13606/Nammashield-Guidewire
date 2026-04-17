import {
  getZoneBounds,
  getZoneBoundsByCity,
  insertWeatherObservation,
} from "@/lib/db/repositories/weatherRepository";
import { createTriggerEvent } from "@/lib/db/repositories/triggersRepository";

export type WeatherInsertResult = {
  triggered: boolean;
  trigger: Record<string, unknown> | null;
  rain_mm_hr?: number;
  temp?: number;
  feels_like?: number;
  reason?: string;
};

/**
 * Looks up zone coords (exact zone_name match, else first zone in city),
 * calls OpenWeatherMap current weather, inserts trigger if thresholds met.
 * Does not run the claims engine (per Phase 2 Section 6.1).
 */
export async function checkWeatherAndMaybeInsert(
  city: string,
  zone: string
): Promise<WeatherInsertResult> {
  const zrow = await getZoneBounds(city, zone);

  let lat: number;
  let lng: number;

  if (zrow) {
    lat = (Number(zrow.lat_min) + Number(zrow.lat_max)) / 2;
    lng = (Number(zrow.lng_min) + Number(zrow.lng_max)) / 2;
  } else {
    const fallback = await getZoneBoundsByCity(city);
    if (!fallback) {
      return { triggered: false, trigger: null, reason: "no_zone_for_city" };
    }
    lat = (Number(fallback.lat_min) + Number(fallback.lat_max)) / 2;
    lng = (Number(fallback.lng_min) + Number(fallback.lng_max)) / 2;
  }

  const key = process.env.OPENWEATHERMAP_API_KEY;
  if (!key) {
    return { triggered: false, trigger: null, reason: "missing_api_key" };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${key}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) {
    return { triggered: false, trigger: null, reason: "weather_http_error" };
  }

  const w = (await res.json()) as {
    rain?: { "1h"?: number };
    main?: { temp?: number; feels_like?: number };
  };

  const rain = w.rain?.["1h"] ?? 0;
  const temp = w.main?.temp ?? 0;
  const feels = w.main?.feels_like ?? 0;

  await insertWeatherObservation({
    city,
    zone,
    observed_at: new Date().toISOString(),
    rain_mm: rain,
    condition_text:
      rain > 0 ? "rain" : temp > 35 ? "hot_clear" : "clear",
    source: "openweather",
  });

  const rainTrigger = rain > 15;
  const heatTrigger = temp > 42 && feels > 48;

  if (!rainTrigger && !heatTrigger) {
    return {
      triggered: false,
      trigger: null,
      rain_mm_hr: rain,
      temp,
      feels_like: feels,
    };
  }

  const started = new Date();
  const ended = new Date(started.getTime() + 5 * 60 * 60 * 1000);

  const inserted = await createTriggerEvent({
      event_type: rainTrigger ? "heavy_rain" : "extreme_heat",
      zone,
      city,
      severity: "severe",
      threshold_value: rainTrigger ? rain : temp,
      started_at: started.toISOString(),
      ended_at: ended.toISOString(),
      source: "openweather",
      is_simulated: false,
    });

  if (!inserted) {
    return { triggered: false, trigger: null, reason: "insert_trigger_failed" };
  }

  return {
    triggered: true,
    trigger: inserted as Record<string, unknown>,
    rain_mm_hr: rain,
    temp,
    feels_like: feels,
  };
}
