/**
 * OSIRIS — Moldova Weather Normalizer
 */

import type { MoldovaWeatherStation } from '../types';

export function mapWeatherConditionCode(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if ([45, 48].includes(code)) return 'Fog / Depositing rime fog';
  if ([51, 53, 55].includes(code)) return 'Drizzle';
  if ([61, 63, 65].includes(code)) return 'Rain (Slight / Moderate / Heavy)';
  if ([71, 73, 75].includes(code)) return 'Snowfall';
  if ([80, 81, 82].includes(code)) return 'Rain showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm / Hail';
  return 'Cloudy / Fair';
}

export function normalizeWeatherStation(raw: {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  current: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    wind_gusts_10m?: number;
    surface_pressure?: number;
    weather_code?: number;
    precipitation?: number;
    uv_index?: number;
    visibility?: number;
  };
}): MoldovaWeatherStation {
  const c = raw.current || {};
  const code = c.weather_code ?? 0;
  return {
    id: raw.id,
    name: raw.name,
    district: raw.district,
    lat: raw.lat,
    lng: raw.lng,
    tempC: Math.round((c.temperature_2m ?? 15) * 10) / 10,
    feelsLikeC: Math.round((c.apparent_temperature ?? (c.temperature_2m ?? 15)) * 10) / 10,
    humidityPct: Math.round(c.relative_humidity_2m ?? 60),
    windSpeedKmh: Math.round((c.wind_speed_10m ?? 10) * 10) / 10,
    windDirectionDeg: Math.round(c.wind_direction_10m ?? 0),
    windGustKmh: c.wind_gusts_10m !== undefined ? Math.round(c.wind_gusts_10m * 10) / 10 : undefined,
    pressureHpa: Math.round(c.surface_pressure ?? 1013),
    condition: mapWeatherConditionCode(code),
    conditionCode: code,
    precipitationMm: Math.round((c.precipitation ?? 0) * 10) / 10,
    uvIndex: c.uv_index,
    visibilityKm: c.visibility ? Math.round(c.visibility / 100) / 10 : undefined,
    updatedAt: new Date().toISOString(),
  };
}
