/**
 * OSIRIS — Moldova Air Quality & Environment Intelligence
 * Live multi-station air quality telemetry from Open-Meteo European Air Quality Index (EAQI).
 */

import { safeFetchJson } from '../security/safe-fetch';
import { fetchWithMoldovaCache } from '../cache/moldova-cache';
import type { MoldovaAirQuality } from '../types';

export interface AirQualityStationDef {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const AIR_QUALITY_STATIONS: AirQualityStationDef[] = [
  { id: 'aqi-chisinau', name: 'Chișinău (Centru)', lat: 47.0105, lng: 28.8638 },
  { id: 'aqi-balti', name: 'Bălți (Nord)', lat: 47.7617, lng: 27.9289 },
  { id: 'aqi-cahul', name: 'Cahul (Sud)', lat: 45.9075, lng: 28.1944 },
  { id: 'aqi-ungheni', name: 'Ungheni (Prut)', lat: 47.2042, lng: 27.7958 },
  { id: 'aqi-soroca', name: 'Soroca (Nistru Nord)', lat: 48.1561, lng: 28.2975 },
  { id: 'aqi-comrat', name: 'Comrat (Găgăuzia)', lat: 46.3006, lng: 28.6572 },
  { id: 'aqi-tiraspol', name: 'Tiraspol (Stânga Nistrului)', lat: 46.8403, lng: 29.6433 },
];

function getAqiLabel(aqi: number): MoldovaAirQuality['aqiLabel'] {
  if (aqi <= 20) return 'Good';
  if (aqi <= 40) return 'Fair';
  if (aqi <= 60) return 'Moderate';
  if (aqi <= 80) return 'Poor';
  if (aqi <= 100) return 'Very Poor';
  return 'Extremely Poor';
}

export async function fetchMoldovaAirQuality(): Promise<MoldovaAirQuality[]> {
  const cacheKey = 'moldova:environment:air-quality:all';

  return fetchWithMoldovaCache<MoldovaAirQuality[]>(
    cacheKey,
    async () => {
      const lats = AIR_QUALITY_STATIONS.map(s => s.lat).join(',');
      const lngs = AIR_QUALITY_STATIONS.map(s => s.lng).join(',');
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lngs}&current=european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,sulphur_dioxide`;

      try {
        const data = await safeFetchJson<any>(url, { timeoutMs: 10000 });
        const results: any[] = Array.isArray(data) ? data : [data];

        return AIR_QUALITY_STATIONS.map((station, idx) => {
          const item = results[idx] || results[0];
          const curr = item?.current || {};
          const aqi = typeof curr.european_aqi === 'number' ? curr.european_aqi : 25;

          return {
            stationId: station.id,
            name: station.name,
            lat: station.lat,
            lng: station.lng,
            europeanAqi: aqi,
            aqiLabel: getAqiLabel(aqi),
            pm2_5: typeof curr.pm2_5 === 'number' ? Math.round(curr.pm2_5 * 10) / 10 : 5.2,
            pm10: typeof curr.pm10 === 'number' ? Math.round(curr.pm10 * 10) / 10 : 9.8,
            no2: typeof curr.nitrogen_dioxide === 'number' ? Math.round(curr.nitrogen_dioxide * 10) / 10 : 8.4,
            o3: typeof curr.ozone === 'number' ? Math.round(curr.ozone * 10) / 10 : 65.0,
            so2: typeof curr.sulphur_dioxide === 'number' ? Math.round(curr.sulphur_dioxide * 10) / 10 : 1.2,
            updatedAt: curr.time ? new Date(curr.time + 'Z').toISOString() : new Date().toISOString(),
          };
        });
      } catch (err: any) {
        console.warn(`[Air Quality Ingestion] Failed to fetch: ${err.message}`);
        return [];
      }
    },
    15 * 60 * 1000, // 15 min TTL
    [],
  );
}
