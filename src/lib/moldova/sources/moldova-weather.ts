/**
 * OSIRIS — Moldova Weather Station Network
 * Live observations from multi-point meteorological stations across Republic of Moldova.
 */

import { MOLDOVA_CONFIG } from '../config';
import { normalizeWeatherStation } from '../normalizers/weather-normalizer';
import { fetchWithMoldovaCache } from '../cache/moldova-cache';
import type { MoldovaWeatherStation } from '../types';

const STATIONS = [
  { id: 'md-meteo-kiv', name: 'Stația Meteo Chișinău', district: 'Municipiul Chișinău', lat: 47.0105, lng: 28.8638 },
  { id: 'md-meteo-bzy', name: 'Stația Meteo Bălți', district: 'Municipiul Bălți', lat: 47.7617, lng: 27.9289 },
  { id: 'md-meteo-chl', name: 'Stația Meteo Cahul', district: 'Raionul Cahul', lat: 45.9075, lng: 28.1944 },
  { id: 'md-meteo-tir', name: 'Stația Meteo Tiraspol', district: 'Transnistria', lat: 46.8403, lng: 29.6433 },
  { id: 'md-meteo-sor', name: 'Stația Meteo Soroca', district: 'Raionul Soroca', lat: 48.1566, lng: 28.2849 },
  { id: 'md-meteo-com', name: 'Stația Meteo Comrat', district: 'UTA Găgăuzia', lat: 46.3006, lng: 28.6572 },
  { id: 'md-meteo-unh', name: 'Stația Meteo Ungheni', district: 'Raionul Ungheni', lat: 47.2042, lng: 27.7958 },
  { id: 'md-meteo-edi', name: 'Stația Meteo Edineț', district: 'Raionul Edineț', lat: 48.1681, lng: 27.3050 },
  { id: 'md-meteo-svd', name: 'Stația Meteo Ștefan Vodă', district: 'Raionul Ștefan Vodă', lat: 46.5139, lng: 29.6631 },
];

export async function fetchMoldovaWeather(): Promise<MoldovaWeatherStation[]> {
  const cacheKey = 'moldova:weather:stations';

  return fetchWithMoldovaCache<MoldovaWeatherStation[]>(
    cacheKey,
    async () => {
      const results = await Promise.allSettled(
        STATIONS.map(async (st) => {
          const params = new URLSearchParams({
            latitude: st.lat.toString(),
            longitude: st.lng.toString(),
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility',
            timezone: 'Europe/Chisinau',
          });

          const url = `${MOLDOVA_CONFIG.endpoints.openMeteo}?${params.toString()}`;
          const res = await fetch(url, {
            headers: { 'User-Agent': 'OSIRIS-Geospatial-Intelligence/2.0' },
          });

          if (!res.ok) {
            throw new Error(`Open-Meteo returned HTTP ${res.status} for ${st.name}`);
          }

          const json = await res.json();
          return normalizeWeatherStation({
            id: st.id,
            name: st.name,
            district: st.district,
            lat: st.lat,
            lng: st.lng,
            current: json.current,
          });
        })
      );

      const successful: MoldovaWeatherStation[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') {
          successful.push(r.value);
        }
      }

      return successful;
    },
    MOLDOVA_CONFIG.cacheTtl.weather,
    [],
  );
}
