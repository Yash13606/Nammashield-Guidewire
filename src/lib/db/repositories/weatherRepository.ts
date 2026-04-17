import { queryMaybeOne, queryRows, execute } from "@/lib/db/postgres";

export async function getZoneBounds(city: string, zone: string) {
  return queryMaybeOne<{
    lat_min: number;
    lat_max: number;
    lng_min: number;
    lng_max: number;
  }>(
    `SELECT lat_min::float8, lat_max::float8, lng_min::float8, lng_max::float8
     FROM zones
     WHERE lower(city) = lower($1)
       AND regexp_replace(lower(zone_name), '[^a-z0-9]+', '', 'g') = regexp_replace(lower($2), '[^a-z0-9]+', '', 'g')
     LIMIT 1`,
    [city, zone]
  );
}

export async function getZoneBoundsByCity(city: string) {
  return queryMaybeOne<{
    lat_min: number;
    lat_max: number;
    lng_min: number;
    lng_max: number;
  }>(
    "SELECT lat_min::float8, lat_max::float8, lng_min::float8, lng_max::float8 FROM zones WHERE city = $1 LIMIT 1",
    [city]
  );
}

export async function insertWeatherObservation(input: {
  city: string;
  zone: string;
  observed_at: string;
  rain_mm: number;
  condition_text: string;
  source: string;
}) {
  await execute(
    `INSERT INTO weather_observations (
      city, zone, observed_at, rain_mm, condition_text, source
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      input.city,
      input.zone,
      input.observed_at,
      input.rain_mm,
      input.condition_text,
      input.source,
    ]
  );
}

export async function getWeatherObservationsWindow(params: {
  city: string;
  zone: string;
  from: string;
  to: string;
  pincode?: string | null;
}) {
  if (params.pincode) {
    return queryRows<{
      rain_mm: number | null;
      condition_text: string | null;
      observed_at: string;
      pincode: string | null;
    }>(
      `SELECT rain_mm::float8, condition_text, observed_at::text AS observed_at, pincode
       FROM weather_observations
       WHERE lower(city) = lower($1)
         AND regexp_replace(lower(zone), '[^a-z0-9]+', '', 'g') = regexp_replace(lower($2), '[^a-z0-9]+', '', 'g')
         AND observed_at >= $3 AND observed_at <= $4 AND pincode = $5`,
      [params.city, params.zone, params.from, params.to, params.pincode]
    );
  }

  return queryRows<{
    rain_mm: number | null;
    condition_text: string | null;
    observed_at: string;
    pincode: string | null;
  }>(
    `SELECT rain_mm::float8, condition_text, observed_at::text AS observed_at, pincode
     FROM weather_observations
     WHERE lower(city) = lower($1)
       AND regexp_replace(lower(zone), '[^a-z0-9]+', '', 'g') = regexp_replace(lower($2), '[^a-z0-9]+', '', 'g')
       AND observed_at >= $3 AND observed_at <= $4`,
    [params.city, params.zone, params.from, params.to]
  );
}

export async function getWeatherObservationsSince(sinceIso: string) {
  return queryRows<{ city: string; zone: string; rain_mm: number | null; observed_at: string }>(
    `SELECT city, zone, rain_mm::float8, observed_at::text AS observed_at
     FROM weather_observations
     WHERE observed_at >= $1
     ORDER BY observed_at DESC`,
    [sinceIso]
  );
}
